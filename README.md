# 영어 대화 학습 코너 (초등학생용)

모바일 우선의 영어 대화 연습 프로토타입입니다.  
Next.js + Tailwind로 구현되었으며, 연분홍 테마와 말풍선 UI로 대화 흐름을 보여줍니다.

## 기능 개요

- **1~3턴**: DB 기반 질문 + 실사 이미지. 수준별 반응/다음 질문 분기.
- **3턴 이후**: 고급 단계 안내(프로토타입에서는 종료 문구).
- **성취도**: 상/중/하 분류, 화면 색상·토스트로 표시 (노랑·초록·파랑 계열 랜덤).

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 로 접속합니다.

## 온라인 배포 (GitHub + Vercel)

### 1단계: GitHub에 코드 업로드

#### GitHub 저장소 생성
1. [GitHub](https://github.com)에 로그인
2. 우측 상단 **"+"** → **"New repository"** 클릭
3. 저장소 이름 입력 (예: `english-conversation-kids`)
4. **Public** 또는 **Private** 선택
5. **"Create repository"** 클릭

#### 로컬 코드를 GitHub에 푸시

터미널에서 프로젝트 폴더로 이동 후:

```bash
# Git 초기화 (아직 안 했다면)
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: 영어 대화 학습 코너"

# GitHub 저장소 연결 (YOUR_USERNAME과 YOUR_REPO_NAME을 실제 값으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 메인 브랜치로 푸시
git branch -M main
git push -u origin main
```

**참고**: GitHub 계정이 없으면 [회원가입](https://github.com/signup) 후 진행하세요.

---

### 2단계: Vercel에 배포

#### Vercel 계정 생성 및 로그인
1. [Vercel](https://vercel.com) 접속
2. **"Sign Up"** → **"Continue with GitHub"** 클릭
3. GitHub 계정으로 로그인 및 권한 승인

#### 프로젝트 배포
1. Vercel 대시보드에서 **"Add New..."** → **"Project"** 클릭
2. **"Import Git Repository"** 섹션에서 방금 만든 GitHub 저장소 선택
3. **"Import"** 클릭
4. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)
5. **"Environment Variables"** 섹션에서:
   - **Name**: `NEXT_PUBLIC_OPENAI_API_KEY`
   - **Value**: 실제 OpenAI API 키 입력
   - **"Add"** 클릭
6. **"Deploy"** 클릭

#### 배포 완료
- 배포가 완료되면 (약 1-2분) **"Visit"** 버튼이 나타납니다
- 클릭하면 배포된 사이트 URL로 이동합니다 (예: `https://english-conversation-kids.vercel.app`)
- 이 URL을 팀원에게 공유하면 됩니다!

---

### 3단계: 환경변수 설정 (OpenAI API 키)

**중요**: GPT 교정 기능을 사용하려면 환경변수를 설정해야 합니다.

1. Vercel 대시보드에서 프로젝트 선택
2. **"Settings"** → **"Environment Variables"** 클릭
3. 다음 변수 추가:
   - **Key**: `NEXT_PUBLIC_OPENAI_API_KEY`
   - **Value**: OpenAI API 키 (https://platform.openai.com/api-keys 에서 발급)
   - **Environment**: Production, Preview, Development 모두 선택
4. **"Save"** 클릭
5. **"Deployments"** 탭에서 최신 배포를 다시 배포 (환경변수 반영)

---

### 자동 배포

GitHub에 코드를 푸시하면 Vercel이 자동으로 재배포합니다:
- `main` 브랜치에 푸시 → Production 배포
- 다른 브랜치에 푸시 → Preview 배포

---

### 커스텀 도메인 (선택사항)

Vercel에서 무료로 커스텀 도메인을 연결할 수 있습니다:
1. 프로젝트 **"Settings"** → **"Domains"**
2. 원하는 도메인 입력
3. DNS 설정 안내에 따라 도메인 제공업체에서 설정

## 스택

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **언어**: TypeScript

## 프로젝트 구조

```
src/
  app/          # 페이지, 레이아웃, 글로벌 스타일
  components/   # ChatBubble, ScoreToast, AchievementBadge
  data/         # 질문 DB (questions.ts)
  lib/          # 채점 로직 (score.ts)
  types/        # 대화·성취도 타입
```
