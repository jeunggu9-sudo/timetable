# 시간표 자동생성 연강 제한 및 평가 배정 수정

## 문제점

1. **연강 제한 미작동**: 동일 교관의 동일 과목이 3시간 이상 연강으로 배정됨
2. **평가 시간 미배정**: 평가=1인 교과목의 시험 시간이 배정되지 않음

## 원인 분석

### 1. 연강 제한 문제

**기존 로직:**
```typescript
// ScheduleRepository.getConsecutiveHoursForInstructorCourse()
const schedules = await db.all<Schedule[]>(
  `SELECT * FROM schedules
   WHERE instructor_id = ? AND course_id = ? AND date = ?
   ORDER BY start_period`,
  [instructorId, courseId, date]
);
```

**문제점:**
- 데이터베이스를 조회하여 연강 체크
- 자동 생성 중에는 아직 데이터베이스에 저장되지 않음
- TimeSlot 맵에는 boolean 값만 저장되어 교관/과목 정보 없음

### 2. 평가 시간 배정 문제

**기존 로직:**
```typescript
// 평가=1인 경우 다음날 2시간 시험 자동 배정
if (course.평가 === '1' && lastAssignedDate && lastInstructorId) {
  const examAssignment = await this.scheduleExam(...);
  if (examAssignment) {
    assignments.push(examAssignment);
  }
}
```

**문제점:**
- 로직은 존재하지만 TimeSlot에 표시되지 않아 중복 배정 가능
- 연강 체크가 작동하지 않아 시험 시간 찾기 실패 가능

## 해결 방법

### 1. TimeSlot 맵 확장

#### 교관/과목 정보 저장용 맵 추가
```typescript
export class ConstraintValidator {
  private timeSlots: Map<string, boolean>;
  private slotAssignments: Map<string, { instructorId: number; courseId: number }>;
  
  constructor(scheduleRepo: ScheduleRepository, offDayRepo: OffDayRepository) {
    this.scheduleRepo = scheduleRepo;
    this.offDayRepo = offDayRepo;
    this.timeSlots = new Map();
    this.slotAssignments = new Map();  // 새로 추가
  }
}
```

### 2. markSlotsAsOccupied 메서드 수정

```typescript
// 기존
markSlotsAsOccupied(date: string, startPeriod: number, endPeriod: number): void {
  for (let period = startPeriod; period <= endPeriod; period++) {
    const key = this.getTimeSlotKey(date, period);
    this.timeSlots.set(key, true);
  }
}

// 수정 후
markSlotsAsOccupied(
  date: string,
  startPeriod: number,
  endPeriod: number,
  instructorId?: number,
  courseId?: number
): void {
  for (let period = startPeriod; period <= endPeriod; period++) {
    const key = this.getTimeSlotKey(date, period);
    this.timeSlots.set(key, true);
    
    // 교관과 과목 정보 저장
    if (instructorId !== undefined && courseId !== undefined) {
      this.slotAssignments.set(key, { instructorId, courseId });
    }
  }
}
```

### 3. TimeSlot 맵 기반 연강 체크 메서드 추가

```typescript
getConsecutiveHoursFromSlots(
  instructorId: number,
  courseId: number,
  date: string,
  startPeriod: number
): number {
  let consecutiveHours = 0;
  let checkPeriod = startPeriod - 1;

  // 시작 교시 이전부터 역순으로 확인
  while (checkPeriod >= 1) {
    const key = this.getTimeSlotKey(date, checkPeriod);
    const assignment = this.slotAssignments.get(key);

    // 동일 교관, 동일 과목인지 확인
    if (
      assignment &&
      assignment.instructorId === instructorId &&
      assignment.courseId === courseId
    ) {
      consecutiveHours++;
      checkPeriod--;
    } else {
      break;
    }
  }

  return consecutiveHours;
}
```

### 4. CourseAssigner 수정

#### 연강 체크 메서드 변경
```typescript
// 기존: 데이터베이스 조회 (작동 안 함)
const consecutiveHours = await this.validator.getConsecutiveHoursForInstructorCourse(
  instructorId,
  courseId,
  availableSlot.date,
  availableSlot.startPeriod
);

// 수정: TimeSlot 맵 사용
const consecutiveHours = this.validator.getConsecutiveHoursFromSlots(
  instructorId,
  courseId,
  availableSlot.date,
  availableSlot.startPeriod
);
```

#### TimeSlot 표시 시 교관/과목 정보 포함
```typescript
// 일반 배정
this.validator.markSlotsAsOccupied(
  slot.date,
  slot.startPeriod,
  slot.endPeriod,
  instructorId,
  course.id
);

// 시험 배정
this.validator.markSlotsAsOccupied(
  examSlot.date,
  examSlot.startPeriod,
  examSlot.endPeriod,
  instructorId,
  courseId
);
```

## 수정 후 동작

### 연강 제한 시나리오

```
교과목: 네트워크 보안 (6시간)
교관: 김교관
날짜: 2025-01-15

1차 배정 시도 (1~3교시):
- 연속 시수 확인: 0시간
- 배정 시수: 3시간
- 검증: 0 + 3 = 3 ≤ 3 → 통과 ✓
- TimeSlot 표시: 1~3교시 (김교관, 네트워크 보안)

2차 배정 시도 (4~6교시, 같은 날):
- 연속 시수 확인: 3시간 (1~3교시)
- 검증: 3 ≥ 3 → 실패 ✗
- 다음 날로 이동

2차 배정 (다음 날 1~3교시):
- 연속 시수 확인: 0시간
- 배정 시수: 3시간
- 검증: 0 + 3 = 3 ≤ 3 → 통과 ✓
```

### 평가 배정 시나리오

```
교과목: 데이터베이스 (6시간, 평가=1)
교관: 이교관

1. 일반 수업 배정:
   - 1일차: 3시간 배정
   - 2일차: 3시간 배정
   - 총 6시간 배정 완료

2. 평가 시간 배정:
   - 마지막 수업 날짜: 2025-01-16
   - 시험 시작 날짜: 2025-01-17 (다음날)
   - 시험 시간: 2시간
   - TimeSlot 표시: 시험 시간 (이교관, 데이터베이스)
   - 결과: 시험 배정 성공 ✓
```

## 테스트 시나리오

### 테스트 1: 연강 제한 확인
1. 6시간 과목 생성 (선배정=2)
2. 시간표 자동 생성
3. 결과 확인:
   - 같은 날 3시간 이하로 배정
   - 여러 날에 분산 배정

### 테스트 2: 평가 시간 배정 확인
1. 6시간 과목 생성 (선배정=2, 평가=1)
2. 시간표 자동 생성
3. 결과 확인:
   - 일반 수업 6시간 배정
   - 마지막 수업 다음날 2시간 시험 배정
   - 시험 일정에 is_exam=true 플래그

### 테스트 3: 복합 시나리오
1. 여러 과목 생성 (일부는 평가=1)
2. 시간표 자동 생성
3. 결과 확인:
   - 모든 과목의 연강 제한 준수
   - 평가=1인 과목의 시험 시간 배정
   - 시간 충돌 없음

## 로그 확인

시간표 생성 시 다음과 같은 로그가 출력됩니다:

```
교과목 배정 시작: 네트워크 보안 (시수: 6, 평가: 1)
교과목 배정 완료: 네트워크 보안 - 일반 일정 2개, 시험 일정 1개

교과목 배정 시작: 데이터베이스 (시수: 3, 평가: 0)
교과목 배정 완료: 데이터베이스 - 일반 일정 1개, 시험 일정 0개
```

## 관련 파일

- `backend/src/services/ConstraintValidator.ts`
  - `slotAssignments` 맵 추가
  - `markSlotsAsOccupied()` 메서드 수정
  - `getConsecutiveHoursFromSlots()` 메서드 추가

- `backend/src/services/CourseAssigner.ts`
  - 연강 체크 메서드 변경
  - TimeSlot 표시 시 교관/과목 정보 포함

## 주의사항

1. **메모리 사용**: `slotAssignments` 맵이 추가되어 메모리 사용량이 약간 증가합니다.

2. **초기화**: `initializeTimeSlots()` 호출 시 `slotAssignments`도 함께 초기화됩니다.

3. **선배정**: 선배정된 일정도 TimeSlot 맵에 표시되어야 연강 체크가 정확합니다.

## 결론

이제 시간표 자동생성 시:
1. 동일 교관의 동일 과목이 3시간 이상 연강으로 배정되지 않습니다.
2. 평가=1인 교과목의 시험 시간이 자동으로 배정됩니다.
3. TimeSlot 맵을 사용하여 실시간으로 연강을 체크합니다.
