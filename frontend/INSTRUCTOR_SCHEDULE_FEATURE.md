# 교관별 시간표 조회 기능

## 개요
교관별로 시간표를 조회하고 수정/삭제할 수 있는 새로운 페이지를 추가했습니다. 교관을 선택하면 해당 교관의 월별 시간표를 확인할 수 있으며, 각 일정을 클릭하여 수정하거나 삭제할 수 있습니다.

## 주요 기능

### 1. 교관 선택
- 드롭다운에서 교관을 선택
- 선택한 교관의 시간표만 표시

### 2. 월별 조회
- 이전 달 / 다음 달 네비게이션
- 이번 달로 바로 이동
- 현재 선택된 월 표시

### 3. 교관 정보 요약
- 교관명
- 이번 달 총 시수
- 배정된 일정 수

### 4. 시간표 목록
- 날짜별로 그룹화하여 표시
- 각 일정의 시간, 과목명, 배지(선배정/평가) 표시
- 일정 클릭 시 수정 모달 열림

### 5. 일정 수정/삭제
- 기존 ScheduleEditModal 재사용
- 날짜, 시작 교시, 종료 교시 수정 가능
- 삭제 기능 제공
- 수정 시 검증:
  - 일과시간 내 시간대인지 확인
  - 교관 휴무일 체크
  - 교관 시간 충돌 체크
  - 강의실 충돌 체크

## 구현 파일

### 백엔드

#### 1. `backend/src/routes/schedule.ts`
- `GET /api/schedules?instructorId={id}&startDate={date}&endDate={date}` 엔드포인트 추가
- 교관별 시간표 조회 기능

#### 2. `backend/src/repositories/ScheduleRepository.ts`
- `findByInstructorWithDetails()` 메서드 추가
- 교관 ID로 일정을 조회하고 Course, Instructor 정보를 JOIN

```typescript
async findByInstructorWithDetails(
  instructorId: number,
  startDate?: string,
  endDate?: string
): Promise<Schedule[]>
```

### 프론트엔드

#### 1. `frontend/src/pages/InstructorSchedulePage.tsx`
새로운 교관별 시간표 조회 페이지

**주요 컴포넌트:**
- 교관 선택 드롭다운
- 월별 네비게이션
- 교관 정보 요약 카드
- 날짜별 시간표 목록
- 시간표 수정 모달

**상태 관리:**
- `instructors`: 교관 목록
- `selectedInstructor`: 선택된 교관 ID
- `currentDate`: 현재 조회 중인 월
- `schedules`: 시간표 목록
- `selectedSchedule`: 수정할 일정

#### 2. `frontend/src/pages/InstructorSchedulePage.css`
페이지 스타일링

**주요 스타일:**
- 교관 선택 영역
- 날짜 네비게이션
- 교관 정보 요약 (그라데이션 배경)
- 날짜별 그룹 카드
- 시간표 아이템 (호버 효과)
- 배지 스타일 (선배정, 평가)
- 반응형 디자인

#### 3. `frontend/src/services/scheduleService.ts`
- `getSchedulesByInstructor()` 메서드 추가

```typescript
async getSchedulesByInstructor(
  instructorId: number,
  startDate?: string,
  endDate?: string
): Promise<Schedule[]>
```

#### 4. `frontend/src/services/courseService.ts`
- `Schedule` 인터페이스에 `is_exam` 필드 추가

#### 5. `frontend/src/App.tsx`
- `/instructor-schedule` 라우트 추가
- `InstructorSchedulePage` 컴포넌트 import

#### 6. `frontend/src/components/Layout.tsx`
- "교관별 시간표" 메뉴 추가

## API 명세

### GET /api/schedules
교관별 시간표 조회

**Query Parameters:**
- `instructorId` (number, required): 교관 ID
- `startDate` (string, optional): 시작 날짜 (YYYY-MM-DD)
- `endDate` (string, optional): 종료 날짜 (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "schedules": [
    {
      "id": 1,
      "course_id": 10,
      "instructor_id": 2,
      "date": "2025-11-05",
      "start_period": 1,
      "end_period": 3,
      "is_pre_assigned": false,
      "is_exam": false,
      "created_at": "2025-10-29T10:00:00.000Z",
      "course": {
        "id": 10,
        "구분": "전공",
        "과목": "네트워크 보안",
        "시수": 20,
        "담당교관": "김교관",
        "선배정": 2,
        "평가": "1",
        "excel_order": 1,
        "created_at": "2025-10-29T09:00:00.000Z"
      },
      "instructor": {
        "id": 2,
        "name": "김교관",
        "created_at": "2025-10-29T09:00:00.000Z"
      }
    }
  ]
}
```

## 사용 시나리오

### 1. 교관별 시간표 확인
1. "교관별 시간표" 메뉴 클릭
2. 드롭다운에서 교관 선택
3. 해당 교관의 이번 달 시간표 확인
4. 총 시수와 일정 수 확인

### 2. 다른 월 조회
1. "이전 달" 또는 "다음 달" 버튼 클릭
2. 해당 월의 시간표 확인
3. "이번 달" 버튼으로 현재 월로 복귀

### 3. 일정 수정
1. 수정할 일정 클릭
2. 수정 모달에서 날짜, 시작/종료 교시 변경
3. "저장" 버튼 클릭
4. 검증 통과 시 수정 완료
5. 검증 실패 시 에러 메시지 표시

### 4. 일정 삭제
1. 삭제할 일정 클릭
2. 수정 모달에서 "삭제" 버튼 클릭
3. 확인 대화상자에서 "확인" 클릭
4. 삭제 완료

## 검증 로직

일정 수정 시 다음 항목을 검증합니다:

1. **일과시간 검증**
   - 주말이 아닌지 확인
   - 해당 요일의 최대 교시 범위 내인지 확인
   - 시작 교시 ≤ 종료 교시 확인

2. **교관 휴무일 체크**
   - 수정하려는 날짜가 교관의 휴무일이 아닌지 확인

3. **교관 시간 충돌 체크**
   - 같은 시간에 교관이 다른 과목을 가르치고 있지 않은지 확인

4. **강의실 충돌 체크**
   - 같은 시간에 다른 과목이 배정되어 있지 않은지 확인

## UI/UX 특징

### 시각적 요소
- 교관 정보 요약: 보라색 그라데이션 배경으로 강조
- 날짜별 그룹: 회색 헤더로 구분
- 배지: 선배정(파란색), 평가(주황색)
- 호버 효과: 일정 항목에 마우스 올리면 배경색 변경

### 반응형 디자인
- 모바일에서는 교관 정보 요약이 세로로 배치
- 일정 항목이 세로로 재배치
- 네비게이션 버튼 크기 조정

### 접근성
- 로딩 상태 표시
- 빈 상태 메시지
- 키보드 네비게이션 지원 (모달)
- 명확한 버튼 레이블

## 향후 개선 사항

1. **주별/일별 뷰 추가**
   - 현재는 월별만 지원
   - 주별, 일별 뷰 옵션 추가 가능

2. **통계 정보 추가**
   - 과목별 시수 분포
   - 요일별 시수 분포
   - 월별 시수 추이

3. **엑셀 내보내기**
   - 교관별 시간표를 엑셀로 내보내기

4. **인쇄 기능**
   - 교관별 시간표 인쇄 최적화

5. **필터링 기능**
   - 선배정만 보기
   - 평가만 보기
   - 특정 과목만 보기

## 테스트 체크리스트

- [ ] 교관 선택 시 해당 교관의 시간표만 표시되는지 확인
- [ ] 월 네비게이션이 정상 작동하는지 확인
- [ ] 총 시수와 일정 수가 정확히 계산되는지 확인
- [ ] 일정 클릭 시 수정 모달이 열리는지 확인
- [ ] 일정 수정 시 검증이 정상 작동하는지 확인
- [ ] 교관 휴무일로 수정 시 에러 메시지가 표시되는지 확인
- [ ] 시간 충돌 시 에러 메시지가 표시되는지 확인
- [ ] 일정 삭제가 정상 작동하는지 확인
- [ ] 빈 상태 메시지가 표시되는지 확인
- [ ] 반응형 디자인이 정상 작동하는지 확인
