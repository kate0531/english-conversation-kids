import { NextRequest, NextResponse } from "next/server";
import { getOpenAIApiKey } from "@/lib/openai";

export const maxDuration = 45;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMsg = { role: "system" | "user"; content: string };

function stripJsonFence(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function chatOnce(apiKey: string, messages: ChatMsg[], maxTokens: number): Promise<string | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.35,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

function normalizeToken(t: string): string {
  return t.toLowerCase().replace(/[^a-z]/g, "");
}

function tokenizeEnglish(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

const GENERIC_WORDS = new Set([
  "why",
  "what",
  "where",
  "when",
  "who",
  "how",
  "do",
  "does",
  "did",
  "you",
  "your",
  "like",
  "about",
  "more",
  "tell",
  "me",
  "is",
  "are",
  "it",
  "that",
  "this",
  "the",
  "a",
  "an",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "and",
  "or",
  "favorite",
  "usually",
  "often",
  "can",
]);

const FANTASY_OUT_OF_CONTEXT = new Set([
  "ghost",
  "zombie",
  "vampire",
  "werewolf",
  "alien",
  "monster",
  "dragon",
]);

function hasOutOfContextFantasyWord(candidate: string, contextText: string): boolean {
  const c = tokenizeEnglish(candidate).map(normalizeToken);
  const ctx = new Set(tokenizeEnglish(contextText).map(normalizeToken));
  return c.some((w) => FANTASY_OUT_OF_CONTEXT.has(w) && !ctx.has(w));
}

function hasWeakContextMatch(candidate: string, contextText: string): boolean {
  const cWords = tokenizeEnglish(candidate)
    .map(normalizeToken)
    .filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w));
  if (cWords.length === 0) return false;
  const ctx = new Set(tokenizeEnglish(contextText).map(normalizeToken));
  const matched = cWords.filter((w) => ctx.has(w)).length;
  // 내용어가 2개 이상인데 맥락 일치가 전혀 없으면 어색할 가능성이 큼
  return cWords.length >= 2 && matched === 0;
}

export async function POST(req: NextRequest) {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 503 });
  }

  try {
    const body = (await req.json()) as {
      topic?: string;
      situation?: string;
      previousAiQuestion?: string;
      userAnswer?: string;
      recentDialogue?: string;
      plannedNextQuestion?: string;
      plannedNextQuestionKo?: string;
      nextUserHint?: string;
      nextUserKeywords?: string[];
    };

    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const situation = typeof body.situation === "string" ? body.situation.trim() : "";
    const previousAiQuestion =
      typeof body.previousAiQuestion === "string" ? body.previousAiQuestion.trim() : "";
    const userAnswer = typeof body.userAnswer === "string" ? body.userAnswer.trim() : "";
    const recentDialogue =
      typeof body.recentDialogue === "string" ? body.recentDialogue.trim() : "";
    const plannedNextQuestion =
      typeof body.plannedNextQuestion === "string" ? body.plannedNextQuestion.trim() : "";
    const plannedNextQuestionKo =
      typeof body.plannedNextQuestionKo === "string" ? body.plannedNextQuestionKo.trim() : "";
    const nextUserHint = typeof body.nextUserHint === "string" ? body.nextUserHint.trim() : "";
    const nextUserKeywords = Array.isArray(body.nextUserKeywords)
      ? body.nextUserKeywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean)
      : [];

    if (!topic || !userAnswer || !plannedNextQuestion) {
      return NextResponse.json(
        { error: "topic, userAnswer, plannedNextQuestion required" },
        { status: 400 }
      );
    }

    const messages: ChatMsg[] = [
      {
        role: "system",
        content: `You are an English conversation tutor for Korean elementary learners.
Given the student's ACTUAL answer, rewrite only the next AI follow-up question so it clearly follows the context.
Rules:
- Keep CEFR A1-A2 simple English.
- Must be a true follow-up to the student's answer.
- Never contradict the student's answer (example: if student says cat, do NOT ask about dog).
- Keep the key entity/topic from student answer. If the student says cat, ask about cat/that pet, never dog.
- Keep question length <= 14 words.
- Keep friendly tone.
- Provide Korean translation of the NEW English question.
- Keep topic consistency with conversation history.
- Bad example: Student: "I like cats." -> "Why do you like dogs?"
- Good example: Student: "I like cats." -> "Nice! What do you like about cats?"
- Return JSON only:
{
  "questionEn": "...",
  "questionKo": "...",
  "focusKeywords": ["...","...","..."],
  "nextUserHint": "..."
}`,
      },
      {
        role: "user",
        content: `Topic: ${topic}
Situation: ${situation || "(none)"}
Recent dialogue:
${recentDialogue || "(none)"}
Previous AI question: ${previousAiQuestion || "(none)"}
Student answer: ${userAnswer}
Planned next AI question (can be adjusted): ${plannedNextQuestion}
Planned Korean text: ${plannedNextQuestionKo || "(none)"}
Planned user hint after this question: ${nextUserHint || "(none)"}
Planned user keywords: ${nextUserKeywords.join(", ") || "(none)"}`,
      },
    ];

    const raw = await chatOnce(apiKey, messages, 260);
    if (!raw) {
      return NextResponse.json({ error: "OpenAI request failed" }, { status: 502 });
    }

    let parsed: {
      questionEn?: string;
      questionKo?: string;
      focusKeywords?: string[];
      nextUserHint?: string;
    };
    try {
      parsed = JSON.parse(stripJsonFence(raw)) as {
        questionEn?: string;
        questionKo?: string;
        focusKeywords?: string[];
        nextUserHint?: string;
      };
    } catch {
      return NextResponse.json({ error: "Invalid JSON from model", raw }, { status: 502 });
    }

    const questionEn = (parsed.questionEn ?? "").trim();
    const questionKo = (parsed.questionKo ?? "").trim();
    const focusKeywords = Array.isArray(parsed.focusKeywords)
      ? parsed.focusKeywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean).slice(0, 6)
      : [];
    const updatedHint = (parsed.nextUserHint ?? "").trim();

    if (!questionEn) {
      return NextResponse.json({ error: "questionEn missing" }, { status: 502 });
    }

    const contextText = [
      topic,
      situation,
      previousAiQuestion,
      userAnswer,
      plannedNextQuestion,
      plannedNextQuestionKo,
      nextUserHint,
      nextUserKeywords.join(" "),
      recentDialogue,
    ]
      .filter(Boolean)
      .join(" ");

    const localInvalid =
      hasOutOfContextFantasyWord(questionEn, contextText) ||
      hasWeakContextMatch(questionEn, contextText);

    if (localInvalid) {
      return NextResponse.json({
        questionEn: plannedNextQuestion,
        questionKo: plannedNextQuestionKo || plannedNextQuestion,
        focusKeywords: nextUserKeywords.slice(0, 6),
        nextUserHint: nextUserHint || undefined,
        usedFallback: true,
      });
    }

    const verifyMessages: ChatMsg[] = [
      {
        role: "system",
        content: `You verify if a follow-up question is context-consistent for elementary English conversation.
Return JSON only:
{
  "isValid": true/false,
  "fixedQuestionEn": "...",
  "fixedQuestionKo": "...",
  "focusKeywords": ["..."],
  "nextUserHint": "..."
}
Rules:
- If valid, keep same meaning (you may lightly polish grammar).
- If invalid or awkward, rewrite into a natural follow-up tightly tied to user's answer.
- Never introduce unrelated entities.`,
      },
      {
        role: "user",
        content: `Context:
Topic: ${topic}
Situation: ${situation || "(none)"}
Previous AI question: ${previousAiQuestion || "(none)"}
Student answer: ${userAnswer}
Recent dialogue:
${recentDialogue || "(none)"}
Planned next question: ${plannedNextQuestion}

Candidate question EN: ${questionEn}
Candidate question KO: ${questionKo || "(none)"}
Candidate keywords: ${focusKeywords.join(", ") || "(none)"}
Candidate next hint: ${updatedHint || "(none)"}`,
      },
    ];

    const verifyRaw = await chatOnce(apiKey, verifyMessages, 220);
    if (!verifyRaw) {
      return NextResponse.json({
        questionEn,
        questionKo: questionKo || plannedNextQuestionKo || plannedNextQuestion,
        focusKeywords,
        nextUserHint: updatedHint || nextUserHint || undefined,
      });
    }

    try {
      const verified = JSON.parse(stripJsonFence(verifyRaw)) as {
        isValid?: boolean;
        fixedQuestionEn?: string;
        fixedQuestionKo?: string;
        focusKeywords?: string[];
        nextUserHint?: string;
      };
      const fixedEn = (verified.fixedQuestionEn ?? "").trim();
      const fixedKo = (verified.fixedQuestionKo ?? "").trim();
      const fixedKeywords = Array.isArray(verified.focusKeywords)
        ? verified.focusKeywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean).slice(0, 6)
        : [];
      const fixedHint = (verified.nextUserHint ?? "").trim();

      if (verified.isValid === false && fixedEn) {
        return NextResponse.json({
          questionEn: fixedEn,
          questionKo: fixedKo || plannedNextQuestionKo || fixedEn,
          focusKeywords: fixedKeywords.length ? fixedKeywords : focusKeywords,
          nextUserHint: fixedHint || updatedHint || nextUserHint || undefined,
        });
      }
      return NextResponse.json({
        questionEn: fixedEn || questionEn,
        questionKo: fixedKo || questionKo || plannedNextQuestionKo || plannedNextQuestion,
        focusKeywords: fixedKeywords.length ? fixedKeywords : focusKeywords,
        nextUserHint: fixedHint || updatedHint || nextUserHint || undefined,
      });
    } catch {
      return NextResponse.json({
        questionEn,
        questionKo: questionKo || plannedNextQuestionKo || plannedNextQuestion,
        focusKeywords,
        nextUserHint: updatedHint || nextUserHint || undefined,
      });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

