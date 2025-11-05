# 시간표 출력 기능 구현

## 개요
날짜 범위를 선택하여 주간 단위 표 형식으로 시간표를 PDF로 다운로드할 수 있는 기능을 구현했습니다.

## 설치 필요 패키지
```bash
npm install jspdf html2canvas
npm install --save-dev @types/html2canvas
```

## 구현 내용

### 1. SchedulePrintPage 컴포넌트 (frontend/src/pages/SchedulePrintPage.tsx)

#### 주요 기능
- **날짜 범위 선택**: 시작 날짜와 종료 날짜를 선택하여 원하는 기간의 시간표 조회
- **주간 단위 테이블**: 각 행이 한 주(월~금)를 나타내는 표 형식
- **스케줄 표시**: 각 날짜별로 과목명, 교관명, 교시 정보 표시
- **평가 구분**: 평가 스케줄에 [평가] 접두사 추가
- **인쇄 기능**: 브라우저 인쇄 다이얼로그를 통한 출력

#### 테이블 구조
```
| 날짜  | 월요일      | 화요일      | 수요일      | 목요일      | 금요일      |
|-------|-------------|-------------|-------------|-------------|-------------|
| 1/6   | 과목1       | 과목2       | 과목3       | 과목4       | 과목5       |
|       | 교관A       | 교관B       | 교관C       | 교관D       | 교관E       |
|       | 1~3교시     | 1~2교시     | 4~6교시     | 1~3교시     | 1~2교시     |
| 1/13  | ...         | ...         | ...         | ...         | ...         |
```

각 셀 내에서 스케줄 정보는 다음과 같이 표시됩니다:
```
교과목명
교관명
교시정보
```

#### 주요 함수

**generateWeeklyData()**
- 선택한 날짜 범위를 주 단위로 그룹화
- 각 주의 월요일을 기준으로 월~금 날짜 생성
- 날짜 범위를 벗어나는 날짜는 null로 처리

**fetchSchedules()**
- 선택한 날짜 범위의 스케줄 데이터 조회
- scheduleService.getSchedules() API 호출

**calculateCourseSummary()**
- 교과목별 배정시간 계산
- 수업시간과 평가시간을 별도로 집계
- 담당교관별로 구분하여 요약
- 교과목명 기준으로 정렬

**handlePrint()**
- html2canvas로 print-content 영역을 캔버스로 변환
- jsPDF로 A4 가로 형식의 PDF 생성
- 내용이 한 페이지를 초과하면 자동으로 페이지 분할
- 생성된 PDF를 자동으로 다운로드

### 2. 스타일링 (frontend/src/pages/SchedulePrintPage.css)

#### 화면 표시 스타일
- 깔끔한 카드 형식의 UI
- 날짜 선택기와 출력 버튼
- 테이블 형식의 시간표 표시
- 스케줄 항목별 구분선과 배경색

#### 인쇄 스타일 (@media print)
- UI 컨트롤 숨김 (.no-print)
- 페이지 나누기 최적화
- 배경색 유지 (print-color-adjust: exact)
- 폰트 크기 조정
- 여백 최소화

### 3. 라우팅 설정

**App.tsx**
- `/print` 경로에 SchedulePrintPage 컴포넌트 연결
- import 추가

**Layout.tsx**
- 네비게이션 메뉴에 "시간표 출력" 링크 추가
- 접근성 속성 (aria-label, aria-current) 설정

## 사용 방법

1. 네비게이션 메뉴에서 "시간표 출력" 클릭
2. 시작 날짜와 종료 날짜 선택
3. 자동으로 해당 기간의 시간표가 주간 단위 표로 표시됨
4. "📄 PDF 다운로드" 버튼 클릭
5. 자동으로 PDF 파일이 생성되어 다운로드됨
   - 파일명: `시간표_YYYYMMDD_YYYYMMDD.pdf`
   - 형식: A4 가로 (Landscape)

## 특징

### 주간 단위 그룹화
- 월요일을 기준으로 한 주를 구성
- 날짜 범위가 주 중간부터 시작해도 정확하게 처리
- 빈 날짜는 "-"로 표시

### 스케줄 표시
- 하루에 여러 스케줄이 있는 경우 모두 표시
- 각 스케줄은 3줄로 구성:
  - 1줄: 교과목명 (평가인 경우 [평가] 접두사 포함)
  - 2줄: 교관명
  - 3줄: 교시 정보 (예: 1~3교시)
- 평가 스케줄은 [평가] 접두사로 구분

### 교과목별 배정시간 요약
- 시간표 하단에 교과목별 배정시간 요약 테이블 표시
- 각 교과목의 수업시간과 평가시간을 별도로 표시
- 담당교관별로 구분하여 표시
- 전체 합계 행으로 총 시간 확인 가능
- 평가시간은 빨간색으로 강조 표시

### PDF 생성 기능
- **jsPDF + html2canvas 사용**: HTML을 이미지로 변환 후 PDF 생성
- **A4 가로 형식**: 297mm x 210mm 크기로 최적화
- **고해상도**: scale=2로 선명한 출력
- **자동 페이지 분할**: 내용이 길 경우 자동으로 여러 페이지로 분할
- **파일명 자동 생성**: 날짜 범위를 포함한 파일명
- **로딩 상태 표시**: PDF 생성 중 버튼 비활성화 및 상태 표시

## 기술 스택
- React + TypeScript
- date-fns (날짜 처리)
- jsPDF (PDF 생성)
- html2canvas (HTML to Canvas 변환)

## 관련 파일
- `frontend/src/pages/SchedulePrintPage.tsx`
- `frontend/src/pages/SchedulePrintPage.css`
- `frontend/src/App.tsx`
- `frontend/src/components/Layout.tsx`

## 요구사항 충족
- ✅ Requirement 7.1: 날짜 범위 선택기 제공
- ✅ Requirement 7.2: 주간 단위 표 형식 (행=주, 열=요일)
- ✅ Requirement 7.3: 첫 번째 열에 주의 시작 날짜 표시
- ✅ Requirement 7.4: 과목명, 교관명, 교시 정보 표시
- ✅ Requirement 7.5: 인쇄 버튼 제공
- ✅ Requirement 7.6: 인쇄 시 UI 컨트롤 숨김
- ✅ Requirement 7.7: 평가 스케줄에 [평가] 접두사 표시
