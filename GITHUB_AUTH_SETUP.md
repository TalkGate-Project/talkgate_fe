# GitHub 인증 설정 가이드

## 문제 원인
- Windows 자격 증명 관리자에 이전 계정(`this_is_laugh@tripleasure.kr`) 정보가 저장되어 있었음
- Git이 이전 인증 정보를 사용하여 푸시 실패

## 해결 방법

### 방법 1: Personal Access Token 사용 (권장)

1. **GitHub에서 Personal Access Token 생성**
   - GitHub.com 로그인 → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - "Generate new token (classic)" 클릭
   - Note: "Git Operations" 입력
   - Expiration: 원하는 기간 선택 (예: 90 days)
   - Scopes: `repo` 체크 (전체 권한)
   - "Generate token" 클릭
   - **토큰을 복사해 안전한 곳에 보관** (다시 볼 수 없음)

2. **Git 작업 시 인증**
   - 다음에 `git push` 또는 `git clone` 할 때:
     - Username: `ipjaworld` (또는 `GeonhaLee`)
     - Password: **생성한 Personal Access Token** 입력
   - Windows Credential Manager에 자동으로 저장됨

### 방법 2: SSH 키 사용

1. **SSH 키 생성** (아직 없다면)
   ```bash
   ssh-keygen -t ed25519 -C "ipjaworld@gmail.com"
   ```

2. **공개 키를 GitHub에 등록**
   - `cat ~/.ssh/id_ed25519.pub` 실행하여 공개 키 복사
   - GitHub.com → Settings → SSH and GPG keys → New SSH key
   - 공개 키 붙여넣기

3. **원격 저장소 URL을 SSH로 변경**
   ```bash
   git remote set-url origin git@github.com:TalkGate-Project/talkgate_fe.git
   ```

### 방법 3: GitHub CLI 사용

```bash
# GitHub CLI 설치 후
gh auth login
```

## 현재 설정 확인

```bash
# Git 사용자 정보 확인
git config --global user.name
git config --global user.email

# 원격 저장소 확인
git remote -v

# 저장된 인증 정보 확인
cmdkey /list | findstr git
```

## 추가 참고사항

- Personal Access Token은 비밀번호처럼 안전하게 보관해야 함
- 토큰이 만료되면 새로 생성해야 함
- SSH 키를 사용하면 토큰 관리가 필요 없음

