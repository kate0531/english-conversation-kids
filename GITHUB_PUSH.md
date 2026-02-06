# GitHub에 올리기

## 1. 변경 사항 스테이징 & 커밋

터미널을 열고 프로젝트 폴더로 이동한 뒤:

```bash
git add .
git status
git commit -m "Add Free Talking, TTS 개선, 샘플 따라 말하기 등"
```

## 2. GitHub 저장소 연결

### 새 저장소를 만드는 경우

1. [GitHub](https://github.com) 로그인 → **New repository**
2. 저장소 이름 입력 (예: `english-practice`) → **Create repository**
3. 아래 중 하나 실행 (이미 origin이 있으면 4번으로):

```bash
# 아직 remote가 없을 때
git remote add origin https://github.com/내아이디/저장소이름.git

# 기존 origin을 새 주소로 바꿀 때
git remote set-url origin https://github.com/내아이디/저장소이름.git
```

### 이미 만든 저장소가 있는 경우

주소만 맞추면 됩니다:

```bash
git remote -v
git remote set-url origin https://github.com/내아이디/저장소이름.git
```

## 3. 푸시

```bash
git push -u origin main
```

비밀번호를 묻으면 **Personal Access Token**을 입력합니다 (GitHub → Settings → Developer settings → Personal access tokens).

---

**주의:** `.env.local` 같은 비밀 키 파일은 `.gitignore`에 있어서 자동으로 제외됩니다. 키는 GitHub에 올리지 마세요.
