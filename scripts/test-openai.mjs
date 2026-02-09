/**
 * .env.local의 OPENAI_API_KEY로 OpenAI API 동작 확인
 * 실행: node --env-file=.env.local scripts/test-openai.mjs
 */

const key = process.env.OPENAI_API_KEY;
if (!key || key === "sk-your-api-key-here") {
  console.error("❌ .env.local에 OPENAI_API_KEY를 설정해 주세요.");
  process.exit(1);
}

const res = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Hello" }],
    max_tokens: 50,
  }),
});

const data = await res.json();
if (!res.ok) {
  console.error("❌ 실패:", res.status, data.error?.message ?? data);
  process.exit(1);
}

console.log("✅ 정상 동작:", data.choices?.[0]?.message?.content?.trim() ?? "(응답 없음)");
