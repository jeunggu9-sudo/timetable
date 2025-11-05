import { ScheduleRepository } from '../repositories/ScheduleRepository';
import { OffDayRepository } from '../repositories/OffDayRepository';
import { SchoolHolidayRepository } from '../repositories/SchoolHolidayRepository';
import { TimeSlot } from '../types/models';
import { DAILY_SCHEDULES, getDayOfWeek, isWeekend } from '../utils/scheduleUtils';

/**
 * 시간표 생성 시 제약조건을 검증하는 서비스
 */
export class ConstraintValidator {
  private scheduleRepo: ScheduleRepository;
  private offDayRepo: OffDayRepository;
  private holidayRepo: SchoolHolidayRepository;
  private timeSlots: Map<string, boolean>; // key: "YYYY-MM-DD-period", value: isOccupied
  private slotAssignments: Map<string, { instructorId: number; courseId: number }>; // key: "YYYY-MM-DD-period", value: assignment info

  constructor(scheduleRepo: ScheduleRepository, offDayRepo: OffDayRepository, holidayRepo?: SchoolHolidayRepository) {
    this.scheduleRepo = scheduleRepo;
    this.offDayRepo = offDayRepo;
    this.holidayRepo = holidayRepo || new SchoolHolidayRepository();
    this.timeSlots = new Map();
    this.slotAssignments = new Map();
  }

  /**
   * TimeSlot 맵을 초기화합니다
   * @param startDate 시작 날짜
   * @param days 생성할 일수
   */
  initializeTimeSlots(startDate: string, days: number): void {
    this.timeSlots.clear();
    this.slotAssignments.clear();
    
    const start = new Date(startDate);
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateStr = this.formatDate(currentDate);
      
      // 주말은 스킵
      if (isWeekend(dateStr)) {
        continue;
      }
      
      const dayOfWeek = getDayOfWeek(dateStr);
      const daySchedule = DAILY_SCHEDULES[dayOfWeek];
      
      if (daySchedule) {
        for (let period = 1; period <= daySchedule.maxPeriods; period++) {
          const key = this.getTimeSlotKey(dateStr, period);
          this.timeSlots.set(key, false);
        }
      }
    }
  }

  /**
   * 선배정된 일정으로 TimeSlot을 occupied로 표시합니다
   * @param startDate 조회 시작 날짜
   * @param endDate 조회 종료 날짜
   */
  async markPreAssignedSlots(startDate: string, endDate: string): Promise<void> {
    const preAssignedSchedules = await this.scheduleRepo.findByDateRange(startDate, endDate);
    
    for (const schedule of preAssignedSchedules) {
      if (schedule.is_pre_assigned) {
        for (let period = schedule.start_period; period <= schedule.end_period; period++) {
          const key = this.getTimeSlotKey(schedule.date, period);
          this.timeSlots.set(key, true);
        }
      }
    }
  }

  /**
   * 특정 날짜/교시가 이미 배정되었는지 확인하는 함수
   * @param date YYYY-MM-DD 형식의 날짜
   * @param period 교시 번호
   * @returns 배정되었으면 true, 아니면 false
   */
  isTimeSlotOccupied(date: string, period: number): boolean {
    const key = this.getTimeSlotKey(date, period);
    return this.timeSlots.get(key) === true;
  }

  /**
   * 특정 날짜에 과목이 몇 시간 배정되었는지 확인하는 함수
   * @param courseId 과목 ID
   * @param date YYYY-MM-DD 형식의 날짜
   * @returns 배정된 시수
   */
  async getAssignedHoursForCourseOnDate(courseId: number, date: string): Promise<number> {
    return await this.scheduleRepo.getAssignedHoursForCourseOnDate(courseId, date);
  }

  /**
   * 특정 날짜에 동일 교관의 동일 과목이 연속으로 몇 시간 배정되어 있는지 확인하는 함수
   * @param instructorId 교관 ID
   * @param courseId 과목 ID
   * @param date YYYY-MM-DD 형식의 날짜
   * @param startPeriod 확인할 시작 교시
   * @returns 연속 배정된 시수
   */
  async getConsecutiveHoursForInstructorCourse(
    instructorId: number,
    courseId: number,
    date: string,
    startPeriod: number
  ): Promise<number> {
    return await this.scheduleRepo.getConsecutiveHoursForInstructorCourse(
      instructorId,
      courseId,
      date,
      startPeriod
    );
  }

  /**
   * 교관이 특정 날짜에 휴무인지 확인하는 함수
   * @param instructorId 교관 ID
   * @param date YYYY-MM-DD 형식의 날짜
   * @returns 휴무이면 true, 아니면 false
   */
  async isInstructorOffDay(instructorId: number, date: string): Promise<boolean> {
    return await this.offDayRepo.isInstructorOffDay(instructorId, date);
  }

  /**
   * 특정 날짜/교시가 휴관일인지 확인하는 함수
   * @param date YYYY-MM-DD 형식의 날짜
   * @param period 교시 (선택사항)
   * @returns 휴관일이면 true, 아니면 false
   */
  async isSchoolHoliday(date: string, period?: number): Promise<boolean> {
    return await this.holidayRepo.isHoliday(date, period);
  }

  /**
   * 연속된 빈 교시를 찾는 함수
   * @param date YYYY-MM-DD 형식의 날짜
   * @param requiredHours 필요한 연속 시수
   * @returns 찾으면 { date, startPeriod, endPeriod }, 못 찾으면 null
   */
  findConsecutiveEmptyPeriods(
    date: string,
    requiredHours: number
  ): { date: string; startPeriod: number; endPeriod: number } | null {
    // 주말은 스킵
    if (isWeekend(date)) {
      return null;
    }
    
    const dayOfWeek = getDayOfWeek(date);
    const daySchedule = DAILY_SCHEDULES[dayOfWeek];
    
    if (!daySchedule) {
      return null;
    }
    
    const maxPeriods = daySchedule.maxPeriods;
    
    for (let startPeriod = 1; startPeriod <= maxPeriods; startPeriod++) {
      let consecutiveEmpty = 0;
      
      for (let period = startPeriod; period <= maxPeriods; period++) {
        if (this.isTimeSlotOccupied(date, period)) {
          break;
        }
        consecutiveEmpty++;
        
        if (consecutiveEmpty >= requiredHours) {
          return {
            date,
            startPeriod,
            endPeriod: startPeriod + requiredHours - 1
          };
        }
      }
    }
    
    return null;
  }

  /**
   * 시간대를 occupied로 표시합니다
   * @param date YYYY-MM-DD 형식의 날짜
   * @param startPeriod 시작 교시
   * @param endPeriod 종료 교시
   * @param instructorId 교관 ID (선택)
   * @param courseId 과목 ID (선택)
   */
  markSlotsAsOccupied(
    date: string,
    startPeriod: number,
    endPeriod: number,
    instructorId?: number,
    courseId?: number
  ): void {
    for (let period = startPeriod; period <= endPeriod; period++) {
      const key = this.getTimeSlotKey(date, period);
      this.timeSlots.set(key, true);
      
      // 교관과 과목 정보 저장
      if (instructorId !== undefined && courseId !== undefined) {
        this.slotAssignments.set(key, { instructorId, courseId });
      }
    }
  }

  /**
   * TimeSlot 맵을 사용하여 연속 시수를 확인합니다
   * @param instructorId 교관 ID
   * @param courseId 과목 ID
   * @param date 날짜
   * @param startPeriod 시작 교시
   * @returns 연속 배정된 시수
   */
  getConsecutiveHoursFromSlots(
    instructorId: number,
    courseId: number,
    date: string,
    startPeriod: number
  ): number {
    let consecutiveHours = 0;
    let checkPeriod = startPeriod - 1;

    // 시작 교시 이전부터 역순으로 확인
    while (checkPeriod >= 1) {
      const key = this.getTimeSlotKey(date, checkPeriod);
      const assignment = this.slotAssignments.get(key);

      // 동일 교관, 동일 과목인지 확인
      if (
        assignment &&
        assignment.instructorId === instructorId &&
        assignment.courseId === courseId
      ) {
        consecutiveHours++;
        checkPeriod--;
      } else {
        break;
      }
    }

    return consecutiveHours;
  }

  /**
   * TimeSlot 키를 생성합니다
   */
  private getTimeSlotKey(date: string, period: number): string {
    return `${date}-${period}`;
  }

  /**
   * Date 객체를 YYYY-MM-DD 형식으로 포맷합니다
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
