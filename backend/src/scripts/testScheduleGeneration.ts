/**
 * 시간표 생성 알고리즘 테스트 스크립트
 */
import { CourseRepository } from '../repositories/CourseRepository';
import { InstructorRepository } from '../repositories/InstructorRepository';
import { ScheduleRepository } from '../repositories/ScheduleRepository';
import { OffDayRepository } from '../repositories/OffDayRepository';
import { ScheduleGenerator } from '../services/ScheduleGenerator';
import { initializeDatabase } from '../database/init';

async function testScheduleGeneration() {
  try {
    console.log('데이터베이스 초기화 중...');
    await initializeDatabase();

    console.log('테스트 데이터 생성 중...');
    
    // 교관 생성
    const instructorRepo = new InstructorRepository();
    const instructor1 = await instructorRepo.create('김교관');
    const instructor2 = await instructorRepo.create('이교관');
    console.log(`교관 생성 완료: ${instructor1.name}, ${instructor2.name}`);

    // 교과목 생성
    const courseRepo = new CourseRepository();
    const course1 = await courseRepo.create({
      구분: '전공',
      과목: '네트워크 기초',
      시수: 6,
      담당교관: '김교관',
      선배정: 2,
      평가: '시험',
      excel_order: 1
    });

    const course2 = await courseRepo.create({
      구분: '전공',
      과목: '보안 개론',
      시수: 9,
      담당교관: '이교관',
      선배정: 2,
      평가: '시험',
      excel_order: 2
    });

    const course3 = await courseRepo.create({
      구분: '전공',
      과목: '시스템 관리',
      시수: 12,
      담당교관: '김교관,이교관',
      선배정: 2,
      평가: '실습',
      excel_order: 3
    });

    console.log(`교과목 생성 완료: ${course1.과목}, ${course2.과목}, ${course3.과목}`);

    // 시간표 생성
    console.log('\n시간표 자동 생성 시작...');
    const scheduleRepo = new ScheduleRepository();
    const offDayRepo = new OffDayRepository();
    
    const generator = new ScheduleGenerator(
      courseRepo,
      instructorRepo,
      scheduleRepo,
      offDayRepo
    );

    const startDate = '2025-01-06'; // 월요일
    const result = await generator.generateSchedule(startDate);

    console.log('\n=== 생성 결과 ===');
    console.log(`성공 여부: ${result.success}`);
    console.log(`메시지: ${result.message}`);
    console.log(`생성된 일정 수: ${result.scheduleCount}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n에러 목록:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // 생성된 일정 조회
    console.log('\n=== 생성된 일정 ===');
    const schedules = await scheduleRepo.findByDateRangeWithDetails(startDate, '2025-01-31');
    
    schedules.forEach(schedule => {
      const courseName = schedule.course?.과목 || 'Unknown';
      const instructorName = schedule.instructor?.name || 'Unknown';
      const hours = schedule.end_period - schedule.start_period + 1;
      
      console.log(
        `${schedule.date} | ${schedule.start_period}-${schedule.end_period}교시 (${hours}시간) | ` +
        `${courseName} | ${instructorName}`
      );
    });

    console.log('\n테스트 완료!');
  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
    process.exit(1);
  }
}

testScheduleGeneration();
