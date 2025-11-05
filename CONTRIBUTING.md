# 기여 가이드

교육 과정 시간표 자동 생성 시스템에 기여해 주셔서 감사합니다!

## 기여 방법

### 1. 이슈 생성

버그를 발견하거나 새로운 기능을 제안하고 싶다면:

1. [Issues](https://github.com/your-username/course-schedule-generator/issues) 페이지로 이동
2. 기존 이슈 검색하여 중복 확인
3. 새 이슈 생성 (버그 리포트 또는 기능 제안 템플릿 사용)

### 2. Pull Request 제출

1. **Fork**: 프로젝트를 Fork합니다
2. **Clone**: Fork한 저장소를 로컬에 클론합니다
   ```bash
   git clone https://github.com/your-username/course-schedule-generator.git
   ```
3. **Branch**: 새 브랜치를 생성합니다
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Develop**: 코드를 작성하고 테스트합니다
5. **Commit**: 변경사항을 커밋합니다
   ```bash
   git commit -m 'feat: Add amazing feature'
   ```
6. **Push**: 브랜치를 푸시합니다
   ```bash
   git push origin feature/amazing-feature
   ```
7. **PR**: Pull Request를 생성합니다

## 코딩 스타일

### TypeScript

- 타입을 명시적으로 선언
- `any` 타입 사용 최소화
- 인터페이스 우선 사용

### 네이밍 컨벤션

- 변수/함수: camelCase
- 클래스/인터페이스: PascalCase
- 상수: UPPER_SNAKE_CASE
- 파일명: kebab-case 또는 PascalCase

### 커밋 메시지

```
<type>: <subject>

<body>

<footer>
```

**Type:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드/설정 변경

**예시:**
```
feat: Add PDF export functionality

- Implement jsPDF integration
- Add print button to schedule page
- Support A4 landscape format

Closes #123
```

## 테스트

변경사항을 제출하기 전에:

1. 로컬에서 테스트
2. 린트 검사 통과
3. 빌드 성공 확인

```bash
# 백엔드
cd backend
npm run build
npm run lint

# 프론트엔드
cd frontend
npm run build
npm run lint
```

## 문서화

코드 변경 시 관련 문서도 업데이트:

- README.md
- API 문서
- 인라인 주석

## 질문

궁금한 점이 있다면:

- GitHub Issues에 질문 등록
- 이메일 문의

감사합니다! 🙏
