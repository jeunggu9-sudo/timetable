/**
 * 시간표 생성 알고리즘 개선 테스트
 * - 연강 제한 기능 (동일 교관의 동일 과목 3시간 이상 연강 방지)
 * - 평가 자동 배정 기능 (평가=1인 교과목 완료 후 다음날 2시간 시험 자동 배정)
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAlgorithmImprovements() {
  console.log('=== 시간표 생성 알고리즘 개선 테스트 시작 ===\n');

  try {
    // 1. 기존 데이터 정리
    console.log('1. 기존 데이터 정리 중...');
    await axios.delete(`${API_BASE_URL}/courses/all`).catch(() => {});
    console.log('   ✓ 데이터 정리 완료\n');

    // 2. 테스트용 교과목 생성
    console.log('2. 테스트용 교과목 생성 중...');
    
    // 2-1. 연강 제한 테스트용 과목 (9시간 - 3일에 걸쳐 배정되어야 함)
    const course1 = await axios.post(`${API_BASE_URL}/courses`, {
      구분: '전공',
      과목: '연강제한테스트과목',
      시수: 9,
      담당교관: '김교관',
      선배정: 2,
      평가: '0',
      excel_order: 1
    });
    console.log(`   ✓ 과목 생성: ${course1.data.course.과목} (9시간, 평가 없음)`);

    // 2-2. 평가 자동 배정 테스트용 과목 (6시간 + 2시간 시험)
    const course2 = await axios.post(`${API_BASE_URL}/courses`, {
      구분: '전공',
      과목: '평가자동배정테스트과목',
      시수: 6,
      담당교관: '이교관',
      선배정: 2,
      평가: '1',
      excel_order: 2
    });
    console.log(`   ✓ 과목 생성: ${course2.data.course.과목} (6시간, 평가=1)`);

    // 2-3. 일반 과목 (연강 제한 없이 배정 가능)
    const course3 = await axios.post(`${API_BASE_URL}/courses`, {
      구분: '교양',
      과목: '일반과목',
      시수: 3,
      담당교관: '박교관',
      선배정: 2,
      평가: '0',
      excel_order: 3
    });
    console.log(`   ✓ 과목 생성: ${course3.data.course.과목} (3시간, 평가 없음)\n`);

    // 3. 시간표 자동 생성
    console.log('3. 시간표 자동 생성 중...');
    const startDate = '2025-01-06'; // 월요일
    const generateResult = await axios.post(`${API_BASE_URL}/generate-schedule`, {
      startDate
    });

    console.log(`   ✓ 생성 결과: ${generateResult.data.message}`);
    console.log(`   ✓ 생성된 일정 수: ${generateResult.data.scheduleCount}개\n`);

    // 4. 생성된 일정 조회 및 검증
    console.log('4. 생성된 일정 검증 중...');
    const endDate = '2025-01-31';
    const schedulesResult = await axios.get(`${API_BASE_URL}/schedules`, {
      params: { startDate, endDate }
    });

    const schedules = schedulesResult.data.schedules;
    console.log(`   ✓ 조회된 일정 수: ${schedules.length}개\n`);

    // 4-1. 연강 제한 검증
    console.log('5. 연강 제한 검증:');
    const course1Schedules = schedules.filter(s => s.course_id === course1.data.course.id && !s.is_exam);
    
    // 날짜별로 그룹화
    const schedulesByDate = {};
    course1Schedules.forEach(schedule => {
      if (!schedulesByDate[schedule.date]) {
        schedulesByDate[schedule.date] = [];
      }
      schedulesByDate[schedule.date].push(schedule);
    });

    let consecutiveViolation = false;
    for (const [date, daySchedules] of Object.entries(schedulesByDate)) {
      const totalHours = daySchedules.reduce((sum, s) => sum + (s.end_period - s.start_period + 1), 0);
      console.log(`   - ${date}: ${totalHours}시간 배정`);
      
      if (totalHours > 3) {
        console.log(`     ✗ 연강 제한 위반! (하루 최대 3시간 초과)`);
        consecutiveViolation = true;
      }
    }

    if (!consecutiveViolation) {
      console.log('   ✓ 연강 제한 준수: 모든 날짜에서 3시간 이하로 배정됨\n');
    } else {
      console.log('   ✗ 연강 제한 위반 발견\n');
    }

    // 4-2. 평가 자동 배정 검증
    console.log('6. 평가 자동 배정 검증:');
    const course2Schedules = schedules.filter(s => s.course_id === course2.data.course.id);
    const regularSchedules = course2Schedules.filter(s => !s.is_exam);
    const examSchedules = course2Schedules.filter(s => s.is_exam);

    console.log(`   - 일반 일정: ${regularSchedules.length}개`);
    console.log(`   - 시험 일정: ${examSchedules.length}개`);

    if (examSchedules.length > 0) {
      const lastRegularDate = regularSchedules.reduce((latest, s) => {
        return s.date > latest ? s.date : latest;
      }, regularSchedules[0].date);

      const examDate = examSchedules[0].date;
      const examHours = examSchedules[0].end_period - examSchedules[0].start_period + 1;

      console.log(`   - 마지막 수업 날짜: ${lastRegularDate}`);
      console.log(`   - 시험 날짜: ${examDate}`);
      console.log(`   - 시험 시수: ${examHours}시간`);

      // 날짜 차이 계산
      const lastDate = new Date(lastRegularDate);
      const examDateObj = new Date(examDate);
      const daysDiff = Math.floor((examDateObj - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff >= 1 && examHours === 2) {
        console.log('   ✓ 평가 자동 배정 성공: 마지막 수업 후 2시간 시험 배정됨\n');
      } else {
        console.log(`   ✗ 평가 자동 배정 실패: 날짜 차이 ${daysDiff}일, 시험 시수 ${examHours}시간\n`);
      }
    } else {
      console.log('   ✗ 평가 자동 배정 실패: 시험 일정이 생성되지 않음\n');
    }

    // 5. 상세 일정 출력
    console.log('7. 생성된 일정 상세:');
    console.log('─'.repeat(80));
    
    const sortedSchedules = schedules.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.start_period - b.start_period;
    });

    sortedSchedules.forEach(schedule => {
      const courseName = schedule.course?.과목 || 'Unknown';
      const instructorName = schedule.instructor?.name || 'Unknown';
      const examLabel = schedule.is_exam ? ' [시험]' : '';
      const preAssignLabel = schedule.is_pre_assigned ? ' [선배정]' : '';
      
      console.log(
        `${schedule.date} | ` +
        `${schedule.start_period}~${schedule.end_period}교시 | ` +
        `${courseName} | ` +
        `${instructorName}${examLabel}${preAssignLabel}`
      );
    });
    console.log('─'.repeat(80));

    console.log('\n=== 테스트 완료 ===');

  } catch (error) {
    console.error('\n테스트 실패:', error.response?.data || error.message);
    process.exit(1);
  }
}

// 테스트 실행
testAlgorithmImprovements();
