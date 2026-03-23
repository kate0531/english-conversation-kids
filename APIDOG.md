# Apidog로 OpenAI API 연동하기

이 프로젝트에 OpenAI API를 붙이고, **Apidog**에서 로컬 API를 호출해 테스트하는 방법입니다.

---

## 1. OpenAI API 키 발급

1. [OpenAI API Keys](https://platform.openai.com/api-keys) 접속 후 로그인
2. **Create new secret key**로 키 생성 후 복사 (한 번만 표시됨)

---

## 2. 프로젝트 환경 변수 설정

1. 프로젝트 루트에 `.env.local` 파일 생성 (없다면)
2. `.env.local.example`을 참고해 아래 한 줄 추가:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx
```

3. **실행 중인 터미널이 있다면** `npm run dev` 한 번 중지 후 다시 실행

---

## 3. 로컬 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 이 뜨면 준비 완료입니다.

---

## 4. Apidog에서 요청 설정

### 4-1. 프로젝트/환경 생성 (선택)

- Apidog에서 새 프로젝트 또는 팀 프로젝트 생성
- 환경(Environment)에 변수 추가 예:
  - `baseUrl`: `http://localhost:3000`

### 4-2. Chat 프록시 API (권장)

**OpenAI 키를 Apidog에 넣지 않고** 로컬 Next.js가 대신 호출하는 방식입니다.

| 항목 | 값 |
|------|-----|
| **Method** | POST |
| **URL** | `http://localhost:3000/api/openai/chat` |
| **Body** | raw, JSON |

**Request Body 예시:**

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "user", "content": "Hello, say hi in one sentence." }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

**세션 3턴 자동 설계 예시 (`promptKey` 사용):**

```json
{
  "model": "gpt-4o-mini",
  "promptKey": "sessionThreeTurnPlanner",
  "userInput": "주제: 주말에 가족과 공원 가기. 초등 3학년 수준으로 3턴 대화 질문 만들어줘.",
  "temperature": 0.7,
  "max_tokens": 700
}
```

- `messages`: OpenAI 형식 그대로 배열로 전달
- `promptKey`: 서버에 저장된 프롬프트 키를 지정하면 system 프롬프트가 자동 주입됩니다.
- `userInput`: `messages`를 생략하고 `promptKey`만 쓸 때 사용자 입력으로 사용됩니다.
- `model`: 생략 시 `gpt-4o-mini`
- `temperature`, `max_tokens`: 선택

**성공 시** OpenAI와 동일한 `chat/completions` 응답 구조가 그대로 옵니다.

### 4-3. 기존 Writing API 테스트

문법 검사:

- **POST** `http://localhost:3000/api/writing/grammar`
- Body: `{ "sentence": "i likes apple" }`

글 분석:

- **POST** `http://localhost:3000/api/writing/analyze`
- Body: `{ "paragraph": "I like dogs.\nThey are cute." }`

---

## 5. Apidog에서 OpenAI 직접 호출 (선택)

OpenAI를 **직접** 호출해보고 싶다면:

- **URL**: `https://api.openai.com/v1/chat/completions`
- **Header**: `Authorization: Bearer sk-proj-...` (본인 API 키)
- **Body**: OpenAI 문서와 동일한 JSON

이 경우 API 키가 Apidog 요청에 포함되므로, 팀 공유/내보내기 시 유의하세요. 로컬 테스트는 위 **4-2 Chat 프록시** 사용을 권장합니다.

---

## 6. 문제 해결

| 증상 | 확인 사항 |
|------|-----------|
| `503 OPENAI_API_KEY not set` | `.env.local`에 `OPENAI_API_KEY` 있는지, 서버 재시작 했는지 확인 |
| `401` / `Incorrect API key` | 키가 `sk-`로 시작하는지, 앞뒤 공백 없는지 확인 |
| `Connection refused` | `npm run dev`로 로컬 서버가 떠 있는지 확인 |
| CORS 에러 | 브라우저가 아닌 Apidog(데스크톱/클라이언트)에서 호출하면 CORS 적용되지 않음 |

---

## 요약

1. OpenAI에서 API 키 발급 → `.env.local`에 `OPENAI_API_KEY` 설정  
2. `npm run dev`로 서버 실행  
3. Apidog에서 **POST** `http://localhost:3000/api/openai/chat` 로 JSON body 보내서 테스트

이렇게 하면 API 키를 Apidog에 넣지 않고도 OpenAI 연동을 확인할 수 있습니다.
