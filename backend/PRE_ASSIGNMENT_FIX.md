# 선배정 부분 배정 오류 수정

## 문제점

선배정 시 시간을 나누어 배정할 때 오류가 발생했습니다.

### 원인 분석

1. **백엔드 검증 로직**: `getAssignedHoursForCourseOnDate()` 메서드를 사용하여 **특정 날짜**의 배정 시수만 확인
2. **프론트엔드 계산**: 선택한 날짜의 배정 시수만 계산하여 `assignedHours`로 전달

### 문제 시나리오

```
교과목: 네트워크 보안 (총 6시간)

1일차 (2025-01-15): 2시간 배정 ✓
2일차 (2025-01-16): 2시간 배정 시도
  - 백엔드: 2025-01-16에 배정된 시수 = 0시간
  - 검증: 0 + 2 = 2 ≤ 6 → 통과 ✓
  
3일차 (2025-01-17): 2시간 배정 시도
  - 백엔드: 2025-01-17에 배정된 시수 = 0시간
  - 검증: 0 + 2 = 2 ≤ 6 → 통과 ✓
  
4일차 (2025-01-18): 2시간 배정 시도
  - 백엔드: 2025-01-18에 배정된 시수 = 0시간
  - 검증: 0 + 2 = 2 ≤ 6 → 통과 ✓
  
결과: 총 8시간 배정 (6시간 초과!) ✗
```

## 해결 방법

### 1. 백엔드 수정

#### 새로운 메서드 추가
```typescript
/**
 * 특정 과목의 전체 배정된 시수를 조회합니다 (모든 날짜 포함)
 */
async getTotalAssignedHoursForCourse(courseId: number): Promise<number> {
  const db = await this.getDb();
  const result = await db.get<{ total: number }>(
    `SELECT SUM(end_period - start_period + 1) as total
     FROM schedules
     WHERE course_id = ?`,
    [courseId]
  );
  return result?.total ?? 0;
}
```

#### PreAssignmentValidator 수정
```typescript
// 기존: 특정 날짜의 배정 시수만 확인
const assignedHours = await this.scheduleRepo.getAssignedHoursForCourseOnDate(
  courseId,
  date
);

// 수정: 전체 날짜의 배정 시수 확인
const totalAssignedHours = await this.scheduleRepo.getTotalAssignedHoursForCourse(
  courseId
);
const newTotalHours = totalAssignedHours + selectedHours;

if (newTotalHours > course.시수) {
  return {
    valid: false,
    message: `선택한 시간이 교과목 시수를 초과합니다. (교과목 시수: ${course.시수}시간, 이미 배정된 시수: ${totalAssignedHours}시간, 선택한 시간: ${selectedHours}시간)`
  };
}
```

### 2. 프론트엔드 수정

#### assignedHours 계산 변경
```typescript
// 기존: 선택한 날짜의 배정 시수만 계산
assignedHours={
  selectedCourse && selectedDate
    ? schedules
        .filter(
          (s) =>
            s.course_id === selectedCourse.id &&
            s.date === dateStr
        )
        .reduce((sum, s) => sum + (s.end_period - s.start_period + 1), 0)
    : 0
}

// 수정: 전체 날짜의 배정 시수 계산
assignedHours={
  selectedCourse
    ? schedules
        .filter((s) => s.course_id === selectedCourse.id)
        .reduce((sum, s) => sum + (s.end_period - s.start_period + 1), 0)
    : 0
}
```

## 수정 후 동작

### 올바른 시나리오

```
교과목: 네트워크 보안 (총 6시간)

1일차 (2025-01-15): 2시간 배정
  - 전체 배정 시수: 0시간
  - 검증: 0 + 2 = 2 ≤ 6 → 통과 ✓
  - 결과: 배정 성공, 남은 시수 4시간

2일차 (2025-01-16): 2시간 배정
  - 전체 배정 시수: 2시간
  - 검증: 2 + 2 = 4 ≤ 6 → 통과 ✓
  - 결과: 배정 성공, 남은 시수 2시간

3일차 (2025-01-17): 2시간 배정
  - 전체 배정 시수: 4시간
  - 검증: 4 + 2 = 6 ≤ 6 → 통과 ✓
  - 결과: 배정 성공, 남은 시수 0시간

4일차 (2025-01-18): 2시간 배정 시도
  - 전체 배정 시수: 6시간
  - 검증: 6 + 2 = 8 > 6 → 실패 ✗
  - 에러: "선택한 시간이 교과목 시수를 초과합니다."
```

## 테스트 시나리오

### 시나리오 1: 정상 부분 배정
1. 6시간 과목 선택
2. 1일차에 2시간 배정 → 성공 (남은 시수: 4시간)
3. 2일차에 2시간 배정 → 성공 (남은 시수: 2시간)
4. 3일차에 2시간 배정 → 성공 (남은 시수: 0시간)

### 시나리오 2: 초과 배정 방지
1. 6시간 과목 선택
2. 1일차에 4시간 배정 → 성공 (남은 시수: 2시간)
3. 2일차에 3시간 배정 시도 → 실패 (에러 메시지 표시)

### 시나리오 3: 모달에서 남은 시수 확인
1. 6시간 과목 선택
2. 1일차에 2시간 배정 → 성공
3. 2일차 날짜 클릭
4. 모달 표시:
   - 총 시수: 6시간
   - 배정된 시수: 2시간 (파란색)
   - 남은 시수: 4시간 (주황색)

## 관련 파일

### 백엔드
- `backend/src/repositories/ScheduleRepository.ts`
  - `getTotalAssignedHoursForCourse()` 메서드 추가
- `backend/src/services/PreAssignmentValidator.ts`
  - 검증 로직 수정

### 프론트엔드
- `frontend/src/pages/PreAssignmentPage.tsx`
  - `assignedHours` 계산 로직 수정

## 주의사항

1. **데이터베이스 쿼리**: 전체 날짜의 배정 시수를 조회하므로 성능에 영향이 있을 수 있습니다. 하지만 선배정은 자주 발생하지 않으므로 문제없습니다.

2. **캐싱**: 필요시 배정 시수를 캐싱하여 성능을 개선할 수 있습니다.

3. **동시성**: 여러 사용자가 동시에 같은 과목을 배정하는 경우 race condition이 발생할 수 있습니다. 필요시 트랜잭션 처리를 추가해야 합니다.

## 결론

이제 선배정 과목을 여러 날에 나누어 배정할 때 전체 시수를 정확히 추적하여 교과목 시수를 초과하지 않도록 보장합니다.
