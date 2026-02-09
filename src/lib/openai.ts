/**
 * 서버에서 사용할 OpenAI API 키 (환경 변수)
 * OPENAI_API_KEY 우선, 없으면 NEXT_PUBLIC_OPENAI_API_KEY 사용
 */
export function getOpenAIApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY ?? process.env.NEXT_PUBLIC_OPENAI_API_KEY;
}
