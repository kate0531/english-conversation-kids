# 배포 가이드 (GitHub + Vercel)

## 빠른 시작

### 1. GitHub 저장소 만들기

1. https://github.com 에서 **"New repository"** 클릭
2. 저장소 이름 입력 (예: `english-conversation-kids`)
3. **"Create repository"** 클릭

### 2. 코드 업로드

프로젝트 폴더에서 실행:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 3. Vercel 배포

1. https://vercel.com 에서 **"Sign Up"** → GitHub로 로그인
2. **"Add New Project"** → GitHub 저장소 선택
3. **"Deploy"** 클릭
4. 배포 완료 후 URL 공유!

### 4. 환경변수 설정 (GPT 교정 사용 시)

Vercel 프로젝트 **Settings** → **Environment Variables**:
- `NEXT_PUBLIC_OPENAI_API_KEY` = 실제 API 키

---

## 문제 해결

### Git이 설치되지 않았다면
- Windows: https://git-scm.com/download/win
- 설치 후 터미널 재시작

### 푸시 권한 오류
- GitHub에서 Personal Access Token 생성 필요
- Settings → Developer settings → Personal access tokens → Generate new token
- `repo` 권한 선택 후 토큰 사용

### Vercel 빌드 실패
- Vercel 대시보드의 **"Deployments"** 탭에서 로그 확인
- 대부분 `npm install` 실패 또는 환경변수 누락
