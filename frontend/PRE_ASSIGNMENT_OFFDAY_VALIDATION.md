# 선배정 교관 휴무일 검증 기능

## 개요
선배정 시 교관의 휴무일을 확인하여 휴무일에는 선배정이 등록되지 않도록 검증 기능이 추가되었습니다.

## 변경 사항

### 1. 백엔드 검증 로직 추가

#### PreAssignmentValidator 업데이트
```typescript
// OffDayRepository 추가
constructor(
  courseRepo: CourseRepository,
  scheduleRepo: ScheduleRepository,
  offDayRepo: OffDayRepository
) {
  this.courseRepo = courseRepo;
  this.scheduleRepo = scheduleRepo;
  this.offDayRepo = offDayRepo;
}

// 교관 휴무일 체크 추가
async validatePreAssignment(
  courseId: number,
  instructorId: number,  // 파라미터 추가
  date: string,
  startPeriod: number,
  endPeriod: number
): Promise<{ valid: boolean; message?: string }> {
  // ... 기존 검증 로직 ...
  
  // 4. 교관 휴무일 체크
  const isOffDay = await this.offDayRepo.isInstructorOffDay(instructorId, date);
  if (isOffDay) {
    return {
      valid: false,
      message: '해당 날짜는 교관의 휴무일입니다.'
    };
  }
  
  // ... 나머지 검증 로직 ...
}
```

#### Schedule Route 업데이트
```typescript
const offDayRepo = new OffDayRepository();
const validator = new PreAssignmentValidator(courseRepo, scheduleRepo, offDayRepo);
const validationResult = await validator.validatePreAssignment(
  courseId,
  instructorId,  // instructorId 전달
  date,
  startPeriod,
  endPeriod
);
```

### 2. 프론트엔드 UI 개선

#### 교관 휴무일 데이터 로드
```typescript
const [instructorOffDays, setInstructorOffDays] = useState<string[]>([]);

const handleCourseSelect = async (course: Course) => {
  setSelectedCourse(course);
  const instructor = instructors.find(i => i.name === course.담당교관);
  setSelectedInstructor(instructor || null);
  
  // 교관의 휴무일 로드
  if (instructor) {
    const offDays = await instructorService.getOffDays(instructor.id);
    setInstructorOffDays(offDays.map(od => od.date));
  }
};
```

#### 날짜 클릭 시 휴무일 체크
```typescript
const handleDateClick = (arg: DateClickArg) => {
  // ... 기존 검증 로직 ...
  
  // 교관 휴무일 체크
  const dateStr = `${year}-${month}-${day}`;
  if (instructorOffDays.includes(dateStr)) {
    showError(new Error('해당 날짜는 교관의 휴무일입니다.'));
    return;
  }
  
  setSelectedDate(clickedDate);
  setIsModalOpen(true);
};
```

#### 캘린더에 휴무일 시각적 표시
```typescript
dayCellClassNames={(arg) => {
  const classes = [];
  
  // 주말 표시
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    classes.push('weekend-cell');
  }
  
  // 교관 휴무일 표시
  if (selectedInstructor && instructorOffDays.includes(dateStr)) {
    classes.push('offday-cell');
  }
  
  return classes.join(' ');
}}
```

### 3. 시각적 디자인

#### 휴무일 셀 스타일
```css
.calendar-panel .offday-cell {
  background-color: #fff3e0 !important;  /* 주황색 배경 */
  cursor: not-allowed !important;
  position: relative;
  pointer-events: none;
  opacity: 0.7;
}

.calendar-panel .offday-cell::after {
  content: '휴무';
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  font-weight: 600;
  color: #FF9800;
  background: #fff;
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid #FF9800;
}
```

#### 휴무일 안내 메시지
```css
.offday-info {
  margin-top: 8px;
  padding: 8px;
  background: #fff3e0;
  border-radius: 4px;
  font-size: 12px;
  color: #FF9800;
  border-left: 3px solid #FF9800;
  font-weight: 500;
}
```

## 검증 순서

선배정 시 다음 순서로 검증이 수행됩니다:

1. **교과목 존재 확인**
   - 선택한 교과목이 데이터베이스에 존재하는지 확인

2. **시수 일치 확인**
   - 선택한 시간이 교과목의 시수와 일치하는지 확인

3. **일과시간 확인**
   - 주말이 아닌지 확인
   - 선택한 교시가 해당 요일의 일과시간 내인지 확인

4. **교관 휴무일 확인** ⭐ NEW
   - 선택한 날짜가 교관의 휴무일이 아닌지 확인

5. **시간대 중복 확인**
   - 선택한 시간대에 다른 과목이 배정되어 있지 않은지 확인

## 사용자 경험

### 교과목 선택 시
1. 교과목을 선택하면 자동으로 해당 교관의 휴무일 로드
2. 캘린더에 휴무일이 주황색으로 표시됨
3. 휴무일 셀 우측 상단에 "휴무" 배지 표시

### 휴무일 클릭 시
- 클릭이 차단됨 (pointer-events: none)
- 에러 메시지: "해당 날짜는 교관의 휴무일입니다."

### 휴무일 안내
- 선택된 교과목 정보 하단에 안내 메시지 표시
- "⚠️ 주황색으로 표시된 날짜는 교관의 휴무일입니다."

## 시각적 구분

### 일반 날짜
```
┌─────────────┐
│     15      │
│             │
│             │
└─────────────┘
```

### 주말
```
┌─────────────┐
│     16      │  (회색 배경)
│             │
│             │
└─────────────┘
```

### 교관 휴무일
```
┌─────────────┐
│     17  [휴무]│  (주황색 배경)
│             │
│             │
└─────────────┘
```

## 에러 메시지

### 프론트엔드 (클릭 시)
```
해당 날짜는 교관의 휴무일입니다.
```

### 백엔드 (API 검증)
```json
{
  "valid": false,
  "message": "해당 날짜는 교관의 휴무일입니다."
}
```

## 기술 세부사항

### 날짜 형식
- 모든 날짜는 `YYYY-MM-DD` 형식으로 처리
- 예: `2025-01-15`

### 휴무일 데이터 구조
```typescript
interface OffDay {
  id: number;
  instructor_id: number;
  date: string;  // YYYY-MM-DD
  created_at: string;
}
```

### API 호출
```typescript
// 교관 휴무일 조회
const offDays = await instructorService.getOffDays(instructorId);

// 선배정 생성 (휴무일 검증 포함)
await scheduleService.createPreAssignment({
  courseId,
  instructorId,
  date,
  startPeriod,
  endPeriod
});
```

## 주의사항

1. **교관 정보 필수**: 교과목에 교관이 지정되어 있어야 휴무일 체크가 가능합니다.

2. **실시간 업데이트**: 교관 휴무일이 변경되면 교과목을 다시 선택해야 캘린더에 반영됩니다.

3. **이중 검증**: 프론트엔드와 백엔드 모두에서 검증하여 보안을 강화했습니다.

4. **네트워크 오류**: 휴무일 로드 실패 시 빈 배열로 처리되어 선배정은 가능하지만, 백엔드에서 최종 검증됩니다.

## 테스트 시나리오

### 시나리오 1: 정상 선배정
1. 교과목 선택
2. 일반 날짜 클릭
3. 시간 선택
4. 선배정 성공

### 시나리오 2: 휴무일 선배정 시도 (프론트엔드 차단)
1. 교과목 선택
2. 주황색 휴무일 클릭 시도
3. 클릭 차단됨 (pointer-events: none)

### 시나리오 3: 휴무일 선배정 시도 (백엔드 검증)
1. API를 직접 호출하여 휴무일에 선배정 시도
2. 백엔드에서 검증 실패
3. 에러 메시지 반환: "해당 날짜는 교관의 휴무일입니다."

## 향후 개선 가능 사항

1. **휴무일 범례**: 캘린더 상단에 색상 범례 추가 (주말, 휴무일, 일반 날짜)

2. **휴무일 목록**: 선택된 교관의 휴무일 목록을 별도로 표시

3. **휴무일 필터**: 휴무일을 제외한 날짜만 표시하는 옵션

4. **일괄 휴무일 설정**: 여러 교관의 공통 휴무일 설정 (예: 공휴일)

5. **휴무일 알림**: 선배정 시도 전에 휴무일 개수를 미리 표시

## 관련 파일

### 백엔드
- `backend/src/services/PreAssignmentValidator.ts` - 선배정 검증 로직
- `backend/src/routes/schedule.ts` - 선배정 API 엔드포인트
- `backend/src/repositories/OffDayRepository.ts` - 휴무일 데이터 접근

### 프론트엔드
- `frontend/src/pages/PreAssignmentPage.tsx` - 선배정 페이지 컴포넌트
- `frontend/src/pages/PreAssignmentPage.css` - 스타일시트
- `frontend/src/services/instructorService.ts` - 교관 API 서비스
