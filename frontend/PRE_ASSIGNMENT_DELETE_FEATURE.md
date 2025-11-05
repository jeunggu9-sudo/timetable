# 선배정 취소 기능

## 개요
선배정 관리 페이지에서 등록한 선배정을 클릭하여 취소(삭제)할 수 있는 기능이 추가되었습니다.

## 변경 사항

### 1. 이벤트 클릭 핸들러 추가

#### 월별 뷰 (FullCalendar)
```typescript
const handleEventClick = async (clickInfo: any) => {
  const schedule = clickInfo.event.extendedProps.schedule as Schedule;
  
  // 선배정된 일정만 삭제 가능
  if (!schedule.is_pre_assigned) {
    showError(new Error('선배정된 일정만 취소할 수 있습니다.'));
    return;
  }

  // 확인 대화상자
  if (!confirm(`${courseName} (${dateStr}, ${schedule.start_period}~${schedule.end_period}교시)\n\n이 선배정을 취소하시겠습니까?`)) {
    return;
  }

  // 삭제 실행
  await scheduleService.deleteSchedule(schedule.id);
  showSuccess('선배정이 취소되었습니다.');
  await loadData();
};
```

#### 주별 뷰 (WeeklyView)
- `onScheduleClick` 콜백에서 동일한 삭제 로직 구현
- 선배정된 일정만 삭제 가능하도록 검증

### 2. UI 개선

#### 선배정 이벤트 시각적 구분
```css
.calendar-event.pre-assigned {
  cursor: pointer;
  transition: all 0.2s;
}

.calendar-event.pre-assigned:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
```

#### 선배정 배지 추가
- 오렌지색 "선배정" 배지 표시
- 이벤트 제목 옆에 배치

#### 클릭 힌트 표시
- "클릭하여 취소" 텍스트 추가
- 빨간색으로 강조하여 클릭 가능함을 명확히 표시

### 3. 사용자 경험 개선

#### 확인 대화상자
```
네트워크 보안 (2025년 1월 15일, 1~3교시)

이 선배정을 취소하시겠습니까?
```
- 과목명, 날짜, 교시 정보를 명확히 표시
- 실수로 삭제하는 것을 방지

#### 피드백 메시지
- 성공: "선배정이 취소되었습니다."
- 실패: "선배정 취소 실패" + 에러 메시지
- 권한 없음: "선배정된 일정만 취소할 수 있습니다."

#### 자동 새로고침
- 삭제 후 자동으로 일정 목록 새로고침
- 캘린더에서 삭제된 이벤트 즉시 제거

### 4. 보안 및 검증

#### 선배정 여부 확인
```typescript
if (!schedule.is_pre_assigned) {
  showError(new Error('선배정된 일정만 취소할 수 있습니다.'));
  return;
}
```
- 자동 생성된 일정은 삭제 불가
- 선배정된 일정만 삭제 가능

## 사용 방법

### 월별 뷰에서 선배정 취소

1. **선배정 이벤트 확인**
   - 캘린더에서 "선배정" 배지가 있는 이벤트 찾기
   - 마우스를 올리면 확대되고 그림자 효과 표시

2. **이벤트 클릭**
   - 선배정 이벤트를 클릭

3. **확인**
   - 확인 대화상자에서 정보 확인
   - "확인" 버튼 클릭

4. **완료**
   - "선배정이 취소되었습니다." 메시지 표시
   - 캘린더에서 이벤트 자동 제거

### 주별 뷰에서 선배정 취소

1. **주별 뷰 전환**
   - 상단의 "주별" 버튼 클릭

2. **선배정 이벤트 클릭**
   - 시간표에서 선배정된 일정 클릭

3. **확인 및 완료**
   - 월별 뷰와 동일한 프로세스

## 시각적 특징

### 선배정 이벤트 표시
```
┌─────────────────────────────┐
│ 네트워크 보안 [선배정]      │
│ 교관: 김교관                │
│ 1교시 - 3교시               │
│ 클릭하여 취소               │
└─────────────────────────────┘
```

### 일반 이벤트 표시
```
┌─────────────────────────────┐
│ 데이터베이스                │
│ 교관: 이교관                │
│ 4교시 - 6교시               │
└─────────────────────────────┘
```

## 기술 세부사항

### 이벤트 데이터 구조
```typescript
{
  id: schedule.id.toString(),
  title: `${courseName} (${instructorName})`,
  start: schedule.date,
  extendedProps: {
    schedule,           // 전체 스케줄 객체
    courseName,
    instructorName,
    startPeriod: schedule.start_period,
    endPeriod: schedule.end_period,
    textColor: colors.text
  },
  backgroundColor: colors.background,
  borderColor: colors.border,
  textColor: colors.text
}
```

### 삭제 API 호출
```typescript
await scheduleService.deleteSchedule(schedule.id);
```

### 에러 처리
- 네트워크 오류: 에러 메시지 표시 및 재시도 가능
- 권한 오류: "선배정된 일정만 취소할 수 있습니다." 메시지
- 서버 오류: 상세 에러 메시지 표시

## 주의사항

1. **자동 생성 일정**: 시간표 자동 생성으로 만들어진 일정은 삭제할 수 없습니다. 선배정 페이지에서 수동으로 등록한 일정만 삭제 가능합니다.

2. **삭제 확인**: 삭제는 즉시 실행되며 되돌릴 수 없습니다. 확인 대화상자에서 신중하게 확인하세요.

3. **동시 작업**: 여러 사용자가 동시에 작업하는 경우, 다른 사용자가 삭제한 일정을 클릭하면 에러가 발생할 수 있습니다.

4. **새로고침**: 삭제 후 자동으로 새로고침되지만, 네트워크가 느린 경우 약간의 지연이 있을 수 있습니다.

## 향후 개선 가능 사항

1. **일괄 삭제**: 여러 선배정을 한 번에 선택하여 삭제
2. **삭제 취소**: 실수로 삭제한 경우 되돌리기 기능
3. **삭제 이력**: 누가 언제 삭제했는지 기록
4. **권한 관리**: 특정 사용자만 삭제 가능하도록 권한 설정
5. **드래그 앤 드롭**: 선배정 일정을 드래그하여 다른 날짜로 이동
6. **편집 기능**: 삭제 대신 시간이나 교시를 수정하는 기능

## 관련 파일

- `frontend/src/pages/PreAssignmentPage.tsx` - 선배정 페이지 컴포넌트
- `frontend/src/pages/PreAssignmentPage.css` - 스타일시트
- `frontend/src/services/scheduleService.ts` - 스케줄 API 서비스
- `backend/src/routes/schedule.ts` - 스케줄 삭제 API 엔드포인트
