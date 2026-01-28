import type { QuestionItem } from "@/types/conversation";

export interface CorrectionResult {
  corrected: string;
  feedback: string;
  score: number;
}

/**
 * GPT API를 사용한 영어 교정
 * OpenAI API 또는 다른 LLM 서비스 사용
 */
export async function correctWithGPT(
  userAnswer: string,
  question: QuestionItem
): Promise<CorrectionResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn("OpenAI API key not found. Skipping GPT correction.");
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 또는 "gpt-3.5-turbo" (더 저렴)
        messages: [
          {
            role: "system",
            content: `You are an English teacher helping an elementary school student practice conversation. 
The student answered a question. Please:
1. Correct any grammar, spelling, or word choice errors
2. Provide the corrected sentence
3. Give brief, encouraging feedback in Korean (2-3 sentences max)
4. Rate the answer from 0-100 (consider grammar, vocabulary, completeness, naturalness)

Format your response as JSON:
{
  "corrected": "corrected sentence here",
  "feedback": "Korean feedback here",
  "score": 85
}`,
          },
          {
            role: "user",
            content: `Question: ${question.questionEn}
Student's answer: ${userAnswer}

Please correct and provide feedback.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) return null;

    // JSON 파싱 (GPT가 JSON으로 응답하도록 했지만, 때로는 텍스트로 올 수 있음)
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          corrected: parsed.corrected || userAnswer,
          feedback: parsed.feedback || "",
          score: parsed.score ?? 50,
        };
      }
    } catch (e) {
      console.warn("Failed to parse GPT response as JSON:", e);
    }

    // JSON 파싱 실패 시 기본값 반환
    return {
      corrected: userAnswer,
      feedback: content,
      score: 50,
    };
  } catch (error) {
    console.error("Error calling GPT API:", error);
    return null;
  }
}
