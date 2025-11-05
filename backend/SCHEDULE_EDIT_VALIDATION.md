# 시간표 수정 검증 기능 개선

## 개요
시간표 조회 페이지에서 과목을 선택하여 수정할 때, 다른 시간표와의 충돌 및 교관의 휴무일을 체크하여 수정이 가능하도록 검증 로직을 강화했습니다.

## 변경 사항

### 1. ScheduleModificationValidator 개선
**파일**: `backend/src/services/ScheduleModificationValidator.ts`

#### 추가된 검증 항목:

1. **교관 휴무일 체크**
   - 수정하려는 날짜가 해당 교관의 휴무일인지 확인
   - 휴무일인 경우 수정 불가

2. **교관 시간 충돌 체크**
   - 같은 시간에 해당 교관이 다른 과목을 가르치고 있는지 확인
   - 교관이 동시에 두 과목을 가르칠 수 없음

3. **강의실 충돌 체크** (기존 기능 유지)
   - 같은 시간에 다른 과목이 배정되어 있는지 확인

#### 검증 순서:
```
1. 기존 일정 정보 조회
2. 일과시간 내 시간대인지 검증
3. 교관 휴무일 체크
4. 교관 시간 충돌 체크
5. 강의실 충돌 체크
```

### 2. 백엔드 라우트 수정
**파일**: `backend/src/routes/schedule.ts`

- `PUT /api/schedules/:id` 엔드포인트에서 `OffDayRepository` 추가
- `ScheduleModificationValidator` 생성 시 `offDayRepo` 전달

## 검증 로직 상세

### checkInstructorConflict 메서드
```typescript
private async checkInstructorConflict(
  instructorId: number,
  date: string,
  startPeriod: number,
  endPeriod: number,
  excludeScheduleId: number
): Promise<ValidationResult>
```

**기능**:
- 해당 날짜의 모든 일정을 조회
- 같은 교관의 일정 중 시간이 겹치는 것이 있는지 확인
- 자기 자신(수정 중인 일정)은 제외

**시간 충돌 판정 조건**:
- 시작 교시가 기존 일정의 시작~종료 교시 사이에 있는 경우
- 종료 교시가 기존 일정의 시작~종료 교시 사이에 있는 경우
- 새로운 시간대가 기존 일정을 완전히 포함하는 경우

## 에러 메시지

| 상황 | 메시지 |
|------|--------|
| 일정을 찾을 수 없음 | "수정할 일정을 찾을 수 없습니다." |
| 일과시간 외 | "선택한 시간이 일과시간을 벗어났습니다. (해당 요일 최대 교시: X)" |
| 교관 휴무일 | "해당 날짜는 교관의 휴무일입니다." |
| 교관 시간 충돌 | "해당 시간대에 교관이 다른 과목을 가르치고 있습니다." |
| 강의실 충돌 | "해당 시간대에 이미 다른 과목이 배정되어 있습니다." |

## 사용 예시

### API 요청
```http
PUT /api/schedules/123
Content-Type: application/json

{
  "date": "2025-11-01",
  "startPeriod": 3,
  "endPeriod": 5
}
```

### 성공 응답
```json
{
  "success": true,
  "schedule": {
    "id": 123,
    "course_id": 1,
    "instructor_id": 2,
    "date": "2025-11-01",
    "start_period": 3,
    "end_period": 5,
    "is_pre_assigned": false,
    "is_exam": false,
    "created_at": "2025-10-29T10:00:00.000Z"
  }
}
```

### 실패 응답 (교관 휴무일)
```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "해당 날짜는 교관의 휴무일입니다."
  }
}
```

### 실패 응답 (교관 시간 충돌)
```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "해당 시간대에 교관이 다른 과목을 가르치고 있습니다."
  }
}
```

## 테스트 시나리오

1. **정상 수정**
   - 충돌이 없는 시간대로 수정
   - 교관 휴무일이 아닌 날짜로 수정

2. **교관 휴무일 체크**
   - 교관의 휴무일로 수정 시도 → 실패

3. **교관 시간 충돌 체크**
   - 교관이 다른 과목을 가르치는 시간으로 수정 시도 → 실패

4. **강의실 충돌 체크**
   - 다른 과목이 배정된 시간으로 수정 시도 → 실패

5. **자기 자신 제외**
   - 같은 시간대로 수정 (변경 없음) → 성공

## 프론트엔드 연동

프론트엔드의 `ScheduleEditModal` 컴포넌트는 이미 백엔드 API를 호출하고 있으며, 에러 메시지를 사용자에게 표시합니다.

에러 발생 시 `showError(error)` 함수를 통해 사용자에게 친화적인 메시지가 표시됩니다.

## 주의사항

- 수정 시 `course_id`와 `instructor_id`는 변경되지 않습니다 (날짜와 시간만 수정 가능)
- 선배정 일정도 동일한 검증 로직을 거칩니다
- 시험 일정도 동일한 검증 로직을 거칩니다
