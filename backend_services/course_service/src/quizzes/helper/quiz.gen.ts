import OpenAI from "openai"

/*
========================
TYPES
========================
*/
export interface QuizOption {
  optionText: string
  isCorrect: boolean
  orderIndex: number
}

export interface QuizQuestion {
  quesType: "mcq" | "short_text" | "true_false"
  quesText: string
  point: number
  correctExplanation?: string
  orderIndex: number
  options: QuizOption[],
  evidence: string
}

export interface QuizPayload {
//   lessonActivityId: number
  name: string
  shuffleQuestion: boolean
  shuffleOption: boolean
  passingScore: number
  timeLimitMinutes: number
  questions: QuizQuestion[]
}

export interface CreateQuizInput {
//   lessonActivityId: number
  name: string
  shuffleQuestion: boolean
  shuffleOption: boolean
  passingScore: number
  timeLimitMinutes: number
}

interface SRTSegment {
  index: number
  start: string
  end: string
  text: string
}

interface RawQuestion {
  id: number
  question: string
  options: string[]
  correct_index: number
  explanation: string
  evidence: string,
  type?: "mcq" | "short_text" | "true_false"
}

/*
========================
CONFIG
========================
*/
interface Config {
  TOPIC: string

  // Question type distribution (X, Y, Z — must sum to 100)
  PCT_MCQ: number        // X%
  PCT_TRUE_FALSE: number // Y%
  PCT_SHORT_TEXT: number // Z%

  // Points per question type
  POINT_MCQ: number
  POINT_TRUE_FALSE: number
  POINT_SHORT_TEXT: number

  // Seconds per question type (used to auto-calc count from timeLimitMinutes)
  SEC_PER_MCQ: number
  SEC_PER_TRUE_FALSE: number
  SEC_PER_SHORT_TEXT: number

  MODEL: string
  MAX_RETRIES: number
}

export const DEFAULT_CONFIG: Config = {
  TOPIC: "General",

  PCT_MCQ: 60,
  PCT_TRUE_FALSE: 20,
  PCT_SHORT_TEXT: 20,

  POINT_MCQ: 1,
  POINT_TRUE_FALSE: 1,
  POINT_SHORT_TEXT: 2,

  SEC_PER_MCQ: 60,
  SEC_PER_TRUE_FALSE: 30,
  SEC_PER_SHORT_TEXT: 90,

  MODEL: "gpt-4o-mini",
  MAX_RETRIES: 2,
}

/*
========================
PARSE SRT
========================
*/
function parseSRT(raw: string): SRTSegment[] {
  return raw
    .trim()
    .split("\n\n")
    .map((b, i) => {
      const l = b.split("\n")
      const [start, end] = l[1].split(" --> ")
      return { index: i + 1, start, end, text: l.slice(2).join(" ") }
    })
}

/*
========================
BUILD TRANSCRIPT
Simple flat transcript from all SRT segments.
Since srtRaw is already the highlight version, no remapping needed.
========================
*/
function buildTranscript(segs: SRTSegment[]): string {
  return segs.map((s) => `[${s.start} --> ${s.end}] ${s.text}`).join("\n")
}

/*
========================
AUTO CALC QUESTION COUNT
========================
*/
function calcNumQuestions(timeLimitMinutes: number, cfg: Config): number {
  const totalSec = timeLimitMinutes * 60
  const avgSecPerQuestion =
    (cfg.PCT_MCQ / 100) * cfg.SEC_PER_MCQ +
    (cfg.PCT_TRUE_FALSE / 100) * cfg.SEC_PER_TRUE_FALSE +
    (cfg.PCT_SHORT_TEXT / 100) * cfg.SEC_PER_SHORT_TEXT
  const count = Math.max(1, Math.round(totalSec / avgSecPerQuestion))
  console.log(
    `  auto question count: ${timeLimitMinutes}min / ~${avgSecPerQuestion.toFixed(1)}s per q = ${count} questions`
  )
  return count
}

/*
========================
LLM CALL
========================
*/
async function llmJSON(
  ai: OpenAI,
  systemMsg: string,
  userMsg: string,
  cfg: Config
): Promise<RawQuestion[]> {
  for (let attempt = 0; attempt <= cfg.MAX_RETRIES; attempt++) {
    try {
      console.log(`-> LLM [quiz]${attempt ? ` retry ${attempt}` : ""}`)
      const r = await ai.chat.completions.create({
        model: cfg.MODEL,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      })

      const raw = r.choices[0].message.content?.trim() ?? ""
      console.log(`  tokens — prompt: ${r.usage?.prompt_tokens}, completion: ${r.usage?.completion_tokens}`)

      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
      const first = Object.values(parsed)[0]
      if (Array.isArray(first)) return first as RawQuestion[]
      return parsed
    } catch (err) {
      if (attempt === cfg.MAX_RETRIES)
        throw new Error(`[quiz] failed after ${cfg.MAX_RETRIES + 1} attempts: ${(err as Error).message}`)
      console.warn(`  parse error, retrying...`)
    }
  }
  return []
}

/*
========================
GENERATE QUIZ
========================
*/
async function generateQuiz(
  ai: OpenAI,
  transcript: string,
  numQuestions: number,
  cfg: Config
): Promise<RawQuestion[]> {
  const systemMsg = `You are an expert instructional designer creating quiz questions from video transcripts.
Output only valid JSON with key "questions" containing an array. No markdown. No explanation.`

  const userMsg = `## Task
Create exactly ${numQuestions} quiz questions based on the transcript below.
Topic: ${cfg.TOPIC}

## Question type distribution
- ${cfg.PCT_MCQ}% should be "mcq" (4 options, one or many correct)
- ${cfg.PCT_TRUE_FALSE}% should be "true_false" (options: ["True", "False"])
- ${cfg.PCT_SHORT_TEXT}% should be "short_text" (one option, check percent match for correctness)

## Rules
- Each question must test a concrete fact, concept, or step shown in the video.
- For mcq: all 4 options must be plausible. Wrong answers = common misconceptions.
- correct_index is 0-based. For true_false: 0 = True, 1 = False.
- explanation: 1-2 sentences explaining the correct answer.
- evidence: pick the "start" timestamp from the transcript. Format "HH:MM:SS,mmm".
- Distribute questions evenly across the transcript.
- Use language suitable for transcript content and target audience.

## Output format
{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "...",
      "options": [
        { "optionText": "3", "isCorrect": false, "orderIndex": 1 },
        { "optionText": "4", "isCorrect": true, "orderIndex": 2 },
        { "optionText": "5", "isCorrect": true, "orderIndex": 3 },
        { "optionText": "6", "isCorrect": false, "orderIndex": 4 }
      ],
      "correct_index": 0,
      "explanation": "...",
      "evidence":  "HH:MM:SS,mmm",
    },
    {
      "id": 2,
      "type": "true_false",
      "question": "...",
      "options": [
        { "optionText": "True", "isCorrect": true, "orderIndex": 1 },
        { "optionText": "False", "isCorrect": false, "orderIndex": 2 }
      ],
      "correct_index": 0,
      "explanation": "...",
      "evidence":  "HH:MM:SS,mmm",
    },
    {
      "id": 3,
      "type": "short_text",
      "question": "...",
      "options": [
        { "optionText": "Input your answer here", "isCorrect": true, "orderIndex": 1 },
      ],
      "correct_index": 0,
      "explanation": "...",
      "evidence":  "HH:MM:SS,mmm",
    }
  ]
}

## Transcript
${transcript}`

  const result = await llmJSON(ai, systemMsg, userMsg, cfg)
  const questions: RawQuestion[] = Array.isArray(result)
    ? result
    : ((result as { questions?: RawQuestion[] }).questions ?? [])
  if (!questions.length) throw new Error("Quiz returned empty questions array")
  return questions
}

/*
========================
VALIDATE
========================
*/
function validateQuiz(questions: RawQuestion[]): void {
  const issues: string[] = []
  for (const q of questions) {
    if (!q.question) issues.push(`Q${q.id}: missing question`)
    if (q.type === "mcq" && (!Array.isArray(q.options) || q.options.length !== 4))
      issues.push(`Q${q.id}: mcq must have 4 options`)
    if (typeof q.correct_index !== "number" || q.correct_index < 0)
      issues.push(`Q${q.id}: invalid correct_index`)
    if (!q.explanation) issues.push(`Q${q.id}: missing explanation`)
    if (!q.evidence)
      issues.push(`Q${q.id}: missing evidence timestamps`)
  }
  if (issues.length) {
    console.warn("  validation issues:")
    issues.forEach((i) => console.warn(`    - ${i}`))
  } else {
    console.log("  all questions valid")
  }
}

/*
========================
MAP RAW -> API FORMAT
========================
*/
function mapToApiFormat(rawQuestions: RawQuestion[], cfg: Config): QuizQuestion[] {
  const pointMap: Record<string, number> = {
    mcq: cfg.POINT_MCQ,
    true_false: cfg.POINT_TRUE_FALSE,
    short_text: cfg.POINT_SHORT_TEXT,
  }

  return rawQuestions.map((q, i) => {
    const type = q.type ?? "mcq"

    let options: QuizOption[] = []
    if (type === "mcq") {
      options = q.options.map((opt, idx) => ({
        optionText: opt,
        isCorrect: idx === q.correct_index,
        orderIndex: idx + 1,
      }))
    } else if (type === "true_false") {
      options = [
        { optionText: "True", isCorrect: q.correct_index === 0, orderIndex: 1 },
        { optionText: "False", isCorrect: q.correct_index === 1, orderIndex: 2 },
      ]
    }
    // short_text -> options stays []

    return {
      quesType: type as QuizQuestion["quesType"],
      quesText: q.question,
      point: pointMap[type] ?? 1,
      correctExplanation: q.explanation,
      orderIndex: i + 1,
      options,
      evidence: q.evidence,
    }
  })
}

/*
========================
FINAL FUNCTION

@param srtRaw - Raw SRT string of the highlight video
@param input  - Quiz metadata from request body
@param cfg    - Optional config overrides (TOPIC, PCT_MCQ, etc.)
========================
*/
export async function createQuiz(
  srtRaw: string,
  input: CreateQuizInput,
  cfg: Partial<Config> = {}
): Promise<QuizPayload> {
  const config: Config = { ...DEFAULT_CONFIG, ...cfg }

  console.log("=== quiz generator ===")
  console.log(`quiz : ${input.name} (${input.timeLimitMinutes}min)\n`)

  const segs = parseSRT(srtRaw)
  console.log(`parsed: ${segs.length} subtitles`)

  const numQuestions = calcNumQuestions(input.timeLimitMinutes, config)
  const transcript = buildTranscript(segs)
  console.log(`transcript: ${segs.length} lines\n`)

  const ai = new OpenAI({ apiKey: process.env.OPENAI_KEY })
  const rawQuestions = await generateQuiz(ai, transcript, numQuestions, config)

  console.log(`\ngenerated: ${rawQuestions.length} questions`)
  validateQuiz(rawQuestions)

  const questions = mapToApiFormat(rawQuestions, config)

  return {
    // lessonActivityId: input.lessonActivityId,
    name: input.name,
    shuffleQuestion: input.shuffleQuestion,
    shuffleOption: input.shuffleOption,
    passingScore: input.passingScore,
    timeLimitMinutes: input.timeLimitMinutes,
    questions,
  }
}