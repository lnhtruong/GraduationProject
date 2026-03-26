import fs from "fs"
import OpenAI from "openai"

/*
========================
CONFIG
========================
*/
const CFG = {
    INPUT_SRT: "input.srt",
    INPUT_SEGMENTS: "output.json",  // from highlight pipeline
    OUTPUT: "quiz.json",

    TOPIC: "JIRA Project Management",
    NUM_QUESTIONS: 10,

    MODEL: "gpt-4o-mini",
    MAX_RETRIES: 2,
}

const ai = new OpenAI({ apiKey: process.env.OPENAI_KEY || "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" })

/*
========================
TIME UTILS
========================
*/
const sec = t => {
    const [h, m, r] = t.split(":")
    const [s, ms] = r.split(",")
    return +h * 3600 + +m * 60 + +s + +ms / 1000
}

function secToTimestamp(totalSec) {
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = Math.floor(totalSec % 60)
    const ms = Math.round((totalSec % 1) * 1000)
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`
}

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

/*
========================
BUILD SEGMENT MAP
Precompute for each segment:
  - originalStart / originalEnd: time in original video (seconds)
  - cutStart / cutEnd: time in highlight video (seconds, cumulative)

Example:
  segment 0: original 05:52–07:01 (69s) → cut 00:00–01:09
  segment 1: original 09:36–10:43 (67s) → cut 01:09–02:16
  segment 2: original 14:54–15:38 (44s) → cut 02:16–03:00
========================
*/
function buildSegmentMap(segments) {
    let cursor = 0
    return segments.map(seg => {
        const originalStart = sec(seg.start)
        const originalEnd = sec(seg.end)
        const duration = originalEnd - originalStart

        const entry = {
            originalStart,
            originalEnd,
            duration,
            cutStart: cursor,
            cutEnd: cursor + duration,
        }
        cursor += duration
        return entry
    })
}

/*
========================
REMAP TIMESTAMP
Convert a timestamp (seconds) from original video → highlight video.
If it falls in a gap between segments, snap to nearest segment boundary.
========================
*/
function remapTimestamp(originalSec, segmentMap) {
    for (const seg of segmentMap) {
        if (originalSec >= seg.originalStart && originalSec <= seg.originalEnd) {
            const offset = originalSec - seg.originalStart
            return seg.cutStart + offset
        }
    }

    // Falls in a gap — snap to nearest boundary
    let nearest = null
    let minDist = Infinity
    for (const seg of segmentMap) {
        const distStart = Math.abs(originalSec - seg.originalStart)
        const distEnd = Math.abs(originalSec - seg.originalEnd)
        if (distStart < minDist) { minDist = distStart; nearest = seg.cutStart }
        if (distEnd < minDist) { minDist = distEnd; nearest = seg.cutEnd }
    }
    console.warn(`  warning: ${secToTimestamp(originalSec)} falls in a gap — snapped to nearest boundary`)
    return nearest
}

/*
========================
REMAP ALL EVIDENCE IN QUIZ
Adds remapped start/end for highlight video,
keeps original timestamps for reference.
========================
*/
function remapQuizEvidence(questions, segmentMap) {
    return questions.map(q => {
        if (!q.evidence?.start || !q.evidence?.end) return q

        const startSec = sec(q.evidence.start)
        const endSec = sec(q.evidence.end)

        const remappedStart = remapTimestamp(startSec, segmentMap)
        const remappedEnd = remapTimestamp(endSec, segmentMap)

        return {
            ...q,
            evidence: {
                // original_start: q.evidence.start,
                // original_end: q.evidence.end,
                start: secToTimestamp(remappedStart),
                end: secToTimestamp(remappedEnd),
            }
        }
    })
}

/*
========================
BUILD TRANSCRIPT FROM SEGMENTS
Each line: "[HH:MM:SS,mmm --> HH:MM:SS,mmm] text"
Only selected subtitles — saves tokens, keeps LLM focused.
========================
*/
function buildTranscript(segments, allSegs) {
    const byIndex = Object.fromEntries(allSegs.map(s => [s.index, s]))
    const lines = []
    for (const seg of segments) {
        for (const idx of seg.subtitles) {
            const s = byIndex[idx]
            if (!s) continue
            lines.push(`[${s.start} --> ${s.end}] ${s.text}`)
        }
    }
    return lines.join("\n")
}

/*
========================
LLM CALL — with retry
========================
*/
async function llmJSON(systemMsg, userMsg, retries = CFG.MAX_RETRIES) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            console.log(`→ LLM [quiz]${attempt ? ` retry ${attempt}` : ""}`)
            const r = await ai.chat.completions.create({
                model: CFG.MODEL,
                messages: [
                    { role: "system", content: systemMsg },
                    { role: "user", content: userMsg }
                ],
                temperature: 0.2,
                response_format: { type: "json_object" },
            })

            const raw = r.choices[0].message.content.trim()
            const usage = r.usage
            console.log(`  tokens — prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens}`)
            console.log(`  est. cost: ~$${(usage.total_tokens / 1_000_000 * 0.15).toFixed(4)}`)

            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) return parsed
            const first = Object.values(parsed)[0]
            if (Array.isArray(first)) return first
            return parsed
        } catch (err) {
            if (attempt === retries) throw new Error(`[quiz] failed after ${retries + 1} attempts: ${err.message}`)
            console.warn(`  parse error, retrying…`)
        }
    }
}

/*
========================
GENERATE QUIZ
========================
*/
async function generateQuiz(transcript) {
    const systemMsg = `You are an expert instructional designer creating quiz questions from video transcripts.
Output only valid JSON with key "questions" containing an array. No markdown. No explanation.`

    const userMsg = `## Task
Create exactly ${CFG.NUM_QUESTIONS} multiple-choice quiz questions based on the transcript below.
Topic: ${CFG.TOPIC}

## Rules
- Each question must test a concrete fact, concept, or step shown in the video — not general knowledge.
- All 4 options must be plausible. Wrong answers should be common misconceptions, not obviously wrong.
- correct_index is 0-based (0 = first option).
- explanation: 1–2 sentences explaining why the correct answer is right and why the others are wrong.
- evidence: pick the EXACT timestamp range from the transcript where this appears. Use format "HH:MM:SS,mmm".
- Distribute questions evenly across the transcript — don't cluster at the start.
- Vary question types: facts, steps/sequence, purpose/rationale.

## Output format
{
  "questions": [
    {
      "id": 1,
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "...",
      "evidence": {
        "start": "HH:MM:SS,mmm",
        "end": "HH:MM:SS,mmm"
      }
    }
  ]
}

## Transcript
${transcript}`

    const result = await llmJSON(systemMsg, userMsg)
    const questions = Array.isArray(result) ? result : (result.questions ?? [])
    if (!questions.length) throw new Error("Quiz returned empty questions array")
    return questions
}

/*
========================
VALIDATE QUIZ
========================
*/
function validateQuiz(questions) {
    const issues = []
    for (const q of questions) {
        if (!q.question) issues.push(`Q${q.id}: missing question`)
        if (!Array.isArray(q.options) || q.options.length !== 4) issues.push(`Q${q.id}: options must have 4 items`)
        if (typeof q.correct_index !== "number" || q.correct_index < 0 || q.correct_index > 3) issues.push(`Q${q.id}: invalid correct_index`)
        if (!q.explanation) issues.push(`Q${q.id}: missing explanation`)
        if (!q.evidence?.start || !q.evidence?.end) issues.push(`Q${q.id}: missing evidence timestamps`)
    }
    if (issues.length) {
        console.warn("\n  validation issues:")
        issues.forEach(i => console.warn(`    - ${i}`))
    } else {
        console.log("  all questions valid ✓")
    }
    return issues.length === 0
}

/*
========================
MAIN
========================
*/
async function main() {
    console.log("=== quiz generator ===")
    console.log(`segments : ${CFG.INPUT_SEGMENTS}`)
    console.log(`srt      : ${CFG.INPUT_SRT}`)
    console.log(`output   : ${CFG.OUTPUT}`)
    console.log(`questions: ${CFG.NUM_QUESTIONS}\n`)

    if (!fs.existsSync(CFG.INPUT_SEGMENTS)) throw new Error(`${CFG.INPUT_SEGMENTS} not found — run highlight pipeline first`)
    if (!fs.existsSync(CFG.INPUT_SRT)) throw new Error(`${CFG.INPUT_SRT} not found`)

    const segments = JSON.parse(fs.readFileSync(CFG.INPUT_SEGMENTS, "utf8"))
    const allSegs = parseSRT(fs.readFileSync(CFG.INPUT_SRT, "utf8"))

    console.log(`loaded: ${segments.length} segments, ${allSegs.length} total subtitles`)

    // Build segment map
    const segmentMap = buildSegmentMap(segments)
    console.log("\nsegment map (original → highlight):")
    segmentMap.forEach((seg, i) => {
        console.log(
            `  [${i}] ${secToTimestamp(seg.originalStart)} – ${secToTimestamp(seg.originalEnd)}` +
            ` (${seg.duration.toFixed(1)}s)  →  cut: ${secToTimestamp(seg.cutStart)} – ${secToTimestamp(seg.cutEnd)}`
        )
    })

    // Build transcript (original timestamps — LLM needs these to pick evidence)
    const transcript = buildTranscript(segments, allSegs)
    console.log(`\ntranscript: ${transcript.split("\n").length} lines\n`)

    // Generate quiz
    const rawQuestions = await generateQuiz(transcript)
    console.log(`\ngenerated: ${rawQuestions.length} questions`)

    validateQuiz(rawQuestions)

    // Remap evidence timestamps: original → highlight
    const questions = remapQuizEvidence(rawQuestions, segmentMap)
    console.log("timestamps remapped to highlight video ✓")

    // Save
    const output = {
        meta: {
            topic: CFG.TOPIC,
            generated_at: new Date().toISOString(),
            num_questions: questions.length,
            source_segments: segments.length,
            highlight_duration_sec: +segmentMap.at(-1)?.cutEnd?.toFixed(1),
        },
        questions
    }

    fs.writeFileSync(CFG.OUTPUT, JSON.stringify(output, null, 2))
    console.log(`\nsaved: ${CFG.OUTPUT}`)

    // Preview first 3
    console.log("\n===== PREVIEW =====")
    questions.slice(0, 3).forEach(q => {
        console.log(`\nQ${q.id}: ${q.question}`)
        q.options.forEach((opt, i) => console.log(`  ${i === q.correct_index ? "✓" : " "} ${i + 1}. ${opt}`))
        console.log(`  📍 original : ${q.evidence.original_start} → ${q.evidence.original_end}`)
        console.log(`  📍 highlight: ${q.evidence.start} → ${q.evidence.end}`)
    })
    if (questions.length > 3) console.log(`\n  ... and ${questions.length - 3} more in ${CFG.OUTPUT}`)
    console.log("\n===================")
}

main().catch(err => { console.error(err); process.exit(1) })