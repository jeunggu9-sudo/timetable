# 프로젝트 구조

## 디렉토리 구조

```
course-schedule-generator/
│
├── .kiro/                          # Kiro 설정 및 스펙 문서
│   └── specs/
│       └── course-schedule-generator/
│           ├── requirements.md     # 요구사항 문서
│           ├── design.md          # 설계 문서
│           └── tasks.md           # 구현 작업 목록
│
├── backend/                        # Node.js/Express 백엔드
│   ├── src/
│   │   ├── database/              # 데이터베이스 관련
│   │   │   ├── connection.ts     # DB 연결 설정
│   │   │   ├── init.ts           # DB 초기화
│   │   │   ├── schema.ts         # 테이블 스키마
│   │   │   └── index.ts          # DB 모듈 진입점
│   │   │
│   │   ├── repositories/          # 데이터 액세스 레이어
│   │   │   ├── CourseRepository.ts
│   │   │   ├── InstructorRepository.ts
│   │   │   ├── ScheduleRepository.ts
│   │   │   └── OffDayRepository.ts
│   │   │
│   │   ├── services/              # 비즈니스 로직
│   │   │   ├── ExcelParser.ts
│   │   │   ├── ScheduleGenerator.ts
│   │   │   └── ValidationService.ts
│   │   │
│   │   ├── routes/                # API 라우트
│   │   │   ├── courseRoutes.ts
│   │   │   ├── scheduleRoutes.ts
│   │   │   ├── instructorRoutes.ts
│   │   │   └── offDayRoutes.ts
│   │   │
│   │   ├── middleware/            # Express 미들웨어
│   │   │   ├── errorHandler.ts
│   │   │   └── fileUpload.ts
│   │   │
│   │   ├── utils/                 # 유틸리티 함수
│   │   │   ├── dateUtils.ts
│   │   │   └── validators.ts
│   │   │
│   │   ├── types/                 # TypeScript 타입 정의
│   │   │   └── models.ts
│   │   │
│   │   ├── scripts/               # 스크립트
│   │   │   ├── initDb.ts         # DB 초기화 스크립트
│   │   │   └── verifyDb.ts       # DB 검증 스크립트
│   │   │
│   │   └── index.ts               # 서버 진입점
│   │
│   ├── data/                      # SQLite 데이터베이스 파일
│   │   └── schedule.db
│   │
│   ├── uploads/                   # 업로드된 파일
│   │
│   ├── dist/                      # 컴파일된 JavaScript 파일
│   │
│   ├── .env.example               # 환경변수 템플릿
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── frontend/                      # React 프론트엔드
│   ├── src/
│   │   ├── pages/                # 페이지 컴포넌트
│   │   │   ├── UploadPage.tsx
│   │   │   ├── PreAssignmentPage.tsx
│   │   │   ├── ScheduleGenerationPage.tsx
│   │   │   ├── ScheduleViewPage.tsx
│   │   │   └── InstructorManagementPage.tsx
│   │   │
│   │   ├── components/           # 재사용 가능한 컴포넌트
│   │   │   ├── Calendar/
│   │   │   ├── ScheduleTable/
│   │   │   ├── FileUploader/
│   │   │   └── common/
│   │   │
│   │   ├── services/             # API 클라이언트
│   │   │   ├── api.ts           # Axios 설정
│   │   │   ├── courseService.ts
│   │   │   ├── scheduleService.ts
│   │   │   ├── instructorService.ts
│   │   │   └── offDayService.ts
│   │   │
│   │   ├── types/                # TypeScript 타입 정의
│   │   │   └── models.ts
│   │   │
│   │   ├── utils/                # 유틸리티 함수
│   │   │   ├── dateUtils.ts
│   │   │   └── formatters.ts
│   │   │
│   │   ├── App.tsx               # 메인 앱 컴포넌트
│   │   ├── App.css
│   │   ├── main.tsx              # 진입점
│   │   └── index.css
│   │
│   ├── public/                   # 정적 파일
│   │
│   ├── dist/                     # 빌드된 파일
│   │
│   ├── .env.example              # 환경변수 템플릿
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
├── README.md                     # 프로젝트 README
├── PROJECT_STRUCTURE.md          # 이 파일
├── setup.bat                     # 설치 스크립트 (Windows)
└── start-dev.bat                 # 개발 서버 시작 스크립트 (Windows)
```

## 주요 파일 설명

### 백엔드

#### `src/index.ts`
Express 서버의 진입점. 미들웨어 설정, 라우트 등록, 에러 핸들링을 담당합니다.

#### `src/database/`
- `connection.ts`: SQLite 데이터베이스 연결 관리
- `schema.ts`: 테이블 스키마 정의 (courses, instructors, schedules, off_days)
- `init.ts`: 데이터베이스 초기화 로직

#### `src/repositories/`
데이터베이스 CRUD 작업을 담당하는 레이어입니다.
- `CourseRepository`: 교과목 데이터 관리
- `InstructorRepository`: 교관 데이터 관리
- `ScheduleRepository`: 시간표 데이터 관리
- `OffDayRepository`: 휴무일 데이터 관리

#### `src/services/`
비즈니스 로직을 담당합니다.
- `ExcelParser`: 엑셀 파일 파싱 및 검증
- `ScheduleGenerator`: 시간표 자동 생성 알고리즘
- `ValidationService`: 제약조건 검증

#### `src/routes/`
API 엔드포인트를 정의합니다.

### 프론트엔드

#### `src/main.tsx`
React 애플리케이션의 진입점입니다.

#### `src/App.tsx`
메인 앱 컴포넌트. 라우팅 설정과 전역 레이아웃을 담당합니다.

#### `src/pages/`
각 페이지별 컴포넌트:
- `UploadPage`: 엑셀 파일 업로드
- `PreAssignmentPage`: 선배정 캘린더
- `ScheduleGenerationPage`: 자동 생성
- `ScheduleViewPage`: 시간표 조회
- `InstructorManagementPage`: 교관 휴무일 관리

#### `src/services/`
백엔드 API와 통신하는 서비스 레이어입니다.

#### `src/components/`
재사용 가능한 UI 컴포넌트들입니다.

## 데이터 흐름

```
사용자 입력 (Frontend)
    ↓
API 요청 (services/api.ts)
    ↓
Express 라우트 (routes/)
    ↓
비즈니스 로직 (services/)
    ↓
데이터 액세스 (repositories/)
    ↓
SQLite 데이터베이스
```

## 개발 워크플로우

1. **백엔드 개발**
   - `src/types/models.ts`에 타입 정의
   - `src/database/schema.ts`에 테이블 스키마 추가
   - `src/repositories/`에 데이터 액세스 로직 구현
   - `src/services/`에 비즈니스 로직 구현
   - `src/routes/`에 API 엔드포인트 추가
   - `src/index.ts`에 라우트 등록

2. **프론트엔드 개발**
   - `src/types/models.ts`에 타입 정의
   - `src/services/`에 API 클라이언트 함수 추가
   - `src/components/`에 재사용 컴포넌트 구현
   - `src/pages/`에 페이지 컴포넌트 구현
   - `src/App.tsx`에 라우트 추가

## 환경 설정

### 백엔드 (.env)
```
PORT=5000
DATABASE_PATH=./data/schedule.db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### 프론트엔드 (.env)
```
VITE_API_URL=http://localhost:5000/api
```
