import { CourseRepository } from '../repositories/CourseRepository';
import { ScheduleRepository } from '../repositories/ScheduleRepository';
import { OffDayRepository } from '../repositories/OffDayRepository';
import { SchoolHolidayRepository } from '../repositories/SchoolHolidayRepository';
import { DAILY_SCHEDULES, getDayOfWeek, isWeekend } from '../utils/scheduleUtils';

/**
 * 선배정 검증 로직을 처리하는 서비스
 */
export class PreAssignmentValidator {
  private courseRepo: CourseRepository;
  private scheduleRepo: ScheduleRepository;
  private offDayRepo: OffDayRepository;
  private holidayRepo: SchoolHolidayRepository;

  constructor(
    courseRepo: CourseRepository,
    scheduleRepo: ScheduleRepository,
    offDayRepo: OffDayRepository,
    holidayRepo?: SchoolHolidayRepository
  ) {
    this.courseRepo = courseRepo;
    this.scheduleRepo = scheduleRepo;
    this.offDayRepo = offDayRepo;
    this.holidayRepo = holidayRepo || new SchoolHolidayRepository();
  }

  /**
   * 선배정 요청을 검증합니다
   * @param courseId 교과목 ID
   * @param instructorId 교관 ID
   * @param date 날짜 (YYYY-MM-DD)
   * @param startPeriod 시작 교시
   * @param endPeriod 종료 교시
   * @returns 검증 결과 { valid: boolean, message?: string }
   */
  async validatePreAssignment(
    courseId: number,
    instructorId: number,
    date: string,
    startPeriod: number,
    endPeriod: number
  ): Promise<{ valid: boolean; message?: string }> {
    // 1. 교과목 존재 확인
    const course = await this.courseRepo.findById(courseId);
    if (!course) {
      return {
        valid: false,
        message: '교과목을 찾을 수 없습니다.'
      };
    }

    // 2. 선택된 시간이 유효한지 검증
    const selectedHours = endPeriod - startPeriod + 1;
    if (selectedHours <= 0) {
      return {
        valid: false,
        message: '선택한 시간이 유효하지 않습니다.'
      };
    }

    // 3. 이미 배정된 총 시수 확인 (모든 날짜 포함)
    const totalAssignedHours = await this.scheduleRepo.getTotalAssignedHoursForCourse(courseId);
    const newTotalHours = totalAssignedHours + selectedHours;

    // 4. 총 배정 시수가 교과목 시수를 초과하지 않는지 검증
    if (newTotalHours > course.시수) {
      return {
        valid: false,
        message: `선택한 시간이 교과목 시수를 초과합니다. (교과목 시수: ${course.시수}시간, 이미 배정된 시수: ${totalAssignedHours}시간, 선택한 시간: ${selectedHours}시간)`
      };
    }

    // 5. 선택된 시간이 일과시간 내인지 검증
    const withinWorkingHours = this.isWithinWorkingHours(date, startPeriod, endPeriod);
    if (!withinWorkingHours.valid) {
      return withinWorkingHours;
    }

    // 6. 교관 휴무일 체크
    const isOffDay = await this.offDayRepo.isInstructorOffDay(instructorId, date);
    if (isOffDay) {
      return {
        valid: false,
        message: '해당 날짜는 교관의 휴무일입니다.'
      };
    }

    // 6-1. 휴관일 체크
    const isHoliday = await this.holidayRepo.isHoliday(date, startPeriod);
    if (isHoliday) {
      return {
        valid: false,
        message: '해당 날짜/시간은 휴관일입니다.'
      };
    }

    // 7. 선택된 시간대에 중복이 없는지 검증
    const hasConflict = await this.scheduleRepo.checkConflict(date, startPeriod, endPeriod);
    if (hasConflict) {
      return {
        valid: false,
        message: '해당 시간대에 이미 다른 과목이 배정되어 있습니다.'
      };
    }

    return {
      valid: true,
      message: `선배정이 가능합니다. (남은 시수: ${course.시수 - newTotalHours}시간)`
    };
  }

  /**
   * 선택된 시간이 일과시간 내인지 검증합니다
   * @param date 날짜 (YYYY-MM-DD)
   * @param startPeriod 시작 교시
   * @param endPeriod 종료 교시
   * @returns 검증 결과 { valid: boolean, message?: string }
   */
  private isWithinWorkingHours(
    date: string,
    startPeriod: number,
    endPeriod: number
  ): { valid: boolean; message?: string } {
    // 주말 체크
    if (isWeekend(date)) {
      return {
        valid: false,
        message: '주말에는 일과시간이 없습니다.'
      };
    }

    // 요일별 최대 교시 확인
    const dayOfWeek = getDayOfWeek(date);
    const daySchedule = DAILY_SCHEDULES[dayOfWeek];

    if (!daySchedule) {
      return {
        valid: false,
        message: '해당 요일의 일과시간 정보를 찾을 수 없습니다.'
      };
    }

    // 시작 교시와 종료 교시가 유효한 범위인지 확인
    if (startPeriod < 1 || endPeriod > daySchedule.maxPeriods) {
      return {
        valid: false,
        message: `선택한 시간이 일과시간을 벗어났습니다. (해당 요일 최대 교시: ${daySchedule.maxPeriods})`
      };
    }

    // 시작 교시가 종료 교시보다 작거나 같은지 확인
    if (startPeriod > endPeriod) {
      return {
        valid: false,
        message: '시작 교시가 종료 교시보다 클 수 없습니다.'
      };
    }

    return { valid: true };
  }
}
