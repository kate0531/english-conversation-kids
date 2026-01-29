import { NextRequest, NextResponse } from "next/server";

function sampleGrammarCheck(sentence: string): { corrected: string; feedback: string } {
  const s = sentence.trim();
  if (!s) return { corrected: s, feedback: "문장을 입력해 주세요." };
  const lower = s.toLowerCase();
  let corrected = s;
  let feedback = "문법이 맞아요.";

  if (!/^[A-Z]/.test(corrected) && corrected.length > 0) {
    corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
    feedback = "문장의 첫 글자는 대문자로 써 주세요.";
  }
  if (!/[.!?]$/.test(corrected)) {
    corrected = corrected + ".";
    if (feedback !== "문법이 맞아요.") feedback += " 마침표를 붙여 주세요.";
    else feedback = "문장 끝에 마침표를 붙여 주세요.";
  }
  if (lower.includes("i am ") || lower.includes("i'm ")) {
    if (lower.includes(" i ")) {
      corrected = corrected.replace(/\b i \b/gi, " I ");
      if (feedback === "문법이 맞아요.") feedback = "영어에서 'I'는 항상 대문자로 써요.";
    }
  }
  if (lower.includes("teh ")) {
    corrected = corrected.replace(/\bteh\b/gi, "the");
    feedback = "'the'의 철자를 확인해 주세요.";
  }
  if (lower.includes("adn ")) {
    corrected = corrected.replace(/\badn\b/gi, "and");
    feedback = "'and'의 철자를 확인해 주세요.";
  }

  return { corrected, feedback };
}

export async function POST(req: NextRequest) {
  try {
    const { sentence } = await req.json();
    if (!sentence || typeof sentence !== "string") {
      return NextResponse.json({ error: "sentence required" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(sampleGrammarCheck(sentence), { status: 200 });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an English grammar checker for elementary students. 
Given a sentence, return ONLY a JSON object with:
1. "corrected": the grammatically correct version of the sentence (same meaning).
2. "feedback": very brief explanation in Korean (one short sentence) of what was wrong, if anything. If the sentence is already correct, say "문법이 맞아요."`,
          },
          {
            role: "user",
            content: sentence,
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI grammar error:", err);
      return NextResponse.json({ corrected: sentence, feedback: "" }, { status: 200 });
    }

    const data = await res.json();
    const content = data.choices[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        corrected: parsed.corrected ?? sentence,
        feedback: parsed.feedback ?? "",
      });
    }
    return NextResponse.json({ corrected: sentence, feedback: content || "" }, { status: 200 });
  } catch (e) {
    console.error("Grammar check error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
