import { ScheduleRepository } from '../repositories/ScheduleRepository';
import { OffDayRepository } from '../repositories/OffDayRepository';
import { SchoolHolidayRepository } from '../repositories/SchoolHolidayRepository';
import { DAILY_SCHEDULES, getDayOfWeek, isWeekend } from '../utils/scheduleUtils';

/**
 * 시간표 수정 검증 결과
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * 시간표 수동 수정 검증 로직을 처리하는 서비스
 */
export class ScheduleModificationValidator {
  private scheduleRepo: ScheduleRepository;
  private offDayRepo: OffDayRepository;
  private holidayRepo: SchoolHolidayRepository;

  constructor(scheduleRepo: ScheduleRepository, offDayRepo: OffDayRepository, holidayRepo?: SchoolHolidayRepository) {
    this.scheduleRepo = scheduleRepo;
    this.offDayRepo = offDayRepo;
    this.holidayRepo = holidayRepo || new SchoolHolidayRepository();
  }

  /**
   * 시간표 수정 요청을 검증합니다
   * @param scheduleId 수정할 일정 ID
   * @param date 새로운 날짜 (YYYY-MM-DD)
   * @param startPeriod 새로운 시작 교시
   * @param endPeriod 새로운 종료 교시
   * @returns 검증 결과 { valid: boolean, message?: string }
   */
  async validateScheduleModification(
    scheduleId: number,
    date: string,
    startPeriod: number,
    endPeriod: number
  ): Promise<ValidationResult> {
    // 0. 기존 일정 정보 조회
    const existingSchedule = await this.scheduleRepo.findById(scheduleId);
    if (!existingSchedule) {
      return {
        valid: false,
        message: '수정할 일정을 찾을 수 없습니다.'
      };
    }

    // 1. 새로운 시간대가 일과시간 내인지 검증
    const withinWorkingHours = this.isWithinWorkingHours(date, startPeriod, endPeriod);
    if (!withinWorkingHours.valid) {
      return withinWorkingHours;
    }

    // 2. 교관 휴무일 체크
    const isOffDay = await this.offDayRepo.isInstructorOffDay(existingSchedule.instructor_id, date);
    if (isOffDay) {
      return {
        valid: false,
        message: '해당 날짜는 교관의 휴무일입니다.'
      };
    }

    // 2-1. 휴관일 체크
    const isHoliday = await this.holidayRepo.isHoliday(date, startPeriod);
    if (isHoliday) {
      return {
        valid: false,
        message: '해당 날짜/시간은 휴관일입니다.'
      };
    }

    // 3. 교관 시간 충돌 체크 (같은 시간에 다른 과목을 가르치는지)
    const instructorConflict = await this.checkInstructorConflict(
      existingSchedule.instructor_id,
      date,
      startPeriod,
      endPeriod,
      scheduleId
    );
    if (!instructorConflict.valid) {
      return instructorConflict;
    }

    // 4. 강의실 충돌 체크 (같은 시간에 다른 과목이 배정되어 있는지)
    const roomConflict = await this.scheduleRepo.checkConflict(
      date,
      startPeriod,
      endPeriod,
      scheduleId
    );
    
    if (roomConflict) {
      return {
        valid: false,
        message: '해당 시간대에 이미 다른 과목이 배정되어 있습니다.'
      };
    }

    return { valid: true };
  }

  /**
   * 교관의 시간 충돌을 체크합니다
   * @param instructorId 교관 ID
   * @param date 날짜 (YYYY-MM-DD)
   * @param startPeriod 시작 교시
   * @param endPeriod 종료 교시
   * @param excludeScheduleId 제외할 일정 ID (자기 자신)
   * @returns 검증 결과
   */
  private async checkInstructorConflict(
    instructorId: number,
    date: string,
    startPeriod: number,
    endPeriod: number,
    excludeScheduleId: number
  ): Promise<ValidationResult> {
    const schedules = await this.scheduleRepo.findByDateRange(date, date);
    
    // 같은 교관의 다른 일정들 중에서 시간이 겹치는지 확인
    const conflicts = schedules.filter(schedule => {
      // 자기 자신은 제외
      if (schedule.id === excludeScheduleId) {
        return false;
      }
      
      // 같은 교관인지 확인
      if (schedule.instructor_id !== instructorId) {
        return false;
      }
      
      // 시간이 겹치는지 확인
      return (
        (startPeriod <= schedule.start_period && endPeriod >= schedule.start_period) ||
        (startPeriod <= schedule.end_period && endPeriod >= schedule.end_period) ||
        (startPeriod >= schedule.start_period && endPeriod <= schedule.end_period)
      );
    });

    if (conflicts.length > 0) {
      return {
        valid: false,
        message: '해당 시간대에 교관이 다른 과목을 가르치고 있습니다.'
      };
    }

    return { valid: true };
  }

  /**
   * 새로운 시간대가 일과시간 내인지 검증합니다
   * @param date 날짜 (YYYY-MM-DD)
   * @param startPeriod 시작 교시
   * @param endPeriod 종료 교시
   * @returns 검증 결과 { valid: boolean, message?: string }
   */
  private isWithinWorkingHours(
    date: string,
    startPeriod: number,
    endPeriod: number
  ): ValidationResult {
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
