# 선배정 부분 배정 기능

## 개요
선배정 과목을 하루에 전체 시수를 배정하는 대신, 여러 날에 나누어 부분적으로 배정할 수 있도록 개선되었습니다.

## 변경 사항

### 1. 백엔드 검증 로직 변경

#### 기존 로직
```typescript
// 선택된 시간이 교과목 시수와 정확히 일치해야 함
if (selectedHours !== course.시수) {
  return {
    valid: false,
    message: `선택한 시간이 교과목 시수와 일치하지 않습니다.`
  };
}
```

#### 새로운 로직
```typescript
// 1. 선택된 시간이 유효한지 검증
const selectedHours = endPeriod - startPeriod + 1;
if (selectedHours <= 0) {
  return {
    valid: false,
    message: '선택한 시간이 유효하지 않습니다.'
  };
}

// 2. 이미 배정된 시수 확인
const assignedHours = await this.scheduleRepo.getAssignedHoursForCourseOnDate(
  courseId,
  date
);
const totalAssignedHours = assignedHours + selectedHours;

// 3. 총 배정 시수가 교과목 시수를 초과하지 않는지 검증
if (totalAssignedHours > course.시수) {
  return {
    valid: false,
    message: `선택한 시간이 교과목 시수를 초과합니다. (교과목 시수: ${course.시수}시간, 이미 배정된 시수: ${assignedHours}시간, 선택한 시간: ${selectedHours}시간)`
  };
}
```

### 2. 프론트엔드 UI 개선

#### TimeSlotModal Props 추가
```typescript
interface TimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startPeriod: number, endPeriod: number) => void;
  selectedDate: Date | null;
  requiredHours: number;
  courseName: string;
  assignedHours?: number;  // 새로 추가
}
```

#### 이미 배정된 시수 계산
```typescript
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
```

#### 남은 시수 표시
```typescript
const remainingHours = requiredHours - assignedHours;

// UI에 표시
<div className="info-item">
  <span className="info-label">총 시수:</span>
  <span className="info-value">{requiredHours}시간</span>
</div>
{assignedHours > 0 && (
  <>
    <div className="info-item">
      <span className="info-label">배정된 시수:</span>
      <span className="info-value assigned">{assignedHours}시간</span>
    </div>
    <div className="info-item">
      <span className="info-label">남은 시수:</span>
      <span className="info-value remaining">{remainingHours}시간</span>
    </div>
  </>
)}
```

### 3. 검증 로직 개선

#### 남은 시수 초과 방지
```typescript
const validateSelection = (start: number, end: number) => {
  const selectedHours = end - start + 1;
  
  if (selectedHours > remainingHours) {
    setError(`선택한 시간이 남은 시수(${remainingHours}시간)를 초과합니다.`);
    return false;
  }
  
  // ... 기타 검증 로직
};
```

#### 자동 조정
```typescript
const handleStartPeriodChange = (value: number) => {
  setStartPeriod(value);
  // 남은 시수를 초과하지 않도록 자동 조정
  const newEndPeriod = Math.min(value + remainingHours - 1, maxPeriods);
  setEndPeriod(newEndPeriod);
  validateSelection(value, newEndPeriod);
};
```

## 사용 시나리오

### 시나리오 1: 6시간 과목을 3일에 나누어 배정

**1일차 배정**
- 과목: 네트워크 보안 (총 6시간)
- 날짜: 2025-01-15
- 선택: 1~2교시 (2시간)
- 결과: 배정 성공, 남은 시수 4시간

**2일차 배정**
- 과목: 네트워크 보안 (총 6시간)
- 날짜: 2025-01-16
- 배정된 시수: 2시간
- 남은 시수: 4시간
- 선택: 1~2교시 (2시간)
- 결과: 배정 성공, 남은 시수 2시간

**3일차 배정**
- 과목: 네트워크 보안 (총 6시간)
- 날짜: 2025-01-17
- 배정된 시수: 4시간
- 남은 시수: 2시간
- 선택: 1~2교시 (2시간)
- 결과: 배정 성공, 모든 시수 배정 완료

### 시나리오 2: 남은 시수 초과 시도

**상황**
- 과목: 데이터베이스 (총 3시간)
- 이미 배정: 2시간
- 남은 시수: 1시간

**시도**
- 선택: 1~3교시 (3시간)

**결과**
- 에러: "선택한 시간이 남은 시수(1시간)를 초과합니다."
- 자동 조정: 종료 교시가 1교시로 조정됨

### 시나리오 3: 모든 시수 배정 완료 후 시도

**상황**
- 과목: 프로그래밍 (총 4시간)
- 이미 배정: 4시간
- 남은 시수: 0시간

**시도**
- 날짜 클릭

**결과**
- 모달 표시: "프로그래밍 교과목의 모든 시수가 이미 배정되었습니다."
- 배정 불가

## UI 변경사항

### 시간 선택 모달

#### 부분 배정 전
```
┌─────────────────────────────────┐
│ 시간대 선택                  ×  │
├─────────────────────────────────┤
│ 과목: 네트워크 보안             │
│ 날짜: 2025-01-15 (월)           │
│ 필요 시수: 6시간                │
│                                 │
│ [시작 교시] [종료 교시]         │
│                                 │
│ [취소] [확인]                   │
└─────────────────────────────────┘
```

#### 부분 배정 후
```
┌─────────────────────────────────┐
│ 시간대 선택                  ×  │
├─────────────────────────────────┤
│ 과목: 네트워크 보안             │
│ 날짜: 2025-01-16 (화)           │
│ 총 시수: 6시간                  │
│ 배정된 시수: 2시간 (파란색)     │
│ 남은 시수: 4시간 (주황색)       │
│                                 │
│ [시작 교시] [종료 교시]         │
│                                 │
│ [취소] [확인]                   │
└─────────────────────────────────┘
```

### 색상 구분
- **배정된 시수**: 파란색 (#2196F3)
- **남은 시수**: 주황색 (#FF9800)

## 검증 순서

선배정 시 다음 순서로 검증이 수행됩니다:

1. **교과목 존재 확인**
2. **선택 시간 유효성 확인** (0보다 큼)
3. **이미 배정된 시수 확인**
4. **총 배정 시수 확인** (교과목 시수 초과 방지)
5. **일과시간 확인**
6. **교관 휴무일 확인**
7. **시간대 중복 확인**

## 에러 메시지

### 남은 시수 초과
```
선택한 시간이 남은 시수(2시간)를 초과합니다.
```

### 모든 시수 배정 완료
```
네트워크 보안 교과목의 모든 시수가 이미 배정되었습니다.
총 시수: 6시간, 배정된 시수: 6시간
```

### 백엔드 검증 실패
```json
{
  "valid": false,
  "message": "선택한 시간이 교과목 시수를 초과합니다. (교과목 시수: 6시간, 이미 배정된 시수: 4시간, 선택한 시간: 3시간)"
}
```

## 장점

### 1. 유연성 증가
- 교과목을 여러 날에 나누어 배정 가능
- 일과시간 제약에 맞춰 유연하게 배정

### 2. 실수 방지
- 자동으로 남은 시수 계산
- 초과 배정 방지
- 명확한 피드백 제공

### 3. 사용자 경험 개선
- 배정 진행 상황 실시간 표시
- 남은 시수 시각적 표시
- 자동 조정 기능

## 주의사항

1. **동일 날짜 중복 배정**: 같은 날짜에 여러 번 배정할 수 있습니다. 시간대만 겹치지 않으면 됩니다.

2. **총 시수 관리**: 여러 날에 나누어 배정할 때 총 시수가 교과목 시수와 일치하도록 주의해야 합니다.

3. **배정 순서**: 먼저 배정한 일정부터 순차적으로 표시됩니다.

4. **삭제 후 재배정**: 선배정을 삭제하면 해당 시수만큼 다시 배정할 수 있습니다.

## 향후 개선 가능 사항

1. **배정 진행률 표시**: 프로그레스 바로 배정 진행 상황 시각화

2. **일괄 배정**: 남은 시수를 자동으로 여러 날에 분산 배정

3. **배정 이력**: 어떤 날짜에 몇 시간씩 배정했는지 이력 표시

4. **추천 시간대**: AI가 최적의 시간대를 추천

5. **배정 템플릿**: 자주 사용하는 배정 패턴을 템플릿으로 저장

## 관련 파일

### 백엔드
- `backend/src/services/PreAssignmentValidator.ts` - 선배정 검증 로직
- `backend/src/repositories/ScheduleRepository.ts` - 배정 시수 조회

### 프론트엔드
- `frontend/src/components/TimeSlotModal.tsx` - 시간 선택 모달
- `frontend/src/components/TimeSlotModal.css` - 모달 스타일
- `frontend/src/pages/PreAssignmentPage.tsx` - 선배정 페이지
