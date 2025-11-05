# TimeSlotModal 검증 로직 수정

## 문제점

선배정 시 날짜를 선택하고 시작교시와 종료교시를 선택하면 경고가 나오고 배정하기 버튼이 활성화되지 않는 문제가 발생했습니다.

### 원인 분석

```typescript
// 문제가 있던 코드
<button 
  className="btn btn-primary" 
  onClick={handleConfirm}
  disabled={!!error || selectedHours !== requiredHours}  // ← 문제!
>
  배정하기
</button>
```

**문제점:**
- `selectedHours !== requiredHours` 조건으로 인해 선택한 시간이 **전체 시수**와 정확히 일치해야만 버튼 활성화
- 부분 배정을 허용하도록 변경했지만, 버튼 활성화 조건은 업데이트하지 않음

### 문제 시나리오

```
교과목: 네트워크 보안 (총 6시간)
이미 배정: 2시간
남은 시수: 4시간

사용자가 2시간 선택:
- selectedHours = 2
- requiredHours = 6
- 조건: 2 !== 6 → true
- 결과: 버튼 비활성화 ✗

사용자가 6시간 선택 시도:
- selectedHours = 6
- remainingHours = 4
- 검증: 6 > 4 → 에러 발생
- 결과: 버튼 비활성화 ✗

결론: 어떤 경우에도 버튼 활성화 불가!
```

## 해결 방법

### 1. 버튼 활성화 조건 수정

```typescript
// 수정 전
disabled={!!error || selectedHours !== requiredHours}

// 수정 후
disabled={!!error}
```

**변경 사항:**
- `selectedHours !== requiredHours` 조건 제거
- 에러가 없으면 버튼 활성화
- 남은 시수 이하로 선택하면 배정 가능

### 2. 검증 로직 순서 개선

```typescript
const validateSelection = (start: number, end: number) => {
  // 1. 기본 검증 (교시 범위, 순서)
  if (start > end) {
    setError('시작 교시가 종료 교시보다 클 수 없습니다.');
    return false;
  }
  
  if (start < 1 || end > maxPeriods) {
    setError(`선택한 교시가 일과시간을 벗어났습니다.`);
    return false;
  }
  
  const selectedHours = end - start + 1;
  
  // 2. 시간 검증
  if (selectedHours <= 0) {
    setError('최소 1시간 이상 선택해야 합니다.');
    return false;
  }
  
  // 3. 남은 시수 검증
  if (selectedHours > remainingHours) {
    setError(`선택한 시간이 남은 시수(${remainingHours}시간)를 초과합니다.`);
    return false;
  }
  
  // 모든 검증 통과
  setError('');
  return true;
};
```

**개선 사항:**
- 검증 순서를 논리적으로 재배치
- 기본 검증 → 시간 검증 → 남은 시수 검증
- 명확한 에러 메시지 제공

### 3. 선택 요약 UI 개선

```typescript
// 수정 전
<div className={`summary-box ${selectedHours === requiredHours ? 'valid' : 'invalid'}`}>
  <span>선택된 시간: {selectedHours}시간</span>
  {selectedHours === requiredHours ? (
    <span className="check-icon">✓</span>
  ) : (
    <span className="warning-icon">⚠</span>
  )}
</div>

// 수정 후
<div className={`summary-box ${!error && selectedHours > 0 && selectedHours <= remainingHours ? 'valid' : 'invalid'}`}>
  <span>선택된 시간: {selectedHours}시간</span>
  {!error && selectedHours > 0 && selectedHours <= remainingHours ? (
    <span className="check-icon">✓</span>
  ) : (
    <span className="warning-icon">⚠</span>
  )}
</div>
{assignedHours > 0 && selectedHours <= remainingHours && (
  <div className="remaining-info">
    배정 후 남은 시수: {remainingHours - selectedHours}시간
  </div>
)}
```

**개선 사항:**
- 검증 조건을 `requiredHours`가 아닌 `remainingHours`와 비교
- 배정 후 남은 시수 정보 추가 표시
- 시각적 피드백 개선

### 4. CSS 스타일 추가

```css
.remaining-info {
  margin-top: 8px;
  padding: 8px 12px;
  background: #e3f2fd;
  border-radius: 4px;
  color: #1976d2;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}
```

## 수정 후 동작

### 시나리오 1: 부분 배정 (정상)

```
교과목: 네트워크 보안 (총 6시간)
이미 배정: 2시간
남은 시수: 4시간

사용자가 2시간 선택:
- selectedHours = 2
- remainingHours = 4
- 검증: 2 ≤ 4 → 통과 ✓
- 에러: 없음
- 버튼: 활성화 ✓
- 표시: "배정 후 남은 시수: 2시간"
```

### 시나리오 2: 남은 시수 전체 배정 (정상)

```
교과목: 네트워크 보안 (총 6시간)
이미 배정: 2시간
남은 시수: 4시간

사용자가 4시간 선택:
- selectedHours = 4
- remainingHours = 4
- 검증: 4 ≤ 4 → 통과 ✓
- 에러: 없음
- 버튼: 활성화 ✓
- 표시: "배정 후 남은 시수: 0시간"
```

### 시나리오 3: 남은 시수 초과 (에러)

```
교과목: 네트워크 보안 (총 6시간)
이미 배정: 2시간
남은 시수: 4시간

사용자가 5시간 선택 시도:
- selectedHours = 5
- remainingHours = 4
- 검증: 5 > 4 → 실패 ✗
- 에러: "선택한 시간이 남은 시수(4시간)를 초과합니다."
- 버튼: 비활성화 ✗
```

## UI 개선 사항

### 선택 요약 박스

**정상 상태 (초록색):**
```
┌─────────────────────────────────┐
│ 선택된 시간: 2시간          ✓  │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 배정 후 남은 시수: 2시간        │
└─────────────────────────────────┘
```

**에러 상태 (주황색):**
```
┌─────────────────────────────────┐
│ 선택된 시간: 5시간          ⚠  │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 선택한 시간이 남은 시수(4시간)를│
│ 초과합니다.                     │
└─────────────────────────────────┘
```

## 테스트 시나리오

### 테스트 1: 1시간 배정
1. 6시간 과목 선택
2. 날짜 클릭
3. 1~1교시 선택 (1시간)
4. 결과: 버튼 활성화, "배정 후 남은 시수: 5시간" 표시

### 테스트 2: 여러 번 부분 배정
1. 6시간 과목 선택
2. 1일차: 2시간 배정 → 성공
3. 2일차: 2시간 배정 → 성공
4. 3일차: 2시간 배정 → 성공
5. 4일차: 1시간 배정 시도 → 에러 (남은 시수 0시간)

### 테스트 3: 자동 조정
1. 6시간 과목 선택 (이미 4시간 배정)
2. 날짜 클릭
3. 시작 교시 선택 시 종료 교시 자동 조정
4. 남은 시수(2시간)를 초과하지 않도록 자동 제한

## 관련 파일

- `frontend/src/components/TimeSlotModal.tsx` - 모달 컴포넌트 로직
- `frontend/src/components/TimeSlotModal.css` - 모달 스타일

## 결론

이제 선배정 시 부분 배정이 정상적으로 작동하며, 사용자는 남은 시수 범위 내에서 자유롭게 시간을 선택할 수 있습니다. 명확한 피드백과 함께 배정 후 남은 시수도 확인할 수 있어 사용자 경험이 크게 개선되었습니다.
