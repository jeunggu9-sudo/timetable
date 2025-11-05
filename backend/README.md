# Course Schedule Generator - Backend

교육 과정 시간표 자동 생성 시스템의 백엔드 서버입니다.

## 기술 스택

- Node.js + Express
- TypeScript
- SQLite3
- xlsx (엑셀 파일 파싱)
- date-fns (날짜 처리)

## 설치 방법

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env

# 데이터베이스 초기화
npm run init-db
```

## 실행 방법

```bash
# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 데이터베이스 구조

### courses 테이블
- 교과목 정보 저장
- 엑셀 파일에서 업로드된 데이터

### instructors 테이블
- 교관 정보 저장
- 교과목 업로드 시 자동 생성

### schedules 테이블
- 생성된 시간표 저장
- 선배정 및 자동 생성된 일정

### off_days 테이블
- 교관 휴무일 정보 저장

## 환경변수

- `PORT`: 서버 포트 (기본값: 5000)
- `DATABASE_PATH`: SQLite 데이터베이스 파일 경로
- `UPLOAD_DIR`: 업로드 파일 저장 디렉토리
- `MAX_FILE_SIZE`: 최대 파일 크기 (바이트)
