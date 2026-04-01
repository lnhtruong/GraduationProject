import fs from "fs"
import OpenAI from "openai"
import dotenv from 'dotenv'
dotenv.config()
/*
========================
CONFIG
========================
*/
const CFG = {
    INPUT: "./input/hmt.srt",
    OUTPUT: "./output/output.json",

    TOPIC: "Hệ Mặt Trời (Solar System) — cấu trúc, thành phần, và cách hoạt động của hệ mặt trời",

    INCLUDE: "Mặt Trời; 8 hành tinh (Sao Thủy, Sao Kim, Trái Đất, Sao Hỏa, Sao Mộc, Sao Thổ, Sao Thiên Vương, Sao Hải Vương); hành tinh lùn (Pluto); vệ tinh tự nhiên (Mặt Trăng); vành đai tiểu hành tinh; vành đai Kuiper; đám mây Oort; sao chổi; tiểu hành tinh; thiên thạch; lực hấp dẫn; quỹ đạo; sự hình thành và tiến hóa của hệ mặt trời; chuyển động quay và chuyển động quanh Mặt Trời",
    EXCLUDE: "Lời chào hỏi, giới thiệu, khoảng im lặng, các thứ ngoài lề, Các chủ đề không liên quan đến hệ mặt trời như thiên văn học nói chung, các ngôi sao khác, các thiên hà khác, vũ trụ rộng lớn, các hiện tượng vũ trụ không liên quan trực tiếp đến hệ mặt trời (ví dụ: lỗ đen, sóng hấp dẫn), và các chủ đề khoa học khác như vật lý hạt, sinh học, công nghệ vũ trụ, v.v.",

    TARGET_MIN: 100,  // seconds
    TARGET_MAX: 300,  // seconds

    // Step 1: sample 1 subtitle every N seconds for outline call
    OUTLINE_SAMPLE_EVERY: 20,

    // Step 2: max chars per topic SRT slice sent to LLM (trim long topics)
    SELECT_CHARS_PER_TOPIC: 3000,

    MODEL: "gpt-4o-mini",
    MAX_RETRIES: 2,

    GROUP_SEGMENTS: false,
}

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/*
========================
TIME UTILS
========================
*/
const sec = t => { const [h, m, r] = t.split(":"); const [s, ms] = r.split(","); return +h * 3600 + +m * 60 + +s + +ms / 1000 }
const dur = (a, b) => sec(b) - sec(a)
const sumDur = list => list.reduce((t, s) => t + dur(s.start, s.end), 0)

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

// Step 1: downsample, drop timestamps → "[index] text"
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

// Step 2: compact format without timestamps to save tokens
function fmtCompact(segs) {
    return segs.map(s => `[${s.index}] ${s.text}`).join("\n")
}

/*
========================
LLM CALL — with retry
========================
*/
const tokens = { outline: 0, select: 0 }

async function llmJSON(systemMsg, userMsg, label, retries = CFG.MAX_RETRIES) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            console.log(`\n→ LLM [${label}]${attempt ? ` retry ${attempt}` : ""}`)
            const r = await ai.chat.completions.create({
                model: CFG.MODEL,
                messages: [
                    { role: "system", content: systemMsg },
                    { role: "user", content: userMsg }
                ],
                temperature: 0,
                response_format: { type: "json_object" },
            })

            const raw = r.choices[0].message.content.trim()
            const usage = r.usage
            if (label in tokens) tokens[label] += usage.total_tokens
            console.log(`  tokens — prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens}`)

            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) return parsed
            const first = Object.values(parsed)[0]
            if (Array.isArray(first)) return first
            return parsed
        } catch (err) {
            if (attempt === retries) throw new Error(`[${label}] failed after ${retries + 1} attempts: ${err.message}`)
            console.warn(`  [${label}] parse error, retrying…`)
        }
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

    const result = await llmJSON(
        'You are an expert video analyst. Output valid JSON with key "topics" containing an array of 4-12 major topics. You MUST provide an outline even if the transcript does NOT match the requested topic.',
        `${prompt}\n\n## Transcript\n\n${sampled}`,
        "outline"
    )

    const topics = Array.isArray(result) ? result : (result.topics ?? [])
    if (!topics.length) throw new Error("Outline returned empty topics array")
    return topics
}

/*
========================
STEP 2 — SELECT (single call, all topics)
========================
*/
async function selectIndices(outline, segs) {
    const prompt = fs.readFileSync("./prompts/select.txt", "utf8")
        .replace(/\{\{TARGET_MIN\}\}/g, CFG.TARGET_MIN)
        .replace(/\{\{TARGET_MAX\}\}/g, CFG.TARGET_MAX)

    const topicBlocks = outline.map(topic => {
        const slice = segs.filter(s => s.index >= topic.start_index && s.index <= topic.end_index)
        let transcript = fmtCompact(slice)
        if (transcript.length > CFG.SELECT_CHARS_PER_TOPIC) {
            const keep = CFG.SELECT_CHARS_PER_TOPIC
            transcript = transcript.slice(0, keep * 0.6) + "\n…\n" + transcript.slice(-keep * 0.4)
        }
        return { topic_id: topic.topic_id, title: topic.title, description: topic.description, transcript }
    })

    const userMsg = [
        prompt,
        "## Topics with transcript",
        JSON.stringify(topicBlocks, null, 2)
    ].join("\n\n")

    const result = await llmJSON(
        'You are an expert video editor. Output only valid JSON with key "indices" containing an array of integers.',
        userMsg,
        "select"
    )

    const indices = Array.isArray(result) ? result : (result.indices ?? [])
    if (!indices.length) throw new Error("Select returned empty indices array")
    return indices
}

/*
========================
VALIDATE — filter stale/out-of-range indices
========================
*/
function validateIndices(rawIndices, segs) {
    const valid = new Set(segs.map(s => s.index))
    const filtered = [...new Set(rawIndices)]
        .filter(i => Number.isInteger(i) && valid.has(i))
        .sort((a, b) => a - b)
    const dropped = rawIndices.length - filtered.length
    if (dropped) console.warn(`  dropped ${dropped} invalid indices`)
    return filtered
}

/*
========================
ENFORCE DURATION BOUNDS
- Trim từ giữa (subtitle ngắn nhất ở giữa), bảo vệ đầu và đuôi
- Expand từ ngoài vào nếu dưới min
========================
*/
function enforceBounds(indices, segs) {
    const byIndex = Object.fromEntries(segs.map(s => [s.index, s]))
    const allSorted = segs.map(s => s.index).sort((a, b) => a - b)
    const set = new Set(indices)

    const total = () => sumDur([...set].map(i => byIndex[i]).filter(Boolean))

    // Trim nếu vượt TARGET_MAX
    while (total() > CFG.TARGET_MAX && set.size > 1) {
        const sorted = [...set].sort((a, b) => a - b)

        // Chỉ xét các index ở giữa — bảo vệ sorted[0] và sorted[sorted.length - 1]
        const removable = sorted.slice(1, -1)
        if (!removable.length) {
            // Chỉ còn 2 index, không thể trim thêm mà không mất đầu/đuôi
            console.warn("  enforceBounds: cannot trim further without removing entry/exit — stopping")
            break
        }

        // Xóa subtitle có duration ngắn nhất trong phần giữa
        // (ít nội dung nhất, mất đi ít nhất)
        let minDur = Infinity
        let removeCandidate = null
        for (const i of removable) {
            const s = byIndex[i]
            if (!s) continue
            const d = dur(s.start, s.end)
            if (d < minDur) {
                minDur = d
                removeCandidate = i
            }
        }

        if (removeCandidate === null) break
        set.delete(removeCandidate)
    }

    // Expand nếu dưới TARGET_MIN
    while (total() < CFG.TARGET_MIN) {
        const sorted = [...set].sort((a, b) => a - b)
        const leftIdx = allSorted.indexOf(sorted[0]) - 1
        const rightIdx = allSorted.indexOf(sorted[sorted.length - 1]) + 1
        let added = false
        if (leftIdx >= 0) { set.add(allSorted[leftIdx]); added = true }
        if (total() >= CFG.TARGET_MIN) break
        if (rightIdx < allSorted.length) { set.add(allSorted[rightIdx]); added = true }
        if (!added) break
    }

    const result = [...set].sort((a, b) => a - b)

    // Log để debug
    const before = indices.length
    const after = result.length
    if (before !== after) {
        console.log(`  enforceBounds: ${before} → ${after} indices (total: ${total().toFixed(1)}s)`)
    }

    return result
}

/*
========================
GROUP CONTIGUOUS INDICES → SEGMENTS
========================
*/
function groupSegments(indices, segs) {
    if (!indices.length) return []
    const byIndex = Object.fromEntries(segs.map(s => [s.index, s]))

    if (CFG.GROUP_SEGMENTS === false) {
        return indices.map(i => ({
            start: byIndex[i].start,
            end: byIndex[i].end,
            subtitles: [i],
            duration: +dur(byIndex[i].start, byIndex[i].end).toFixed(1)
        }))
    }

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
        duration: +dur(byIndex[g[0]].start, byIndex[g[g.length - 1]].end).toFixed(1)
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

    const totalTokens = tokens.outline + tokens.select
    const estimatedCost = (totalTokens / 1_000_000 * 0.15).toFixed(4)

    console.log("\n===== ANALYSIS =====")
    console.log(`subtitles selected : ${selected.length}`)
    console.log(`total duration     : ${total.toFixed(1)}s  (target: ${CFG.TARGET_MIN}–${CFG.TARGET_MAX}s)`)
    console.log(`avg subtitle dur   : ${(total / selected.length).toFixed(1)}s`)
    console.log(`coverage           : ${(coverage * 100).toFixed(1)}%`)
    console.log(`gaps > 60s         : ${gaps.filter(g => g > 60).length}`)
    console.log(`outline tokens     : ${tokens.outline}`)
    console.log(`select  tokens     : ${tokens.select}`)
    console.log(`total tokens       : ${totalTokens}`)
    console.log(`est. cost (mini)   : ~$${estimatedCost}`)
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

    // Step 1: outline
    const outline = await getOutline(segs)
    console.log(`outline topics: ${outline.length}`)
    outline.forEach(t => console.log(`  [${t.start_index}–${t.end_index}] ${t.title}`))

    // Step 2: select
    const rawIndices = await selectIndices(outline, segs)
    const validIndices = validateIndices(rawIndices, segs)
    const finalIndices = enforceBounds(validIndices, segs)

    console.log(`indices: raw=${rawIndices.length} → valid=${validIndices.length} → after bounds=${finalIndices.length}`)

    // Build outputs
    const byIndex = Object.fromEntries(segs.map(s => [s.index, s]))
    const selected = finalIndices.map(i => byIndex[i]).filter(Boolean)
    const segments = groupSegments(finalIndices, segs)

    // Save highlight SRT
    const srtOut = segments.map((seg, i) => {
        const text = seg.subtitles.map(idx => byIndex[idx].text).join(" ")
        const start = seg.start.replace(",", ".")
        const end = seg.end.replace(",", ".")
        const srtIndex = seg.subtitles[0]
        return `${srtIndex}\n${start}->${end}\n${text}`
    }).join("\n\n")
    fs.writeFileSync("./output/highlight.srt", srtOut)
    console.log("saved: ./output/highlight.srt")

    analyze(selected, segs)
}

main().catch(err => { console.error(err); process.exit(1) })