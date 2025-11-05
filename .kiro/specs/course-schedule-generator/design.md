# Design Document

## Overview

교육 과정 시간표 자동 생성 시스템은 3-tier 아키텍처를 기반으로 설계된다. React 기반 프론트엔드는 사용자 인터페이스를 제공하고, Node.js/Express 백엔드는 비즈니스 로직을 처리하며, SQLite 데이터베이스는 모든 데이터를 영구 저장한다.

시스템의 핵심 기능은 엑셀 파일 파싱, 규칙 기반 시간표 자동 생성 알고리즘, 그리고 캘린더 기반 시각화이다. 시간표 생성 알고리즘은 제약 조건(일과시간, 교시 제한, 교관 휴무일, 선배정 등)을 만족하면서 교과목을 순차적으로 배치하는 greedy 방식을 사용한다.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React SPA (Port 3000)                     │ │
│  │  - Upload Page                                         │ │
│  │  - Pre-assignment Calendar                             │ │
│  │  - Schedule Generation Page                            │ │
│  │  - Schedule View (Monthly/Weekly/Daily)                │ │
│  │  - Instructor Off-day Management                       │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST API
┌───────────────────────────▼─────────────────────────────────┐
│                   Server (Node.js/Express)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    API Layer                           │ │
│  │  - /api/courses (POST, GET, PUT, DELETE)               │ │
│  │  - /api/schedules (POST, GET, PUT, DELETE)             │ │
│  │  - /api/instructors (GET, POST, PUT, DELETE)           │ │
│  │  - /api/off-days (GET, POST, DELETE)                   │ │
│  │  - /api/upload (POST)                                  │ │
│  │  - /api/generate-schedule (POST)                       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Business Logic Layer                   │ │
│  │  - ExcelParser: 엑셀 파일 파싱                          │ │
│  │  - ScheduleGenerator: 시간표 자동 생성 알고리즘         │ │
│  │  - ValidationService: 제약조건 검증                     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Data Access Layer                     │ │
│  │  - CourseRepository                                    │ │
│  │  - ScheduleRepository                                  │ │
│  │  - InstructorRepository                                │ │
│  │  - OffDayRepository                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ SQLite
┌───────────────────────────▼─────────────────────────────────┐
│                    Database (SQLite)                         │
│  - courses                                                   │
│  - instructors                                               │
│  - schedules                                                 │
│  - off_days                                                  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18.x
- React Router (페이지 라우팅)
- Axios (HTTP 클라이언트)
- FullCalendar (캘린더 UI)
- XLSX (엑셀 파일 미리보기, 선택적)
- Tailwind CSS 또는 Material-UI (스타일링)

**Backend:**
- Node.js 18.x+
- Express 4.x
- xlsx (엑셀 파일 파싱)
- sqlite3 (데이터베이스)
- multer (파일 업로드)
- date-fns (날짜 처리)

**Database:**
- SQLite 3

## Components and Interfaces

### Evaluation Display Utilities

평가 필드의 사용자 친화적 표시를 위한 유틸리티 함수들:

```typescript
// 평가 필드 변환 유틸리티
class EvaluationDisplayUtils {
  /**
   * 데이터베이스 값을 사용자 친화적 텍스트로 변환
   * @param value - "0" 또는 "1" 문자열
   * @returns "무시험" 또는 "평가"
   */
  static formatEvaluationForDisplay(value: string): '평가' | '무시험' {
    return value === '1' ? '평가' : '무시험';
  }

  /**
   * Course 객체를 CourseDisplay 객체로 변환
   * @param course - 원본 Course 객체
   * @returns 표시용 CourseDisplay 객체
   */
  static convertCourseForDisplay(course: Course): CourseDisplay {
    return {
      ...course,
      평가: this.formatEvaluationForDisplay(course.평가)
    };
  }

  /**
   * Course 배열을 CourseDisplay 배열로 변환
   * @param courses - 원본 Course 배열
   * @returns 표시용 CourseDisplay 배열
   */
  static convertCoursesForDisplay(courses: Course[]): CourseDisplay[] {
    return courses.map(course => this.convertCourseForDisplay(course));
  }

  /**
   * 평가 필드에 따른 스타일 클래스 반환
   * @param evaluationValue - "평가" 또는 "무시험"
   * @returns CSS 클래스명
   */
  static getEvaluationStyleClass(evaluationValue: '평가' | '무시험'): string {
    return evaluationValue === '평가' 
      ? 'evaluation-required' 
      : 'evaluation-none';
  }
}
```

### Frontend Components

#### 1. UploadPage Component
엑셀 파일을 업로드하고 파싱 결과를 확인하는 페이지

**Props:** None

**State:**
- `file`: 선택된 파일
- `uploadStatus`: 업로드 상태 (idle, uploading, success, error)
- `parsedData`: 파싱된 교과목 데이터 미리보기 (CourseDisplay[] 형태)

**Methods:**
- `handleFileSelect(file)`: 파일 선택 처리
- `handleUpload()`: 파일을 서버로 전송
- `displayPreview(data)`: 파싱된 데이터 미리보기 표시 (평가 필드를 사용자 친화적 형태로 변환하여 표시)

**Evaluation Display Integration:**
- 업로드된 데이터 미리보기 테이블에서 평가 컬럼은 "평가"/"무시험" 형태로 표시
- 각 평가 유형에 따른 시각적 구분을 위한 스타일 적용

#### 2. PreAssignmentCalendar Component
선배정 값이 1인 교과목을 수동으로 배정하는 캘린더 인터페이스

**Props:**
- `courses`: 선배정 대상 교과목 목록 (CourseDisplay[] 형태, 선배정=1)

**State:**
- `selectedCourse`: 현재 선택된 교과목 (CourseDisplay 타입)
- `selectedTimeSlots`: 선택된 시간대
- `existingSchedules`: 기존 배정된 일정
- `showTimeSlotModal`: 시간대 선택 모달 표시 여부
- `showMultiDayModal`: 다중 날짜 배정 모달 표시 여부

**Methods:**
- `handleCourseSelect(course)`: 교과목 선택
- `handleDateClick(date)`: 캘린더 날짜 클릭 처리
- `handleTimeSlotConfirm(startPeriod, endPeriod)`: 단일 날짜 시간대 배정 확인
- `handleMultiDayRequest(startPeriod, requestedHours)`: 다중 날짜 배정 요청 처리
- `handleMultiDayConfirm(assignments)`: 다중 날짜 배정 확인
- `submitPreAssignment()`: 선배정 저장

**Evaluation Display Integration:**
- 교과목 선택 드롭다운에서 평가 정보를 "평가"/"무시험" 형태로 표시
- 선택된 교과목의 상세 정보에 평가 유형 표시

**Combat Fitness Integration:**
- 전투체력 과목 감지 및 하루 최대 2시간 제한 적용
- 제한 초과 시 자동으로 다중 날짜 배정 모달 표시

#### 3. ScheduleGenerationPage Component
시작 날짜를 선택하고 자동 생성을 실행하는 페이지

**Props:** None

**State:**
- `startDate`: 시작 날짜
- `generationStatus`: 생성 상태 (idle, generating, success, error)
- `generationResult`: 생성 결과 메시지

**Methods:**
- `handleDateSelect(date)`: 시작 날짜 선택
- `handleGenerate()`: 시간표 자동 생성 API 호출
- `displayResult(result)`: 생성 결과 표시

#### 4. ScheduleView Component
월별/주별/일별 시간표 조회 컴포넌트

**Props:**
- `viewMode`: 'monthly' | 'weekly' | 'daily'

**State:**
- `currentDate`: 현재 조회 중인 날짜
- `schedules`: 조회된 시간표 데이터 (Course 정보를 CourseDisplay로 변환하여 저장)
- `editMode`: 수정 모드 여부

**Methods:**
- `fetchSchedules(date, mode)`: 시간표 데이터 조회 (API 응답의 Course 데이터를 CourseDisplay로 변환)
- `handleNavigate(direction)`: 이전/다음 기간으로 이동
- `handleEdit(scheduleId)`: 시간표 수정 모드 진입
- `handleUpdate(scheduleId, newData)`: 시간표 수정 저장
- `handleDelete(scheduleId)`: 시간표 삭제

**Evaluation Display Integration:**
- 시간표 항목에서 교과목 정보 표시 시 평가 유형을 "평가"/"무시험" 형태로 표시
- 평가가 있는 교과목은 시각적으로 구분하여 표시 (예: 배경색, 아이콘 등)

#### 5. InstructorOffDayManagement Component
교관 휴무일 관리 컴포넌트

**Props:** None

**State:**
- `instructors`: 교관 목록
- `selectedInstructor`: 선택된 교관
- `offDays`: 선택된 교관의 휴무일 목록

**Methods:**
- `fetchInstructors()`: 교관 목록 조회
- `fetchOffDays(instructorId)`: 특정 교관의 휴무일 조회
- `handleAddOffDay(instructorId, date)`: 휴무일 추가
- `handleDeleteOffDay(offDayId)`: 휴무일 삭제

#### 6. SchedulePrintPage Component
날짜 범위를 선택하여 주간 단위 표 형식으로 시간표를 출력하는 페이지

**Props:** None

**State:**
- `startDate`: 시작 날짜
- `endDate`: 종료 날짜
- `schedules`: 조회된 시간표 데이터
- `loading`: 로딩 상태

**Methods:**
- `fetchSchedules()`: 날짜 범위에 해당하는 시간표 조회
- `handlePrint()`: 브라우저 인쇄 다이얼로그 호출
- `generateWeeklyTable()`: 주간 단위 테이블 데이터 생성

**Table Structure:**
- 행(Row): 각 주의 시작 날짜 (월요일)
- 열(Column): 요일 (월, 화, 수, 목, 금)
- 셀(Cell): 해당 날짜의 모든 스케줄 (과목명, 교관명, 교시 정보)

#### 7. CourseTable Component
교과목 목록을 테이블 형태로 표시하는 재사용 가능한 컴포넌트

**Props:**
- `courses`: 표시할 교과목 목록 (CourseDisplay[])
- `showActions`: 액션 버튼 표시 여부 (boolean, default: false)
- `onEdit`: 수정 버튼 클릭 핸들러 (optional)
- `onDelete`: 삭제 버튼 클릭 핸들러 (optional)

**Features:**
- 평가 필드를 "평가"/"무시험" 형태로 표시
- 평가 유형에 따른 시각적 구분 (색상, 아이콘)
- 정렬 기능 (과목명, 시수, 담당교관, 평가 기준)
- 필터링 기능 (평가 유형별 필터)

**CSS Classes:**
```css
.evaluation-required {
  background-color: #fef3c7; /* 연한 노란색 */
  color: #92400e;
  font-weight: 600;
}

.evaluation-none {
  background-color: #f3f4f6; /* 연한 회색 */
  color: #6b7280;
}

.course-table-evaluation-cell {
  text-align: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
}
```

#### 8. TimeSlotModal Component
시간대 선택을 위한 모달 컴포넌트

**Props:**
- `isOpen`: 모달 표시 여부
- `onClose`: 모달 닫기 핸들러
- `onConfirm`: 시간대 확인 핸들러
- `onMultiDayRequest`: 다중 날짜 배정 요청 핸들러 (optional)
- `selectedDate`: 선택된 날짜
- `requiredHours`: 필요한 총 시수
- `courseName`: 교과목명
- `assignedHours`: 이미 배정된 시수 (default: 0)

**Features:**
- 요일별 최대 교시 수 및 시간 정보 표시
- 전투체력 과목 감지 및 하루 최대 2시간 제한
- 남은 시수가 하루 최대 교시를 초과할 경우 다중 날짜 배정 제안
- 부분 배정 지원 (선택한 시간만 배정하거나 다음 날로 이어서 배정)
- 실시간 시간 검증 및 오류 메시지 표시

#### 9. MultiDayAssignmentModal Component
다중 날짜 배정을 위한 모달 컴포넌트

**Props:**
- `isOpen`: 모달 표시 여부
- `onClose`: 모달 닫기 핸들러
- `onConfirm`: 다중 날짜 배정 확인 핸들러
- `selectedDate`: 시작 날짜
- `startPeriod`: 시작 교시
- `requestedHours`: 요청된 시수
- `courseName`: 교과목명
- `remainingHours`: 남은 시수
- `maxHoursPerDay`: 하루 최대 시간 제한 (optional, default: 999)
- `existingSchedules`: 기존 스케줄 정보 (optional)

**Features:**
- 자동 다중 날짜 계산 (주말 제외, 기존 스케줄 고려)
- 전투체력 과목 하루 최대 2시간 제한 적용
- 각 날짜별 배정 계획 시각화 (날짜, 교시 범위, 시간)
- 연속된 빈 교시 자동 탐색
- 배정 후 남은 시수 계산 및 표시

**State:**
- `assignments`: 계산된 날짜별 배정 계획 (DayAssignment[])

**Types:**
```typescript
interface DayAssignment {
  date: Date;
  startPeriod: number;
  endPeriod: number;
  hours: number;
}
```

### Backend API Endpoints

#### Course Management
```
POST   /api/upload
       - Body: multipart/form-data (Excel file)
       - Response: { success: boolean, message: string, courseCount: number }

GET    /api/courses
       - Query: ?preAssignment=1|2 (optional), ?displayFormat=true (optional)
       - Response: { courses: Course[] | CourseDisplay[] }
       - Note: displayFormat=true 시 평가 필드를 "평가"/"무시험"으로 변환하여 반환

PUT    /api/courses/:id
       - Body: { 구분, 과목, 시수, 담당교관, 선배정, 평가 }
       - Response: { success: boolean, course: Course }

DELETE /api/courses/:id
       - Response: { success: boolean }
```

**Backend Services:**

```javascript
// Evaluation Display Service
class EvaluationDisplayService {
  /**
   * Course 객체의 평가 필드를 표시용으로 변환
   */
  static formatCourseForDisplay(course) {
    return {
      ...course,
      평가: course.평가 === '1' ? '평가' : '무시험'
    };
  }

  /**
   * Course 배열을 표시용으로 변환
   */
  static formatCoursesForDisplay(courses) {
    return courses.map(course => this.formatCourseForDisplay(course));
  }

  /**
   * Schedule 객체의 연관된 Course 정보를 표시용으로 변환
   */
  static formatScheduleForDisplay(schedule) {
    if (schedule.course) {
      return {
        ...schedule,
        course: this.formatCourseForDisplay(schedule.course)
      };
    }
    return schedule;
  }
}

// Enhanced Upload Service
class UploadService {
  /**
   * 교과목 엑셀 파일 업로드 및 저장
   */
  async uploadExcelFile(buffer: Buffer): Promise<UploadResult> {
    // 기존 교과목 업로드 로직
  }

  /**
   * 교관 휴무일 엑셀 파일 업로드 및 저장
   */
  async uploadOffDaysExcelFile(buffer: Buffer): Promise<UploadResult> {
    // 1. 엑셀 파일 파싱 (이름, 시작날짜, 종료날짜, 비고 컬럼)
    // 2. 날짜 범위를 개별 날짜로 확장
    // 3. 교관 자동 생성 또는 조회
    // 4. 중복 방지하여 휴무일 저장
    // 5. 교관별 휴무일 요약 정보 반환
  }

  /**
   * 교관 휴무일 업로드용 엑셀 템플릿 생성
   */
  async generateOffDaysTemplate(): Promise<Buffer> {
    // 1. 양식 데이터 생성 (헤더 + 예시 데이터)
    // 2. 사용법 설명 시트 추가
    // 3. 스타일 및 형식 적용
    // 4. 엑셀 파일 버퍼 반환
  }
}
```

**Types and Interfaces:**
```typescript
interface UploadResult {
  success: boolean;
  message: string;
  courseCount?: number;
  instructorCount?: number;
  offDayCount?: number;
  instructorOffDays?: InstructorOffDaysSummary[];
}

interface InstructorOffDaysSummary {
  instructorName: string;
  offDays: {
    date: string;
    reason: string;
  }[];
}

interface DayAssignment {
  date: Date;
  startPeriod: number;
  endPeriod: number;
  hours: number;
}
```

#### Schedule Management
```
POST   /api/generate-schedule
       - Body: { startDate: string }
       - Response: { success: boolean, message: string, scheduleCount: number }

GET    /api/schedules
       - Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&displayFormat=true (optional)
       - Response: { schedules: Schedule[] }
       - Note: displayFormat=true 시 연관된 Course의 평가 필드를 "평가"/"무시험"으로 변환하여 반환

POST   /api/schedules (Pre-assignment)
       - Body: { courseId, date, startPeriod, endPeriod, instructorId }
       - Response: { success: boolean, schedule: Schedule }

PUT    /api/schedules/:id
       - Body: { date, startPeriod, endPeriod }
       - Response: { success: boolean, schedule: Schedule }

DELETE /api/schedules/:id
       - Response: { success: boolean }
```

#### Instructor & Off-day Management
```
GET    /api/instructors
       - Response: { instructors: Instructor[] }

GET    /api/off-days
       - Query: ?instructorId=number
       - Response: { offDays: OffDay[] }

POST   /api/off-days
       - Body: { instructorId, date }
       - Response: { success: boolean, offDay: OffDay }

DELETE /api/off-days/:id
       - Response: { success: boolean }

POST   /api/upload-off-days
       - Body: multipart/form-data (Excel file)
       - Response: { success: boolean, message: string, offDayCount: number, instructorOffDays: InstructorOffDaysSummary[] }

GET    /api/off-days-template
       - Response: Excel file download (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
```

## Data Models

### Database Schema

#### courses Table
```sql
CREATE TABLE courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  구분 TEXT NOT NULL,
  과목 TEXT NOT NULL,
  시수 INTEGER NOT NULL,
  담당교관 TEXT NOT NULL,
  선배정 INTEGER NOT NULL CHECK(선배정 IN (1, 2)),
  평가 TEXT,
  excel_order INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### instructors Table
```sql
CREATE TABLE instructors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### schedules Table
```sql
CREATE TABLE schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  instructor_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  start_period INTEGER NOT NULL,
  end_period INTEGER NOT NULL,
  is_pre_assigned BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
);

CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_schedules_course ON schedules(course_id);
```

#### off_days Table
```sql
CREATE TABLE off_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  instructor_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  reason TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  UNIQUE(instructor_id, date)
);

CREATE INDEX idx_off_days_instructor ON off_days(instructor_id);
CREATE INDEX idx_off_days_date ON off_days(date);
```

### TypeScript Interfaces

```typescript
interface Course {
  id: number;
  구분: string;
  과목: string;
  시수: number;
  담당교관: string;
  선배정: 1 | 2;
  평가: string; // Database stores "0" or "1"
  excel_order: number;
  created_at: string;
}

// Display-friendly course interface for frontend
interface CourseDisplay extends Omit<Course, '평가'> {
  평가: '평가' | '무시험'; // User-friendly display format
}

interface Instructor {
  id: number;
  name: string;
  created_at: string;
}

interface Schedule {
  id: number;
  course_id: number;
  instructor_id: number;
  date: string; // YYYY-MM-DD
  start_period: number; // 1-9
  end_period: number; // 1-9
  is_pre_assigned: boolean;
  created_at: string;
  // Joined data
  course?: Course;
  instructor?: Instructor;
}

interface OffDay {
  id: number;
  instructor_id: number;
  date: string; // YYYY-MM-DD
  reason: string;
  created_at: string;
  instructor?: Instructor;
}

interface TimeSlot {
  date: string;
  period: number;
  isOccupied: boolean;
}

interface DaySchedule {
  dayOfWeek: number; // 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
  maxPeriods: number;
  periods: {
    period: number;
    startTime: string;
    endTime: string;
  }[];
}
```

## Schedule Generation Algorithm

### Core Algorithm: Greedy Sequential Assignment

시간표 자동 생성 알고리즘은 다음 단계로 구성된다:

#### 1. Initialization
```
1. 선배정=2인 교과목을 excel_order 순으로 정렬
2. 시작 날짜부터 충분한 기간의 TimeSlot 배열 생성
3. 선배정된 일정으로 TimeSlot을 occupied로 표시
4. 교관별 휴무일 정보 로드
```

#### 2. Daily Schedule Configuration
```javascript
const DAILY_SCHEDULES = {
  1: { // 월요일
    maxPeriods: 9,
    periods: [
      { period: 1, start: '08:05', end: '08:50' },
      { period: 2, start: '08:55', end: '09:40' },
      { period: 3, start: '09:45', end: '10:30' },
      { period: 4, start: '10:35', end: '11:20' },
      // 점심시간 11:35-13:00
      { period: 5, start: '13:00', end: '13:45' },
      { period: 6, start: '13:50', end: '14:35' },
      { period: 7, start: '14:40', end: '15:25' },
      { period: 8, start: '15:30', end: '16:15' },
      { period: 9, start: '16:20', end: '17:05' }
    ]
  },
  2: { maxPeriods: 9 }, // 화요일 (월요일과 동일)
  3: { maxPeriods: 9 }, // 수요일 (월요일과 동일)
  4: { // 목요일
    maxPeriods: 8,
    periods: [
      { period: 1, start: '08:40', end: '09:25' },
      { period: 2, start: '09:30', end: '10:15' },
      { period: 3, start: '10:20', end: '11:05' },
      // 점심시간
      { period: 4, start: '13:00', end: '13:45' },
      { period: 5, start: '13:50', end: '14:35' },
      { period: 6, start: '14:40', end: '15:25' },
      { period: 7, start: '15:30', end: '16:15' },
      { period: 8, start: '16:20', end: '17:05' }
    ]
  },
  5: { // 금요일
    maxPeriods: 5,
    periods: [
      { period: 1, start: '08:40', end: '09:25' },
      { period: 2, start: '09:30', end: '10:15' },
      { period: 3, start: '10:20', end: '11:05' },
      // 점심시간
      { period: 4, start: '13:00', end: '13:45' },
      { period: 5, start: '13:50', end: '14:35' }
    ]
  }
};
```

#### 3. Course Assignment Loop
```
FOR each course in sorted courses:
  remainingHours = course.시수
  instructors = getInstructorsForCourse(course)
  lastAssignedDate = null
  
  FOR each instructor in instructors:
    allocatedHours = calculateAllocatedHours(instructor, course)
    
    WHILE allocatedHours > 0:
      slot = findNextAvailableSlot(
        currentDate,
        instructor,
        course,
        maxHoursPerDay = 3
      )
      
      IF slot is null:
        THROW Error("Cannot find available slot")
      
      hoursToAssign = min(allocatedHours, 3, remainingDailyCapacity)
      createSchedule(course, instructor, slot, hoursToAssign)
      allocatedHours -= hoursToAssign
      markSlotsAsOccupied(slot, hoursToAssign)
      lastAssignedDate = slot.date
  
  // 평가 항목이 1인 경우 다음날 2시간 시험 자동 배정
  IF course.평가 == 1 AND lastAssignedDate is not null:
    examDate = addDays(lastAssignedDate, 1)
    examSlot = findNextAvailableSlot(examDate, instructor, course, 2)
    IF examSlot:
      createSchedule(course, instructor, examSlot, 2, isExam=true)
      markSlotsAsOccupied(examSlot, 2)
```

#### 4. Constraint Validation Functions

```javascript
function findNextAvailableSlot(startDate, instructor, course, maxHoursPerDay) {
  let currentDate = startDate;
  
  while (true) {
    // 주말 스킵
    if (isWeekend(currentDate)) {
      currentDate = addDays(currentDate, 1);
      continue;
    }
    
    // 교관 휴무일 체크
    if (isInstructorOffDay(instructor.id, currentDate)) {
      currentDate = addDays(currentDate, 1);
      continue;
    }
    
    // 해당 날짜에 이미 배정된 해당 과목의 시수 확인
    const assignedHoursToday = getAssignedHoursForCourseOnDate(
      course.id,
      currentDate
    );
    
    if (assignedHoursToday >= maxHoursPerDay) {
      currentDate = addDays(currentDate, 1);
      continue;
    }
    
    // 동일 교관의 동일 과목 연강 제한 (최대 3시간)
    const consecutiveHours = getConsecutiveHoursForInstructorCourse(
      instructor.id,
      course.id,
      currentDate
    );
    
    if (consecutiveHours >= 3) {
      currentDate = addDays(currentDate, 1);
      continue;
    }
    
    // 연속된 빈 교시 찾기
    const availableSlot = findConsecutiveEmptyPeriods(
      currentDate,
      min(maxHoursPerDay - assignedHoursToday, remainingHours)
    );
    
    if (availableSlot) {
      return availableSlot;
    }
    
    currentDate = addDays(currentDate, 1);
  }
}

function findConsecutiveEmptyPeriods(date, requiredHours) {
  const dayOfWeek = getDayOfWeek(date);
  const maxPeriods = DAILY_SCHEDULES[dayOfWeek].maxPeriods;
  
  for (let startPeriod = 1; startPeriod <= maxPeriods; startPeriod++) {
    let consecutiveEmpty = 0;
    
    for (let period = startPeriod; period <= maxPeriods; period++) {
      if (isTimeSlotOccupied(date, period)) {
        break;
      }
      consecutiveEmpty++;
      
      if (consecutiveEmpty >= requiredHours) {
        return {
          date,
          startPeriod,
          endPeriod: startPeriod + requiredHours - 1
        };
      }
    }
  }
  
  return null;
}

function calculateAllocatedHours(instructor, course) {
  // 동일 과목의 모든 교관 조회
  const allInstructors = getInstructorsForCourse(course);
  
  if (allInstructors.length === 1) {
    return course.시수;
  }
  
  // 여러 교관이 있는 경우 시수를 균등 분배
  const hoursPerInstructor = Math.floor(course.시수 / allInstructors.length);
  const remainder = course.시수 % allInstructors.length;
  
  // 첫 번째 교관에게 나머지 시수 할당
  const instructorIndex = allInstructors.findIndex(i => i.id === instructor.id);
  return hoursPerInstructor + (instructorIndex === 0 ? remainder : 0);
}
```

### Algorithm Complexity
- Time Complexity: O(n * m * d * p)
  - n: 교과목 수
  - m: 평균 교관 수
  - d: 탐색할 날짜 수
  - p: 하루 최대 교시 수
- Space Complexity: O(d * p) for TimeSlot tracking

## Error Handling

### Frontend Error Handling

```typescript
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}

async function handleApiCall<T>(apiCall: Promise<T>): Promise<T> {
  try {
    return await apiCall;
  } catch (error) {
    if (error.response) {
      throw new ApiError(
        error.response.status,
        error.response.data.message || 'API Error',
        error.response.data
      );
    } else if (error.request) {
      throw new ApiError(0, 'Network Error: No response from server');
    } else {
      throw new ApiError(0, error.message);
    }
  }
}
```

### Backend Error Handling

```javascript
class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

class ScheduleGenerationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ScheduleGenerationError';
    this.statusCode = 500;
    this.details = details;
  }
}

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || null
  });
});
```

### Common Error Scenarios

1. **엑셀 파일 업로드 오류**
   - 잘못된 파일 형식: 400 Bad Request
   - 필수 컬럼 누락: 400 Bad Request with missing columns list
   - 파일 크기 초과: 413 Payload Too Large

2. **선배정 오류**
   - 시수 불일치: 400 Bad Request "선택한 시간이 교과목 시수와 일치하지 않습니다"
   - 시간 중복: 409 Conflict "해당 시간대에 이미 다른 과목이 배정되어 있습니다"

3. **자동 생성 오류**
   - 배정 불가능: 500 Internal Server Error "모든 교과목을 배정할 수 없습니다. 제약 조건을 확인하세요"
   - 교관 휴무일 충돌: 500 with details about conflicting instructor

4. **수동 수정 오류**
   - 일과시간 외: 400 Bad Request "선택한 시간이 일과시간을 벗어났습니다"
   - 시간 중복: 409 Conflict

## Testing Strategy

### Unit Tests

**Backend:**
- ExcelParser
  - 정상적인 엑셀 파일 파싱
  - 필수 컬럼 누락 시 에러 처리
  - 잘못된 데이터 타입 처리
  
- ScheduleGenerator
  - 단일 교과목 배정
  - 여러 교관이 있는 교과목 시수 분배
  - 하루 3시간 제한 검증
  - 교관 휴무일 회피
  - 선배정 시간 보존
  
- ValidationService
  - 시간 중복 검증
  - 일과시간 검증
  - 시수 일치 검증

**Frontend:**
- Component rendering tests
- User interaction tests (file upload, date selection, etc.)
- API call mocking tests

### Integration Tests

- 엑셀 업로드 → 데이터베이스 저장 → 조회 flow
- 선배정 → 자동 생성 → 조회 flow
- 시간표 수정 → 저장 → 조회 flow
- 교관 휴무일 등록 → 자동 생성 시 반영 확인

### End-to-End Tests

- 전체 시나리오: 엑셀 업로드 → 선배정 → 자동 생성 → 조회 → 수정
- 에러 시나리오: 잘못된 파일 업로드, 배정 불가능한 상황 등

### Performance Tests

- 100개 이상의 교과목 자동 생성 성능
- 대량의 시간표 데이터 조회 성능
- 동시 사용자 처리 능력

## Deployment Considerations

### Development Environment
```
- Frontend: npm run dev (Port 3000)
- Backend: npm run dev (Port 5000)
- Database: SQLite file in ./data/schedule.db
```

### Production Environment
```
- Frontend: Build static files and serve via Express
- Backend: PM2 or similar process manager
- Database: SQLite file with proper backup strategy
- Reverse proxy: Nginx (optional)
```

### Environment Variables
```
# Backend .env
PORT=5000
DATABASE_PATH=./data/schedule.db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Frontend .env
REACT_APP_API_URL=http://localhost:5000/api
```
