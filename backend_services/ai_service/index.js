import fs from "fs"
import OpenAI from "openai"

/*
========================
CONFIG — edit this only
========================
*/
const CFG = {
    INPUT: "input.srt",
    OUTPUT: "output.json",

    TOPIC: "JIRA Project Management",
    INCLUDE: "overview, setup, board view, tasks, AI Rovo",
    EXCLUDE: "Kevin Cookie Co specific, outro, intro",

    TARGET_MIN: 100,  // seconds
    TARGET_MAX: 300,  // seconds

    // Step 1 optimization: sample 1 subtitle every N seconds for outline call
    // Higher = fewer tokens, less detail. Recommended: 15–30s for long videos.
    OUTLINE_SAMPLE_EVERY: 30,

    MODEL: "gpt-4o-mini",
    OPENAI_KEY: process.env.OPENAI_KEY ?? "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"
}

const ai = new OpenAI({ apiKey: CFG.OPENAI_KEY })
let outlineToken = 0
let selectToken = 0

/*
========================
TIME UTILS
========================
*/
function sec(t) {
    const [h, m, rest] = t.split(":")
    const [s, ms] = rest.split(",")
    return +h * 3600 + +m * 60 + +s + +ms / 1000
}

function dur(a, b) { return sec(b) - sec(a) }
function sumDur(list) { return list.reduce((t, s) => t + dur(s.start, s.end), 0) }


/*
========================
PARSE SRT
========================
*/
function parseSRT(raw) {
    return raw.trim().split("\n\n").map((b, i) => {
        const l = b.split("\n")
        const [start, end] = l[1].split(" --> ")
        return { index: i + 1, start, end, text: l.slice(2).join(" ") }
    })
}

function fmtSRT(segs) {
    return segs.map(s => `${s.index}\n${s.start} --> ${s.end}\n${s.text}`).join("\n\n")
}

// Step 1 only: downsample + drop timestamps to minimize tokens.
// Keeps 1 subtitle every OUTLINE_SAMPLE_EVERY seconds, format: "[index] text"
function fmtOutlineInput(segs) {
    const out = []
    let nextAt = 0
    for (const s of segs) {
        const t = sec(s.start)
        if (t >= nextAt) {
            out.push(`[${s.index}] ${s.text}`)
            nextAt = t + CFG.OUTLINE_SAMPLE_EVERY
        }
    }
    return out.join("\n")
}


/*
========================
LLM CALL — generic
========================
*/
async function llmJSON(systemMsg, userMsg, label) {
    console.log(`\n→ LLM call: ${label}`)

    const r = await ai.chat.completions.create({
        model: CFG.MODEL,
        messages: [
            { role: "system", content: systemMsg },
            { role: "user", content: userMsg }
        ],
        temperature: 0
    })

    const raw = r.choices[0].message.content.trim()
    const usage = r.usage
    if (label === "outline") {
        outlineToken += usage.total_tokens
    }
    if (label === "select") {
        selectToken += usage.total_tokens
    }
    console.log(`  tokens — prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens}, total: ${usage.total_tokens}`)
    console.log(`\n--- ${label} response ---\n${raw}\n---\n`)

    try {
        return JSON.parse(raw)
    } catch {
        const match = raw.match(/[\[{][\s\S]*[\]}]/)
        if (match) return JSON.parse(match[0])
        throw new Error(`${label}: failed to parse JSON`)
    }
}


/*
========================
STEP 1 — OUTLINE
========================
*/
async function getOutline(segs) {
    const prompt = fs.readFileSync("./prompts/outline.txt", "utf8")
        .replace(/\{\{TOPIC\}\}/g, CFG.TOPIC)
        .replace(/\{\{INCLUDE\}\}/g, CFG.INCLUDE)
        .replace(/\{\{EXCLUDE\}\}/g, CFG.EXCLUDE)

    const sampled = fmtOutlineInput(segs)
    console.log(`  outline input: ${segs.length} subtitles → ${sampled.split("\n").length} sampled lines`)

    return llmJSON(
        "You are an expert video analyst. Output only valid JSON.",
        `${prompt}\n\n## Transcript\n\n${sampled}`,
        "outline"
    )
}


/*
========================
STEP 2 — SELECT INDICES PER TOPIC
========================
*/
async function selectIndices(outline, segs) {
    const prompt = fs.readFileSync("./prompts/select.txt", "utf8")
        .replace(/\{\{TARGET_MIN\}\}/g, CFG.TARGET_MIN)
        .replace(/\{\{TARGET_MAX\}\}/g, CFG.TARGET_MAX)

    // Slice raw SRT per topic using index ranges from outline
    const topicBlocks = outline.map(topic => {
        const slice = segs.filter(s => s.index >= topic.start_index && s.index <= topic.end_index)
        return {
            topic_id: topic.topic_id,
            title: topic.title,
            description: topic.description,
            srt: fmtSRT(slice)
        }
    })

    const userMsg = [
        prompt,
        "## Topics with transcript slices",
        JSON.stringify(topicBlocks, null, 2)
    ].join("\n\n")

    return llmJSON(
        "You are an expert video editor. Output only a JSON array of integers.",
        userMsg,
        "select"
    )
}


/*
========================
ENFORCE DURATION BOUNDS
========================
*/
function enforceBounds(indices, segs) {
    const byIndex = Object.fromEntries(segs.map(s => [s.index, s]))
    const allSorted = segs.map(s => s.index).sort((a, b) => a - b)
    const set = new Set(indices)

    const total = () => sumDur([...set].map(i => byIndex[i]).filter(Boolean))

    // Trim from end if over max
    while (total() > CFG.TARGET_MAX && set.size > 1) {
        set.delete(Math.max(...set))
    }

    // Expand neighbors if under min
    while (total() < CFG.TARGET_MIN) {
        const sorted = [...set].sort((a, b) => a - b)
        const left = allSorted[allSorted.indexOf(sorted[0]) - 1]
        const right = allSorted[allSorted.indexOf(sorted[sorted.length - 1]) + 1]
        let added = false

        if (left !== undefined && !set.has(left)) { set.add(left); added = true }
        if (total() >= CFG.TARGET_MIN) break
        if (right !== undefined && !set.has(right)) { set.add(right); added = true }
        if (!added) break
    }

    return [...set].sort((a, b) => a - b)
}


/*
========================
GROUP CONTIGUOUS INDICES → SEGMENTS
========================
*/
function groupSegments(indices, segs) {
    if (indices.length === 0) return []

    const byIndex = Object.fromEntries(segs.map(s => [s.index, s]))
    const groups = []
    let group = [indices[0]]

    for (let i = 1; i < indices.length; i++) {
        if (indices[i] === indices[i - 1] + 1) {
            group.push(indices[i])
        } else {
            groups.push(group)
            group = [indices[i]]
        }
    }
    groups.push(group)

    return groups.map(g => ({
        start: byIndex[g[0]].start,
        end: byIndex[g[g.length - 1]].end,
        subtitles: g,
        duration: dur(byIndex[g[0]].start, byIndex[g[g.length - 1]].end).toFixed(1)
    }))
}


/*
========================
ANALYSIS
========================
*/
function analyze(selected, allSegs) {
    const total = sumDur(selected)
    const coverage = total / sumDur(allSegs)

    const gaps = []
    for (let i = 0; i < selected.length - 1; i++)
        gaps.push(sec(selected[i + 1].start) - sec(selected[i].end))

    console.log("\n===== ANALYSIS =====")
    console.log(`subtitles selected : ${selected.length}`)
    console.log(`total duration     : ${total.toFixed(1)}s`)
    console.log(`avg subtitle       : ${(total / selected.length).toFixed(1)}s`)
    console.log(`coverage           : ${(coverage * 100).toFixed(1)}%`)
    console.log(`gaps > 60s         : ${gaps.filter(g => g > 60).length}`)
    //Tokens used
    console.log(`Outline tokens     : ${outlineToken}`)
    console.log(`Select tokens      : ${selectToken}`)
    console.log(`Total tokens       : ${outlineToken + selectToken}`)
    console.log("====================\n")
}


/*
========================
MAIN
========================
*/
async function main() {
    console.log("=== highlight pipeline ===")
    console.log(`topic   : ${CFG.TOPIC}`)
    console.log(`include : ${CFG.INCLUDE}`)
    console.log(`exclude : ${CFG.EXCLUDE}`)
    console.log(`target  : ${CFG.TARGET_MIN}s – ${CFG.TARGET_MAX}s\n`)

    const raw = fs.readFileSync(CFG.INPUT, "utf8")
    const segs = parseSRT(raw)
    console.log(`subtitles: ${segs.length}`)

    // Step 1: understand structure → outline with index ranges
    const outline = await getOutline(segs)
    console.log(`outline topics: ${outline.length}`)

    // Step 2: select subtitle indices using per-topic SRT slices
    const rawIndices = await selectIndices(outline, segs)
    const finalIndices = enforceBounds(rawIndices, segs)

    // Build final segments
    const byIndex = Object.fromEntries(segs.map(s => [s.index, s]))
    const selected = finalIndices.map(i => byIndex[i]).filter(Boolean)

    // Group contiguous indices → clean segments
    const segments = groupSegments(finalIndices, segs)

    // Save outputs
    fs.writeFileSync(CFG.OUTPUT, JSON.stringify(segments, null, 2))
    console.log(`saved: ${CFG.OUTPUT}`)
    console.log(`segments: ${segments.length} (from ${finalIndices.length} subtitles)`)

    const srtOut = segments
        .map((seg, i) => {
            const text = seg.subtitles
                .map(idx => byIndex[idx].text)
                .join(" ")
            return `${i + 1}\n${seg.start} --> ${seg.end}\n${text}`
        })
        .join("\n\n")
    fs.writeFileSync("highlight.srt", srtOut)
    console.log("saved: highlight.srt")

    analyze(selected, segs)
}

main()