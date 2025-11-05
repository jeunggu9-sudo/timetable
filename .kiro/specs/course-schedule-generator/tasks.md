# Implementation Plan

- [x] 1. 프로젝트 초기 설정 및 구조 생성




  - 프론트엔드(React)와 백엔드(Node.js/Express) 프로젝트 디렉토리 구조 생성
  - 필요한 npm 패키지 설치 및 package.json 설정
  - TypeScript 설정 (tsconfig.json)
  - 환경변수 파일 템플릿 생성 (.env.example)
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 2. 데이터베이스 스키마 및 초기화 구현


  - SQLite 데이터베이스 연결 모듈 작성
  - courses, instructors, schedules, off_days 테이블 생성 스크립트 작성
  - 인덱스 생성 및 외래키 제약조건 설정
  - 데이터베이스 초기화 함수 구현
  - _Requirements: 7.3, 1.2_

- [x] 3. 백엔드 Repository 레이어 구현




  - [x] 3.1 CourseRepository 구현


    - CRUD 메서드 작성 (create, findAll, findById, update, delete)
    - 선배정 값으로 필터링하는 메서드 (findByPreAssignment)
    - Excel 순서로 정렬하는 메서드
    - _Requirements: 1.2, 2.1_
  
  - [x] 3.2 InstructorRepository 구현


    - CRUD 메서드 작성
    - 이름으로 교관 찾기 또는 생성하는 메서드 (findOrCreate)
    - _Requirements: 4.2, 4.3_
  
  - [x] 3.3 ScheduleRepository 구현


    - CRUD 메서드 작성
    - 날짜 범위로 일정 조회 메서드 (findByDateRange)
    - 특정 날짜/교시의 중복 체크 메서드 (checkConflict)
    - 특정 날짜/과목의 배정된 시수 조회 메서드
    - Course 및 Instructor 정보를 JOIN하여 조회하는 메서드
    - _Requirements: 2.4, 3.4, 5.4, 6.1, 6.2, 6.3_
  
  - [x] 3.4 OffDayRepository 구현


    - CRUD 메서드 작성
    - 교관별 휴무일 조회 메서드
    - 특정 날짜에 휴무인 교관 목록 조회 메서드
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 4. 엑셀 파일 파싱 및 업로드 기능 구현





  - [x] 4.1 ExcelParser 서비스 구현


    - xlsx 라이브러리를 사용한 엑셀 파일 읽기
    - 필수 컬럼 검증 ('구분', '과목', '시수', '담당교관', '선배정', '평가')
    - 데이터 타입 검증 (시수는 양의 정수, 선배정은 1 또는 2)
    - 파싱된 데이터를 Course 객체 배열로 변환
    - _Requirements: 1.1, 1.3, 1.5_
  
  - [x] 4.2 파일 업로드 API 엔드포인트 구현


    - multer 미들웨어 설정
    - POST /api/upload 엔드포인트 구현
    - 파싱된 데이터를 데이터베이스에 저장
    - 동일 과목에 여러 교관이 있는 경우 처리 로직
    - 교관 자동 생성 (instructors 테이블)
    - 에러 처리 (파일 형식, 컬럼 누락 등)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5. 시간표 자동 생성 알고리즘 구현




  - [x] 5.1 일과시간 설정 및 유틸리티 함수 구현


    - 요일별 최대 교시 수 및 시간 정보 상수 정의
    - 날짜가 주말인지 확인하는 함수
    - 날짜의 요일을 반환하는 함수
    - 교시 번호를 시간으로 변환하는 함수
    - _Requirements: 3.2_
  
  - [x] 5.2 제약조건 검증 함수 구현


    - 특정 날짜/교시가 이미 배정되었는지 확인하는 함수
    - 특정 날짜에 과목이 몇 시간 배정되었는지 확인하는 함수
    - 교관이 특정 날짜에 휴무인지 확인하는 함수
    - 연속된 빈 교시를 찾는 함수 (findConsecutiveEmptyPeriods)
    - _Requirements: 3.3, 3.6, 3.7_
  
  - [x] 5.3 교과목 배정 로직 구현


    - 다음 사용 가능한 시간대를 찾는 함수 (findNextAvailableSlot)
    - 여러 교관이 있는 경우 시수 분배 계산 함수 (calculateAllocatedHours)
    - 교과목을 시간표에 배정하는 메인 함수
    - _Requirements: 3.1, 3.3, 3.5, 3.8_
  
  - [x] 5.4 ScheduleGenerator 서비스 통합


    - 선배정=2인 교과목을 excel_order 순으로 정렬
    - 선배정된 일정을 TimeSlot 배열에 반영
    - 각 교과목을 순차적으로 배정하는 메인 루프
    - 배정 불가능한 경우 에러 처리
    - 생성된 일정을 데이터베이스에 저장
    - _Requirements: 3.1, 3.4_
  
  - [x] 5.5 시간표 생성 API 엔드포인트 구현


    - POST /api/generate-schedule 엔드포인트 구현
    - 시작 날짜 파라미터 검증
    - ScheduleGenerator 서비스 호출
    - 생성 결과 반환 (성공 여부, 생성된 일정 수)
    - _Requirements: 3.1_

- [x] 6. 선배정 기능 구현




  - [x] 6.1 선배정 검증 로직 구현


    - 선택된 시간 범위가 교과목 시수와 일치하는지 검증
    - 선택된 시간대에 중복이 없는지 검증
    - 선택된 시간이 일과시간 내인지 검증
    - _Requirements: 2.2, 2.3, 2.5_
  
  - [x] 6.2 선배정 API 엔드포인트 구현


    - POST /api/schedules 엔드포인트 구현 (선배정용)
    - 요청 데이터 검증 (courseId, date, startPeriod, endPeriod, instructorId)
    - 검증 로직 호출
    - 데이터베이스에 저장 (is_pre_assigned = true)
    - _Requirements: 2.1, 2.2, 2.4_

- [x] 7. 시간표 조회 API 구현





  - GET /api/schedules 엔드포인트 구현
  - 날짜 범위 파라미터 처리 (startDate, endDate)
  - ScheduleRepository를 통한 데이터 조회
  - Course 및 Instructor 정보를 포함한 응답 반환
  - _Requirements: 6.1, 6.2, 6.3, 6.6_

- [x] 8. 시간표 수동 수정 기능 구현





  - [x] 8.1 시간표 수정 검증 로직 구현


    - 새로운 시간대가 일과시간 내인지 검증
    - 새로운 시간대에 중복이 없는지 검증
    - _Requirements: 5.2, 5.3_
  
  - [x] 8.2 시간표 수정/삭제 API 엔드포인트 구현


    - PUT /api/schedules/:id 엔드포인트 구현
    - DELETE /api/schedules/:id 엔드포인트 구현
    - 검증 로직 호출
    - 데이터베이스 업데이트
    - _Requirements: 5.1, 5.4, 5.5_

- [x] 9. 교관 휴무일 관리 API 구현




  - GET /api/instructors 엔드포인트 구현
  - GET /api/off-days 엔드포인트 구현 (교관별 필터링 지원)
  - POST /api/off-days 엔드포인트 구현
  - DELETE /api/off-days/:id 엔드포인트 구현
  - 중복 휴무일 방지 (UNIQUE 제약조건)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_


- [x] 10. 백엔드 에러 처리 미들웨어 구현




  - ValidationError, ScheduleGenerationError 클래스 정의
  - 전역 에러 핸들러 미들웨어 작성
  - 각 API 엔드포인트에 try-catch 및 에러 처리 추가
  - _Requirements: 1.3, 2.3, 2.5, 5.3_

- [x] 11. React 프론트엔드 기본 설정



  - React Router 설정 (페이지 라우팅)
  - Axios 인스턴스 설정 (API 클라이언트)
  - 전역 에러 처리 유틸리티 작성
  - 공통 레이아웃 컴포넌트 작성
  - _Requirements: 7.1_

- [x] 12. 엑셀 업로드 페이지 구현





  - [x] 12.1 UploadPage 컴포넌트 구현


    - 파일 선택 UI
    - 파일 업로드 버튼 및 진행 상태 표시
    - 업로드 성공/실패 메시지 표시
    - _Requirements: 1.1_
  
  - [x] 12.2 파싱 결과 미리보기 기능 구현

    - 업로드된 교과목 목록을 테이블로 표시
    - 교과목 수, 총 시수 등 요약 정보 표시
    - _Requirements: 1.2_

- [x] 13. 선배정 캘린더 페이지 구현




  - [x] 13.1 PreAssignmentCalendar 컴포넌트 기본 구조


    - FullCalendar 라이브러리 통합
    - 선배정=1인 교과목 목록 조회 및 표시
    - 교과목 선택 UI
    - _Requirements: 2.1_
  
  - [x] 13.2 시간대 선택 및 배정 기능 구현


    - 캘린더에서 날짜 클릭 시 TimeSlotModal 표시
    - TimeSlotModal 컴포넌트 통합
    - 선배정 API 호출 및 결과 처리
    - 배정된 일정을 캘린더에 표시
    - _Requirements: 2.1, 2.2, 2.6, 2.7, 2.8_
  
  - [x] 13.3 다중 날짜 배정 기능 구현


    - MultiDayAssignmentModal 컴포넌트 통합
    - 하루 최대 교시 초과 시 다중 날짜 배정 제안
    - 전투체력 과목 하루 최대 2시간 제한 처리
    - 부분 배정 지원 (일부 시간만 배정 후 나머지는 나중에)
    - _Requirements: 2.3, 2.4, 2.5, 9.1, 9.2, 9.3, 9.4, 9.6, 9.8, 9.9_

- [x] 14. 시간표 자동 생성 페이지 구현





  - ScheduleGenerationPage 컴포넌트 구현
  - 시작 날짜 선택 UI (DatePicker)
  - 시간표 생성 버튼 및 진행 상태 표시
  - 생성 API 호출 및 결과 메시지 표시
  - 생성 완료 후 시간표 조회 페이지로 이동
  - _Requirements: 3.1_
- [ ] 15. 시간표 조회 페이지 구현



- [ ] 15. 시간표 조회 페이지 구현

  - [x] 15.1 ScheduleView 컴포넌트 기본 구조


    - 월별/주별/일별 뷰 모드 전환 UI
    - 날짜 네비게이션 컨트롤 (이전/다음)
    - 현재 선택된 날짜 표시
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  
  - [x] 15.2 월별 뷰 구현


    - FullCalendar의 월별 뷰 사용
    - 일정 데이터 조회 및 캘린더에 표시
    - 각 일정에 과목명, 교관명 표시
    - _Requirements: 6.1, 6.6_
  
  - [x] 15.3 주별/일별 뷰 구현


    - 교시 단위 시간표 테이블 UI
    - 각 교시별로 과목명, 교관명, 시간 정보 표시
    - 빈 교시는 빈 셀로 표시
    - _Requirements: 6.2, 6.3, 6.4, 6.6_
  
  - [x] 15.4 시간표 수동 수정 기능 통합


    - 일정 클릭 시 수정 모달 표시
    - 날짜 및 시간 변경 UI
    - 수정 API 호출 및 결과 처리
    - 삭제 버튼 및 삭제 API 호출
    - _Requirements: 5.1, 5.2, 5.4_

- [x] 16. 교관 휴무일 관리 페이지 구현




  - [x] 16.1 InstructorOffDayManagement 컴포넌트 기본 구현


    - 교관 목록 조회 및 선택 UI
    - 선택된 교관의 휴무일 목록 표시
    - 휴무일 추가 UI (DatePicker)
    - 휴무일 삭제 버튼
    - API 호출 및 결과 처리
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 16.2 교관 휴무일 엑셀 업로드 기능 구현


    - 엑셀 파일 업로드 UI 추가
    - 업로드 결과 표시 (교관별 휴무일 요약)
    - 엑셀 템플릿 다운로드 기능
    - 업로드 진행 상태 및 에러 처리
    - _Requirements: 4.6, 4.7, 4.8, 4.9, 4.10_

- [ ] 17. 프론트엔드 에러 처리 및 사용자 피드백



  - ApiError 클래스 및 handleApiCall 유틸리티 구현
  - 전역 에러 토스트/알림 컴포넌트 구현
  - 각 API 호출에 에러 처리 추가
  - 로딩 상태 표시 (스피너, 프로그레스 바)
  - _Requirements: 1.3, 2.3, 2.5, 5.3_

- [x] 18. 스타일링 및 UI/UX 개선



  - Tailwind CSS 또는 Material-UI 설정
  - 반응형 디자인 적용
  - 일관된 색상 및 타이포그래피 적용
  - 접근성 개선 (ARIA 레이블, 키보드 네비게이션)
  - _Requirements: 7.1_

- [x] 19. 교과목 관리 페이지 구현 (CRUD)
  - CourseManagementPage 컴포넌트 구현
  - 교과목 목록 조회 및 표시 (테이블 형식)
  - 교과목 추가 기능 (모달 또는 폼)
  - 교과목 수정 기능 (인라인 편집 또는 모달)
  - 교과목 삭제 기능 (확인 다이얼로그)
  - 검색 및 필터링 기능 (구분, 선배정 값 등)
  - 백엔드 API 엔드포인트 추가 (PUT /api/courses/:id, DELETE /api/courses/:id)
  - _Requirements: 1.2, 1.4_

- [x] 20. 시간표 생성 알고리즘 개선





  - [x] 20.1 연강 제한 기능 구현


    - 동일 교관의 동일 과목 3시간 이상 연강 방지 로직 추가
    - getConsecutiveHoursForInstructorCourse 함수 구현
    - findNextAvailableSlot에 연강 체크 로직 통합
    - _Requirements: 3.1_
  
  - [x] 20.2 평가 자동 배정 기능 구현


    - 평가=1인 교과목 완료 후 다음날 2시간 시험 자동 배정
    - 시험 일정 생성 로직 추가 (isExam 플래그)
    - 시험 시간 확보를 위한 슬롯 검색 로직
    - _Requirements: 3.2_
  
  - [x] 20.3 ScheduleGenerator 서비스 업데이트


    - 새로운 제약조건을 반영한 알고리즘 수정
    - 연강 체크 및 평가 배정 통합
    - 에러 처리 및 로깅 개선

- [ ]* 21. 테스트 코드 작성
  - [ ]* 21.1 백엔드 유닛 테스트
    - ExcelParser 테스트
    - ScheduleGenerator 테스트
    - ValidationService 테스트
    - Repository 메서드 테스트
  
  - [ ]* 21.2 백엔드 통합 테스트
    - API 엔드포인트 테스트
    - 데이터베이스 연동 테스트
  
  - [ ]* 21.3 프론트엔드 테스트
    - 컴포넌트 렌더링 테스트
    - 사용자 인터랙션 테스트
    - API 호출 모킹 테스트

- [ ] 22. 시간표 출력 페이지 개선
  - [ ] 22.1 주간 단위 테이블 구조 수정
    - 날짜 범위를 주 단위로 그룹화하는 로직 구현
    - 각 행이 한 주를 나타내도록 테이블 구조 변경
    - 첫 번째 열에 주의 시작 날짜 표시
    - _Requirements: 7.2, 7.3_
  
  - [ ] 22.2 스케줄 표시 개선
    - 각 셀에 해당 날짜의 모든 스케줄 표시
    - 과목명, 교관명, 교시 정보를 명확하게 표시
    - 평가 스케줄에 [평가] 접두사 추가
    - 빈 날짜는 "-"로 표시
    - _Requirements: 7.4, 7.7_
  
  - [ ] 22.3 인쇄 스타일 최적화
    - @media print CSS 규칙 추가
    - 인쇄 시 UI 컨트롤 숨김 처리
    - 테이블 페이지 나누기 최적화
    - 인쇄물 헤더에 날짜 범위 표시
    - _Requirements: 7.5, 7.6_

- [x] 23. 평가 필드 사용자 친화적 표시 기능 구현




  - [x] 23.1 백엔드 평가 필드 변환 서비스 구현


    - EvaluationDisplayService 클래스 작성
    - formatCourseForDisplay, formatCoursesForDisplay 메서드 구현
    - formatScheduleForDisplay 메서드 구현 (Schedule의 연관된 Course 정보 변환)
    - _Requirements: 8.1, 8.5_
  
  - [x] 23.2 백엔드 API에 평가 필드 변환 기능 추가


    - GET /api/courses에 displayFormat 쿼리 파라미터 추가
    - GET /api/schedules에 displayFormat 쿼리 파라미터 추가
    - displayFormat=true 시 평가 필드를 "평가"/"무시험"으로 변환하여 응답
    - 기존 API 호환성 유지 (displayFormat 미지정 시 기존 동작)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 23.3 프론트엔드 평가 필드 변환 유틸리티 구현


    - EvaluationDisplayUtils 클래스 작성
    - formatEvaluationForDisplay, convertCourseForDisplay 메서드 구현
    - getEvaluationStyleClass 메서드 구현 (CSS 클래스 반환)
    - CourseDisplay 타입 정의 추가
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 23.4 CourseTable 컴포넌트 구현


    - 재사용 가능한 교과목 테이블 컴포넌트 작성
    - 평가 필드를 "평가"/"무시험" 형태로 표시
    - 평가 유형에 따른 시각적 구분 (CSS 클래스 적용)
    - 정렬 및 필터링 기능 추가
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 23.5 기존 컴포넌트에 평가 필드 표시 개선 적용


    - UploadPage: 업로드 미리보기에서 평가 필드 변환 표시
    - PreAssignmentCalendar: 교과목 선택 시 평가 정보 표시
    - ScheduleView: 시간표 조회 시 평가 정보 표시
    - 모든 교과목 목록 표시 부분에 CourseTable 컴포넌트 적용
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 24. 시간대 선택 및 다중 날짜 배정 모달 컴포넌트 구현




  - [x] 24.1 TimeSlotModal 컴포넌트 구현


    - 요일별 최대 교시 수 및 시간 정보 표시
    - 시작/종료 교시 선택 UI
    - 전투체력 과목 감지 및 하루 최대 2시간 제한
    - 남은 시수 초과 시 다중 날짜 배정 제안
    - 부분 배정 지원 (선택한 시간만 배정 또는 다음 날로 이어서 배정)
    - 실시간 검증 및 오류 메시지 표시
    - _Requirements: 9.1, 9.2, 9.4, 9.6, 9.8, 9.9_
  
  - [x] 24.2 MultiDayAssignmentModal 컴포넌트 구현


    - 자동 다중 날짜 계산 (주말 제외, 기존 스케줄 고려)
    - 전투체력 과목 하루 최대 2시간 제한 적용
    - 각 날짜별 배정 계획 시각화
    - 연속된 빈 교시 자동 탐색
    - 배정 후 남은 시수 계산 및 표시
    - _Requirements: 9.1, 9.3, 9.4, 9.5, 9.7, 9.9, 9.10_
  
  - [x] 24.3 모달 컴포넌트 스타일링


    - TimeSlotModal CSS 스타일 작성
    - MultiDayAssignmentModal CSS 스타일 작성
    - 반응형 디자인 적용
    - 접근성 개선 (ARIA 레이블, 키보드 네비게이션)

- [x] 25. 교관 휴무일 엑셀 업로드 기능 구현




  - [x] 25.1 백엔드 UploadService 확장


    - uploadOffDaysExcelFile 메서드 구현
    - 엑셀 파일 파싱 (이름, 시작날짜, 종료날짜, 비고 컬럼)
    - 날짜 범위를 개별 날짜로 확장
    - 교관 자동 생성 또는 조회
    - 중복 방지하여 휴무일 저장
    - _Requirements: 4.6, 4.7, 4.8, 4.10_
  
  - [x] 25.2 엑셀 템플릿 생성 기능 구현


    - generateOffDaysTemplate 메서드 구현
    - 양식 데이터 생성 (헤더 + 예시 데이터)
    - 사용법 설명 시트 추가
    - 스타일 및 형식 적용
    - _Requirements: 4.9_
  
  - [x] 25.3 교관 휴무일 업로드 API 엔드포인트 추가


    - POST /api/upload-off-days 엔드포인트 구현
    - GET /api/off-days-template 엔드포인트 구현
    - 파일 업로드 처리 및 결과 반환
    - 에러 처리 및 검증
    - _Requirements: 4.6, 4.7, 4.8, 4.9_
  
  - [x] 25.4 데이터베이스 스키마 업데이트


    - off_days 테이블에 reason 컬럼 추가
    - 기존 데이터 마이그레이션 처리
    - OffDayRepository 업데이트
    - _Requirements: 4.8_

- [x] 26. 배포 준비 및 문서화

  - README.md 작성 (설치 방법, 실행 방법)
  - 환경변수 설정 가이드
  - 프론트엔드 빌드 스크립트 작성
  - 프로덕션 환경 설정 (PM2, Nginx 등)
  - 데이터베이스 백업 전략 문서화
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 27. 교관 휴무일 업로드 페이지 UI 개선




  - [x] 27.1 InstructorOffDayPage 엑셀 업로드 기능 활성화


    - 주석 처리된 엑셀 업로드 관련 코드 활성화
    - UploadResult 및 InstructorOffDaysSummary 인터페이스 활성화
    - 파일 선택, 업로드, 템플릿 다운로드 함수 활성화
    - _Requirements: 4.6, 4.7_
  
  - [x] 27.2 업로드 결과 표시 UI 구현


    - 엑셀 업로드 섹션 UI 추가 (파일 선택, 업로드 버튼, 양식 다운로드)
    - 업로드 결과 섹션 구현 (교관 수, 총 휴무일 표시)
    - 교관별 휴무일 카드 형식으로 표시
    - 날짜 포맷 함수 추가 (YYYY-MM-DD (요일) 형식)
    - _Requirements: 4.8, 4.10_
  
  - [x] 27.3 스타일링 및 반응형 디자인


    - 업로드 섹션 CSS 스타일 추가
    - 업로드 결과 카드 스타일 추가
    - 교관 이름 배지 및 휴무일 수 배지 스타일
    - 휴무일 그리드 레이아웃 구현
    - 호버 효과 및 인터랙티브 요소 추가
    - 모바일 반응형 디자인 적용
    - _Requirements: 7.1_

- [x] 28. 엑셀 업로드 페이지 교관 휴무일 표시 기능 추가




  - [x] 28.1 UploadPage 인터페이스 확장


    - InstructorOffDaysSummary 인터페이스 추가
    - UploadResult에 instructorOffDays 필드 추가
    - 날짜 포맷 함수 구현
    - _Requirements: 4.8, 4.10_
  
  - [x] 28.2 교관 휴무일 업로드 결과 표시 UI 구현


    - 업로드 성공 시 교관별 휴무일 정보 표시
    - 교관 수 및 총 휴무일 요약 정보 표시
    - 교관별 카드 형식으로 휴무일 목록 표시
    - 날짜와 사유를 포함한 휴무일 정보 표시
    - _Requirements: 4.8, 4.10_
  
  - [x] 28.3 스타일링 및 UI/UX 개선


    - 교관 휴무일 컨테이너 CSS 추가
    - 교관 카드 및 헤더 스타일링
    - 교관 이름 배지 (보라색 그라데이션)
    - 휴무일 수 배지 (녹색)
    - 휴무일 그리드 레이아웃
    - 호버 효과 및 애니메이션
    - 반응형 디자인 적용
    - _Requirements: 7.1_
