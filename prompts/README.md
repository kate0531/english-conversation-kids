# 프롬프트 설정 (prompts.json)

`prompts.json`에서 Writing Time과 Free Talking Time에 쓰이는 OpenAI 프롬프트를 수정할 수 있습니다.

## 키(key)

| 키 | 용도 |
|---|---|
| `writingGrammar` | Writing Time - 문법 검사 |
| `writingAnalyze` | Writing Time - 글 분석 |
| `freeTalkingCorrect` | Free Talking Time - 대화 교정·발화 코멘트 |
| `speakingEvaluate` | 홈 Speaking Time - 질문 답변 교정·채점 (LLM) |
| `sessionThreeTurnPlanner` | 세션1→2→3 조합형 3턴 질문 설계 |

## 수정 방법

1. `prompts.json`을 텍스트 에디터로 엽니다.
2. 원하는 키의 값(value)을 수정합니다.
3. JSON 형식 유지 (따옴표, 쉼표 등).
4. 서버를 다시 시작하거나, 개발 모드에서는 다음 API 호출 시 자동 반영됩니다.

## 주의

- 파일이 없거나 JSON 파싱에 실패하면 기본 프롬프트가 사용됩니다.
- 줄바꿈은 `\n`으로 표현합니다.
