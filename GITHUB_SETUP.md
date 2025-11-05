# GitHub 업로드 가이드

이 문서는 프로젝트를 GitHub에 업로드하는 전체 과정을 설명합니다.

## 사전 준비

### 1. Git 설치 확인

```bash
git --version
```

Git이 설치되어 있지 않다면 [git-scm.com](https://git-scm.com/)에서 다운로드하세요.

### 2. GitHub 계정 생성

[github.com](https://github.com)에서 계정을 생성하세요.

## GitHub 저장소 생성

### 1. 새 저장소 생성

1. GitHub에 로그인
2. 우측 상단 `+` 버튼 클릭 → `New repository` 선택
3. 저장소 정보 입력:
   - **Repository name**: `course-schedule-generator`
   - **Description**: `교육 과정 시간표 자동 생성 시스템`
   - **Public** 또는 **Private** 선택
   - **Initialize this repository with** 옵션은 모두 체크 해제
4. `Create repository` 버튼 클릭

### 2. 로컬 저장소 초기화

프로젝트 루트 디렉토리에서:

```bash
# Git 초기화
git init

# 원격 저장소 연결
git remote add origin https://github.com/your-username/course-schedule-generator.git

# 기본 브랜치 이름 설정
git branch -M main
```

### 3. 파일 추가 및 커밋

```bash
# 모든 파일 스테이징
git add .

# 첫 커밋
git commit -m "Initial commit: Course Schedule Generator System"

# GitHub에 푸시
git push -u origin main
```

## 업로드 전 체크리스트

### 필수 파일 확인

- [x] README.md - 프로젝트 설명 및 사용법
- [x] .gitignore - Git에서 제외할 파일 목록
- [x] LICENSE - 라이선스 정보
- [x] CONTRIBUTING.md - 기여 가이드
- [x] package.json (backend & frontend) - 의존성 정보

### 민감 정보 제거

다음 파일들이 .gitignore에 포함되어 있는지 확인:

- [x] .env 파일
- [x] node_modules/
- [x] backend/data/*.db (데이터베이스 파일)
- [x] backend/uploads/* (업로드된 파일)

### 환경 변수 템플릿 생성

#### backend/.env.example

```env
PORT=5000
DATABASE_PATH=./data/schedule.db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
NODE_ENV=development
```

#### frontend/.env.example

```env
VITE_API_URL=http://localhost:5000/api
```

## GitHub 저장소 설정

### 1. About 섹션 설정

저장소 페이지에서:

1. 우측 상단 ⚙️ (Settings) 클릭
2. **About** 섹션 편집:
   - **Description**: 교육 과정 시간표 자동 생성 시스템
   - **Website**: (배포 URL이 있다면)
   - **Topics**: `education`, `schedule`, `typescript`, `react`, `nodejs`, `sqlite`

### 2. README 배지 추가

README.md 상단에 배지 추가 (이미 포함됨):

```markdown
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
```

### 3. GitHub Pages 설정 (선택사항)

프론트엔드를 GitHub Pages로 배포하려면:

1. Settings → Pages
2. Source: Deploy from a branch
3. Branch: main, /frontend/dist
4. Save

## 협업 설정

### 1. Branch Protection Rules

Settings → Branches → Add rule:

- Branch name pattern: `main`
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging

### 2. Issue Templates

`.github/ISSUE_TEMPLATE/` 디렉토리 생성:

- `bug_report.md` - 버그 리포트 템플릿
- `feature_request.md` - 기능 제안 템플릿

### 3. Pull Request Template

`.github/pull_request_template.md` 생성

## 지속적 통합 (CI/CD) 설정 (선택사항)

### GitHub Actions

`.github/workflows/ci.yml` 생성:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install Backend Dependencies
      run: |
        cd backend
        npm install
    
    - name: Build Backend
      run: |
        cd backend
        npm run build
    
    - name: Install Frontend Dependencies
      run: |
        cd frontend
        npm install
    
    - name: Build Frontend
      run: |
        cd frontend
        npm run build
```

## 프로젝트 홍보

### 1. README 개선

- 스크린샷 추가
- 데모 비디오 링크
- 사용 사례 추가

### 2. 릴리스 생성

1. Releases → Create a new release
2. Tag version: v1.0.0
3. Release title: Initial Release
4. 변경사항 설명 작성
5. Publish release

### 3. 소셜 미디어 공유

- Twitter
- LinkedIn
- 개발자 커뮤니티

## 유지보수

### 정기적인 업데이트

```bash
# 변경사항 확인
git status

# 변경사항 추가
git add .

# 커밋
git commit -m "Update: description of changes"

# 푸시
git push origin main
```

### 이슈 관리

- 정기적으로 이슈 확인 및 응답
- 라벨을 사용하여 이슈 분류
- 마일스톤 설정으로 진행 상황 추적

### 의존성 업데이트

```bash
# 백엔드
cd backend
npm outdated
npm update

# 프론트엔드
cd frontend
npm outdated
npm update
```

## 문제 해결

### Git 인증 오류

```bash
# SSH 키 설정
ssh-keygen -t ed25519 -C "your_email@example.com"

# SSH 키를 GitHub에 추가
# Settings → SSH and GPG keys → New SSH key
```

### 대용량 파일 오류

```bash
# Git LFS 설치
git lfs install

# 대용량 파일 추적
git lfs track "*.db"
git lfs track "*.xlsx"
```

### 푸시 거부

```bash
# 원격 변경사항 가져오기
git pull origin main --rebase

# 충돌 해결 후 푸시
git push origin main
```

## 참고 자료

- [GitHub Docs](https://docs.github.com/)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**준비 완료!** 이제 프로젝트를 GitHub에 업로드할 준비가 되었습니다. 🚀
