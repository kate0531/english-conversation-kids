import { NextRequest, NextResponse } from "next/server";
import { getOpenAIApiKey } from "@/lib/openai";

export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

async function chatCompletion(messages: ChatMsg[], opts?: { temperature?: number; max_tokens?: number }) {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return { ok: false as const, status: 503, error: "OPENAI_API_KEY not set" };
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: opts?.temperature ?? 0.35,
      max_tokens: opts?.max_tokens ?? 900,
    }),
  });
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    return {
      ok: false as const,
      status: res.status,
      error: data.error?.message ?? "OpenAI request failed",
    };
  }
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    return { ok: false as const, status: 502, error: "Empty model response" };
  }
  return { ok: true as const, text };
}

function stripJsonFence(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";

    switch (action) {
      case "story_init": {
        const passage = typeof body.passage === "string" ? body.passage.trim() : "";
        if (!passage) {
          return NextResponse.json({ error: "passage required" }, { status: 400 });
        }
        const sys: ChatMsg = {
          role: "system",
          content: `You are an English teacher for Korean elementary students.
Given a short story passage, output ONLY valid JSON (no markdown) with:
1) "comprehension": array of exactly 3 objects, each:
   - "questionEn": simple English question about the passage
   - "acceptableKeywords": string[] (lowercase words that if present in a student's spoken answer suggest correctness, e.g. ["witch","cat"])
   - "hintKo": one short Korean hint
2) "grammarDrills": array of exactly 5 objects cycling different grammar tweaks based ONLY on sentences in the passage:
   - "baseSentenceEn": one sentence copied or minimally adapted from the passage
   - "instructionKo": what to change (Korean)
   - "instructionEn": same in short English
   - "acceptableHints": string[] (lowercase keywords expected in a good answer)

Keep vocabulary elementary.`,
        };
        const user: ChatMsg = {
          role: "user",
          content: `Passage:\n${passage}`,
        };
        const r = await chatCompletion([sys, user], { temperature: 0.45, max_tokens: 1200 });
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
        try {
          const parsed = JSON.parse(stripJsonFence(r.text)) as unknown;
          return NextResponse.json({ result: parsed });
        } catch {
          return NextResponse.json({ error: "Invalid JSON from model", raw: r.text }, { status: 502 });
        }
      }

      case "story_shadow_grade": {
        const passage = typeof body.passage === "string" ? body.passage.trim() : "";
        const spoken = typeof body.spoken === "string" ? body.spoken.trim() : "";
        if (!passage || !spoken) {
          return NextResponse.json({ error: "passage and spoken required" }, { status: 400 });
        }
        const sys: ChatMsg = {
          role: "system",
          content: `The student shadowed (repeated) a short English passage. Compare their spoken text to the original and grade.
Output ONLY JSON: {"score":0-100,"feedbackKo":"2-3문장 한국어 피드백 (발음·유창성·정확도)","sentenceScores":[optional per-sentence 0-100 if you can align],"overallComment":"한 줄 영어 격려"}`,
        };
        const user: ChatMsg = {
          role: "user",
          content: `Original:\n${passage}\n\nStudent said:\n${spoken}`,
        };
        const r = await chatCompletion([sys, user], { temperature: 0.3, max_tokens: 450 });
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
        try {
          const parsed = JSON.parse(stripJsonFence(r.text)) as Record<string, unknown>;
          return NextResponse.json({ result: parsed });
        } catch {
          return NextResponse.json({ error: "Invalid JSON", raw: r.text }, { status: 502 });
        }
      }

      case "story_grade_blank": {
        const fullSentence = typeof body.fullSentence === "string" ? body.fullSentence.trim() : "";
        const spoken = typeof body.spoken === "string" ? body.spoken.trim() : "";
        if (!fullSentence || !spoken) {
          return NextResponse.json({ error: "fullSentence and spoken required" }, { status: 400 });
        }
        const sys: ChatMsg = {
          role: "system",
          content: `Judge if the student said the full sentence correctly (meaning + key words). Output ONLY JSON: {"correct":boolean,"score":0-100,"feedbackKo":"한 줄 한국어"}`,
        };
        const user: ChatMsg = {
          role: "user",
          content: `Target sentence: ${fullSentence}\nStudent said: ${spoken}`,
        };
        const r = await chatCompletion([sys, user], { temperature: 0.1, max_tokens: 200 });
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
        try {
          const parsed = JSON.parse(stripJsonFence(r.text)) as {
            correct?: boolean;
            score?: number;
            feedbackKo?: string;
          };
          return NextResponse.json({ result: parsed });
        } catch {
          return NextResponse.json({ error: "Invalid JSON", raw: r.text }, { status: 502 });
        }
      }

      case "story_grade_comprehension": {
        const questionEn = typeof body.questionEn === "string" ? body.questionEn.trim() : "";
        const acceptableKeywords =
          Array.isArray(body.acceptableKeywords) && body.acceptableKeywords.every((x) => typeof x === "string")
            ? (body.acceptableKeywords as string[])
            : [];
        const spoken = typeof body.spoken === "string" ? body.spoken.trim() : "";
        if (!questionEn || !spoken) {
          return NextResponse.json({ error: "questionEn and spoken required" }, { status: 400 });
        }
        const sys: ChatMsg = {
          role: "system",
          content: `You grade a young learner's English answer to a comprehension question.
Output ONLY JSON: {"correct":boolean,"score":0-100,"feedbackKo":"한 줄 한국어","correctedEn":"optional short model answer in English if helpful"}`,
        };
        const user: ChatMsg = {
          role: "user",
          content: `Question: ${questionEn}\nHint keywords for "on-topic": ${acceptableKeywords.join(", ")}\nStudent answer: ${spoken}`,
        };
        const r = await chatCompletion([sys, user], { temperature: 0.2, max_tokens: 250 });
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
        try {
          const parsed = JSON.parse(stripJsonFence(r.text)) as Record<string, unknown>;
          return NextResponse.json({ result: parsed });
        } catch {
          return NextResponse.json({ error: "Invalid JSON", raw: r.text }, { status: 502 });
        }
      }

      case "story_grade_grammar": {
        const baseSentenceEn = typeof body.baseSentenceEn === "string" ? body.baseSentenceEn.trim() : "";
        const instructionEn = typeof body.instructionEn === "string" ? body.instructionEn.trim() : "";
        const spoken = typeof body.spoken === "string" ? body.spoken.trim() : "";
        const acceptableHints =
          Array.isArray(body.acceptableHints) && body.acceptableHints.every((x) => typeof x === "string")
            ? (body.acceptableHints as string[])
            : [];
        if (!baseSentenceEn || !spoken) {
          return NextResponse.json({ error: "baseSentenceEn and spoken required" }, { status: 400 });
        }
        const sys: ChatMsg = {
          role: "system",
          content: `Grade whether the student transformed the sentence as instructed. Be lenient for kids.
Output ONLY JSON: {"correct":boolean,"score":0-100,"feedbackKo":"한 줄 한국어","modelAnswerEn":"a good example answer"}`,
        };
        const user: ChatMsg = {
          role: "user",
          content: `Base: ${baseSentenceEn}\nInstruction (EN): ${instructionEn}\nHint keywords: ${acceptableHints.join(", ")}\nStudent: ${spoken}`,
        };
        const r = await chatCompletion([sys, user], { temperature: 0.2, max_tokens: 280 });
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
        try {
          const parsed = JSON.parse(stripJsonFence(r.text)) as Record<string, unknown>;
          return NextResponse.json({ result: parsed });
        } catch {
          return NextResponse.json({ error: "Invalid JSON", raw: r.text }, { status: 502 });
        }
      }

      case "story_grade_free": {
        const passage = typeof body.passage === "string" ? body.passage.trim() : "";
        const spoken = typeof body.spoken === "string" ? body.spoken.trim() : "";
        if (!passage || !spoken) {
          return NextResponse.json({ error: "passage and spoken required" }, { status: 400 });
        }
        const sys: ChatMsg = {
          role: "system",
          content: `The student describes or explains the story in English. Score effort, clarity, and relevance.
Output ONLY JSON: {"score":0-100,"feedbackKo":"2-3문장 한국어 칭찬+팁","highlightEn":"one short encouraging English line"}`,
        };
        const user: ChatMsg = {
          role: "user",
          content: `Story:\n${passage}\n\nStudent description:\n${spoken}`,
        };
        const r = await chatCompletion([sys, user], { temperature: 0.35, max_tokens: 350 });
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
        try {
          const parsed = JSON.parse(stripJsonFence(r.text)) as Record<string, unknown>;
          return NextResponse.json({ result: parsed });
        } catch {
          return NextResponse.json({ error: "Invalid JSON", raw: r.text }, { status: 502 });
        }
      }

      case "word_quiz_build": {
        const words =
          Array.isArray(body.words) && body.words.every((x) => typeof x === "string")
            ? (body.words as string[])
            : [];
        if (words.length === 0) {
          return NextResponse.json({ error: "words array required" }, { status: 400 });
        }
        const sys: ChatMsg = {
          role: "system",
          content: `Create short simple English sentences for elementary learners. Each sentence must naturally include ONE target phrase from the list.
Output ONLY JSON: {"items":[{"target":"phrase from list","sentenceEn":"..."}]}
Length of items must equal number of words. Order can match input order.`,
        };
        const user: ChatMsg = {
          role: "user",
          content: `Words/phrases: ${words.join(" | ")}`,
        };
        const r = await chatCompletion([sys, user], { temperature: 0.5, max_tokens: 600 });
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
        try {
          const parsed = JSON.parse(stripJsonFence(r.text)) as unknown;
          return NextResponse.json({ result: parsed });
        } catch {
          return NextResponse.json({ error: "Invalid JSON", raw: r.text }, { status: 502 });
        }
      }

      case "word_quiz_grade": {
        const target = typeof body.target === "string" ? body.target.trim() : "";
        const sentenceEn = typeof body.sentenceEn === "string" ? body.sentenceEn.trim() : "";
        const spoken = typeof body.spoken === "string" ? body.spoken.trim() : "";
        if (!target || !spoken) {
          return NextResponse.json({ error: "target and spoken required" }, { status: 400 });
        }
        const sys: ChatMsg = {
          role: "system",
          content: `The student should show they recognize or produce the target phrase from context.
Output ONLY JSON: {"correct":boolean,"score":0-100,"feedbackKo":"한 줄"}`,
        };
        const user: ChatMsg = {
          role: "user",
          content: `Sentence: ${sentenceEn}\nTarget phrase: ${target}\nStudent said: ${spoken}`,
        };
        const r = await chatCompletion([sys, user], { temperature: 0.15, max_tokens: 200 });
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
        try {
          const parsed = JSON.parse(stripJsonFence(r.text)) as Record<string, unknown>;
          return NextResponse.json({ result: parsed });
        } catch {
          return NextResponse.json({ error: "Invalid JSON", raw: r.text }, { status: 502 });
        }
      }

      case "grammar_intro": {
        const items =
          Array.isArray(body.items) && body.items.every((x) => typeof x === "string")
            ? (body.items as string[])
            : [];
        if (items.length === 0) {
          return NextResponse.json({ error: "items required" }, { status: 400 });
        }
        const sys: ChatMsg = {
          role: "system",
          content: `You teach a/an to Korean elementary kids. Create drills where the QUESTION is in Korean (situation/description) and the student answers in English with correct a/an.

Output ONLY valid JSON:
{"firstPromptKo":"첫 활동 한글 안내","firstSentenceEn":"아주 짧은 첫 문장","drills":[{"promptKo":"한국어 상황만 (예: 사과가 한 개 있어요)","targetPhrase":"예: an apple","acceptableHints":["apple","an"]}]}

Rules: promptKo must be ONLY the Korean situation/description, NO "영어로 말해봐" or similar. Example: "사과가 한 개 있어요" (student will be told separately to say it in English). targetPhrase is the a/an + noun from the items. Provide exactly ${Math.min(items.length, 6)} drills.`,
        };
        const user: ChatMsg = {
          role: "user",
          content: `Items (a/an phrases): ${items.join(", ")}`,
        };
        const r = await chatCompletion([sys, user], { temperature: 0.4, max_tokens: 900 });
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
        try {
          const parsed = JSON.parse(stripJsonFence(r.text)) as unknown;
          return NextResponse.json({ result: parsed });
        } catch {
          return NextResponse.json({ error: "Invalid JSON", raw: r.text }, { status: 502 });
        }
      }

      case "grammar_grade": {
        const promptKo = typeof body.promptKo === "string" ? body.promptKo.trim() : "";
        const targetPhrase = typeof body.targetPhrase === "string" ? body.targetPhrase.trim() : "";
        const spoken = typeof body.spoken === "string" ? body.spoken.trim() : "";
        const acceptableHints =
          Array.isArray(body.acceptableHints) && body.acceptableHints.every((x) => typeof x === "string")
            ? (body.acceptableHints as string[])
            : [];
        if (!promptKo || !targetPhrase || !spoken) {
          return NextResponse.json({ error: "promptKo, targetPhrase and spoken required" }, { status: 400 });
        }
        const sys: ChatMsg = {
          role: "system",
          content: `The student saw Korean prompt "${promptKo}" and answered in English. They should use correct a/an (target: ${targetPhrase}). Grade if their answer uses the grammar correctly. Be lenient for kids. Output ONLY JSON: {"correct":boolean,"score":0-100,"feedbackKo":"한 줄","modelAnswerEn":"good example"}`,
        };
        const user: ChatMsg = {
          role: "user",
          content: `Korean prompt: ${promptKo}\nExpected phrase (a/an): ${targetPhrase}\nHints: ${acceptableHints.join(", ")}\nStudent answered: ${spoken}`,
        };
        const r = await chatCompletion([sys, user], { temperature: 0.2, max_tokens: 250 });
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
        try {
          const parsed = JSON.parse(stripJsonFence(r.text)) as Record<string, unknown>;
          return NextResponse.json({ result: parsed });
        } catch {
          return NextResponse.json({ error: "Invalid JSON", raw: r.text }, { status: 502 });
        }
      }

      case "word_match_simple": {
        const target = typeof body.target === "string" ? body.target.trim() : "";
        const spoken = typeof body.spoken === "string" ? body.spoken.trim() : "";
        if (!target || !spoken) {
          return NextResponse.json({ error: "target and spoken required" }, { status: 400 });
        }
        const sys: ChatMsg = {
          role: "system",
          content: `Decide if the student successfully repeated or said the English word/phrase.
Output ONLY JSON: {"correct":boolean,"score":0-100,"feedbackKo":"한 줄"}`,
        };
        const user: ChatMsg = {
          role: "user",
          content: `Target: ${target}\nStudent: ${spoken}`,
        };
        const r = await chatCompletion([sys, user], { temperature: 0.1, max_tokens: 150 });
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
        try {
          const parsed = JSON.parse(stripJsonFence(r.text)) as Record<string, unknown>;
          return NextResponse.json({ result: parsed });
        } catch {
          return NextResponse.json({ error: "Invalid JSON", raw: r.text }, { status: 502 });
        }
      }

      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("textbook API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
