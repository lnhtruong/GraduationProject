import fs from "fs"
import OpenAI from "openai"

/*
========================
CONFIG
========================
*/

const CFG = {

    INPUT: "input.srt",
    OUTPUT: "output.json",

    // These are no longer needed by the new prompt but kept for reference or if needed
    TOPIC: "JIRA Project Management",
    INCLUDE: "overview, setup, board view, tasks, AI Rovo",
    EXCLUDE: "Kevin Cookie Co specific, outro, intro",

    TARGET_MIN: 100,
    TARGET_MAX: 200,

    MERGE_MIN: 10, // Increased to get more "continuous blocks of speech"
    MERGE_MAX: 30,

    OPENAI_KEY: "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"
}

const ai = new OpenAI({ apiKey: CFG.OPENAI_KEY })


/*
========================
TIME
========================
*/

function sec(t) {

    const [h, m, rest] = t.split(":")
    const [s, ms] = rest.split(",")

    return (
        +h * 3600 +
        +m * 60 +
        +s +
        +ms / 1000
    )
}

function dur(a, b) {
    return sec(b) - sec(a)
}

function sumDur(list) {
    return list.reduce((t, s) => t + dur(s.start, s.end), 0)
}


/*
========================
PARSE SRT
========================
*/

function parse(srt) {

    const blocks = srt.trim().split("\n\n")

    return blocks.map((b, i) => {

        const l = b.split("\n")

        const [start, end] = l[1].split(" --> ")

        return {
            index: i + 1,
            start,
            end,
            text: l.slice(2).join(" ")
        }
    })
}


/*
========================
MERGE SEGMENTS
========================
*/

function mergeSeg(segs) {

    const out = []
    let cur = null

    for (const s of segs) {

        if (!cur) {
            cur = { ...s, lines: [{ index: s.index, text: s.text }] }
            continue
        }

        const curDur = dur(cur.start, cur.end)
        const nextDur = dur(s.start, s.end)

        if (curDur < CFG.MERGE_MIN) {

            cur.end = s.end
            cur.text += " " + s.text
            cur.lines.push({ index: s.index, text: s.text })
            continue
        }

        if (curDur + nextDur > CFG.MERGE_MAX) {

            out.push(cur)
            cur = { ...s, lines: [{ index: s.index, text: s.text }] }
            continue
        }

        cur.end = s.end
        cur.text += " " + s.text
        cur.lines.push({ index: s.index, text: s.text })
    }

    if (cur) out.push(cur)

    return out
}


/*
========================
FORMAT FOR LLM
========================
*/

function fmt(segs) {

    return segs
        .map((s, i) => {
            const d = dur(s.start, s.end).toFixed(2)
            const header = `[id:${i}] (${d}s)`
            const lines = s.lines.map(l => `${l.index} ${l.text}`).join("\n")
            return `${header}\n${lines}`
        })
        .join("\n\n")
}


/*
========================
LLM SELECT
========================
*/

async function pick(segs) {

    const list = fmt(segs)

    const promptText = fs.readFileSync("prompt.txt", "utf8")

    const prompt = `${promptText
        .replace(/\{\{TARGET_MIN\}\}/g, CFG.TARGET_MIN)
        .replace(/\{\{TARGET_MAX\}\}/g, CFG.TARGET_MAX)}\n\n## Input\n${list}\n`

    const r = await ai.chat.completions.create({

        model: "gpt-4o-mini",

        messages: [
            { role: "system", content: "You are an expert video producer. Follow the instructions and output only a JSON array." },
            { role: "user", content: prompt }
        ],

        temperature: 0
    })

    const content = r.choices[0].message.content.trim()
    console.log("\n===== LLM RESPONSE =====\n")
    console.log(content)
    console.log("\n========================\n")

    let selectedIds = []
    try {
        selectedIds = JSON.parse(content)
    } catch (e) {
        const match = content.match(/\[.*\]/s)
        if (match) selectedIds = JSON.parse(match[0])
    }

    return selectedIds
}


/*
========================
EXPAND UNTIL MIN DURATION
========================
*/

function expand(idx, segs) {

    const set = new Set(idx)

    let total = sumDur(idx.map(i => segs[i]))

    let left = Math.min(...idx) - 1
    let right = Math.max(...idx) + 1

    while (total < CFG.TARGET_MIN) {

        let added = false

        if (left >= 0) {

            set.add(left)

            total += dur(segs[left].start, segs[left].end)

            left--

            added = true
        }

        if (total >= CFG.TARGET_MIN) break

        if (right < segs.length) {

            set.add(right)

            total += dur(segs[right].start, segs[right].end)

            right++

            added = true
        }

        if (!added) break
    }

    return [...set].sort((a, b) => a - b)
}


/*
========================
BUILD HIGHLIGHT
========================
*/

function build(idx, segs) {
    return idx.map(i => segs[i])
}


/*
========================
WRITE SRT
========================
*/

function toSRT(segs) {

    return segs.map((s, i) => `
${i + 1}
${s.start} --> ${s.end}
${s.text}
`).join("")
}


/*
========================
ANALYZE OUTPUT
========================
*/

function analyze(out, all) {

    const total = sumDur(out)

    const avg = total / out.length

    const gaps = []

    for (let i = 0; i < out.length - 1; i++) {

        const g = sec(out[i + 1].start) - sec(out[i].end)

        gaps.push(g)
    }

    const big = gaps.filter(g => g > 60).length

    const coverage = total / sumDur(all)

    console.log("\n===== ANALYSIS =====\n")

    console.log("segments:", out.length)

    console.log("duration:", total.toFixed(1), "s")

    console.log("avg seg:", avg.toFixed(1), "s")

    console.log("coverage:", (coverage * 100).toFixed(1), "%")

    console.log("large gaps:", big)

}


/*
========================
MAIN
========================
*/

async function main() {

    console.log("loading...")

    const raw = fs.readFileSync(CFG.INPUT, "utf8")

    const segs = parse(raw)

    const merged = mergeSeg(segs)

    console.log("segments total:", segs.length)
    console.log("segments after merge:", merged.length)

    const selectedIds = await pick(merged)

    let selectedMerged = selectedIds.map(id => merged[id]).filter(Boolean)

    // Enforce TARGET_MAX: trim from the end until within limit
    let totalDur = sumDur(selectedMerged)
    while (totalDur > CFG.TARGET_MAX && selectedMerged.length > 1) {
        const removed = selectedMerged.pop()
        totalDur -= dur(removed.start, removed.end)
    }

    // Enforce TARGET_MIN: expand by adding neighboring merged segments
    // Use a Set of IDs currently selected to avoid duplicates
    const selectedSet = new Set(selectedMerged.map(m => merged.indexOf(m)))
    while (totalDur < CFG.TARGET_MIN) {
        // Find the smallest / largest selected id to expand outward
        const ids = [...selectedSet].sort((a, b) => a - b)
        const leftNeighbor = ids[0] - 1
        const rightNeighbor = ids[ids.length - 1] + 1
        let added = false
        if (leftNeighbor >= 0 && !selectedSet.has(leftNeighbor)) {
            selectedSet.add(leftNeighbor)
            totalDur += dur(merged[leftNeighbor].start, merged[leftNeighbor].end)
            added = true
        }
        if (totalDur >= CFG.TARGET_MIN) break
        if (rightNeighbor < merged.length && !selectedSet.has(rightNeighbor)) {
            selectedSet.add(rightNeighbor)
            totalDur += dur(merged[rightNeighbor].start, merged[rightNeighbor].end)
            added = true
        }
        if (!added) break
    }

    // Rebuild final list in time order from updated set
    selectedMerged = [...selectedSet].sort((a, b) => a - b).map(id => merged[id])

    // Extract all individual original segments
    const selectedOriginals = selectedMerged.flatMap(m => {
        return m.lines.map(line => segs.find(s => s.index === line.index))
    }).filter(Boolean)

    const originalIndices = selectedOriginals.map(s => s.index)

    fs.writeFileSync(CFG.OUTPUT, JSON.stringify(originalIndices))

    console.log("saved:", CFG.OUTPUT)
    console.log("selected original segments count:", selectedOriginals.length)
    console.log("total duration:", sumDur(selectedOriginals).toFixed(1), "s")

    // Generate the highlight.srt with granular blocks
    const srtContent = toSRT(selectedOriginals)
    fs.writeFileSync("highlight.srt", srtContent)
    console.log("saved: highlight.srt")
}

main()