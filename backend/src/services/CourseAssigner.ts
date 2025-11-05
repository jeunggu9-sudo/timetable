import { Course, Instructor } from '../types/models';
import { CourseRepository } from '../repositories/CourseRepository';
import { InstructorRepository } from '../repositories/InstructorRepository';
import { ConstraintValidator } from './ConstraintValidator';
import { addDays } from '../utils/scheduleUtils';

/**
 * 교과목을 시간표에 배정하는 로직을 담당하는 서비스
 */
export class CourseAssigner {
  private courseRepo: CourseRepository;
  private instructorRepo: InstructorRepository;
  private validator: ConstraintValidator;

  constructor(
    courseRepo: CourseRepository,
    instructorRepo: InstructorRepository,
    validator: ConstraintValidator
  ) {
    this.courseRepo = courseRepo;
    this.instructorRepo = instructorRepo;
    this.validator = validator;
  }

  /**
   * 다음 사용 가능한 시간대를 찾는 함수
   * @param startDate 검색 시작 날짜
   * @param instructorId 교관 ID
   * @param courseId 과목 ID
   * @param requiredHours 필요한 시수
   * @param maxHoursPerDay 하루 최대 배정 시수 (기본값: 3)
   * @returns 찾으면 { date, startPeriod, endPeriod }, 못 찾으면 null
   */
  async findNextAvailableSlot(
    startDate: string,
    instructorId: number,
    courseId: number,
    requiredHours: number,
    maxHoursPerDay: number = 3
  ): Promise<{ date: string; startPeriod: number; endPeriod: number } | null> {
    let currentDate = startDate;
    const maxSearchDays = 365; // 최대 1년까지 검색
    let searchedDays = 0;

    while (searchedDays < maxSearchDays) {
      // 교관 휴무일 체크
      const isOffDay = await this.validator.isInstructorOffDay(instructorId, currentDate);
      if (isOffDay) {
        currentDate = addDays(currentDate, 1);
        searchedDays++;
        continue;
      }

      // 휴관일 체크
      const isHoliday = await this.validator.isSchoolHoliday(currentDate);
      if (isHoliday) {
        currentDate = addDays(currentDate, 1);
        searchedDays++;
        continue;
      }

      // 해당 날짜에 이미 배정된 해당 과목의 시수 확인
      const assignedHoursToday = await this.validator.getAssignedHoursForCourseOnDate(
        courseId,
        currentDate
      );

      if (assignedHoursToday >= maxHoursPerDay) {
        currentDate = addDays(currentDate, 1);
        searchedDays++;
        continue;
      }

      // 오늘 배정 가능한 최대 시수 계산
      const availableHoursToday = Math.min(
        maxHoursPerDay - assignedHoursToday,
        requiredHours
      );

      // 연속된 빈 교시 찾기
      const availableSlot = this.validator.findConsecutiveEmptyPeriods(
        currentDate,
        availableHoursToday
      );

      if (availableSlot) {
        // 동일 교관의 동일 과목 연강 제한 체크 (최대 3시간)
        const consecutiveHours = this.validator.getConsecutiveHoursFromSlots(
          instructorId,
          courseId,
          availableSlot.date,
          availableSlot.startPeriod
        );

        // 이미 연속 3시간 이상이면 다음 날로
        if (consecutiveHours >= 3) {
          currentDate = addDays(currentDate, 1);
          searchedDays++;
          continue;
        }

        // 새로 배정할 시수와 기존 연속 시수를 합쳐서 3시간을 초과하지 않도록 조정
        const maxAllowedHours = 3 - consecutiveHours;
        if (availableSlot.endPeriod - availableSlot.startPeriod + 1 > maxAllowedHours) {
          // 배정 가능한 시수를 줄여서 다시 찾기
          const adjustedSlot = this.validator.findConsecutiveEmptyPeriods(
            currentDate,
            maxAllowedHours
          );
          
          if (adjustedSlot) {
            return adjustedSlot;
          }
          // 조정된 슬롯을 찾을 수 없으면 다음 날로
          currentDate = addDays(currentDate, 1);
          searchedDays++;
          continue;
        } else {
          return availableSlot;
        }
      }

      currentDate = addDays(currentDate, 1);
      searchedDays++;
    }

    return null;
  }

  /**
   * 여러 교관이 있는 경우 시수 분배 계산 함수
   * @param course 교과목
   * @returns 교관별 배정 시수 맵 { instructorId: hours }
   */
  async calculateAllocatedHours(course: Course): Promise<Map<number, number>> {
    // 담당교관 문자열을 파싱하여 교관 목록 추출
    const instructorNames = course.담당교관
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    // 교관 ID 조회
    const instructors: Instructor[] = [];
    for (const name of instructorNames) {
      const instructor = await this.instructorRepo.findByName(name);
      if (instructor) {
        instructors.push(instructor);
      }
    }

    const allocationMap = new Map<number, number>();

    if (instructors.length === 0) {
      return allocationMap;
    }

    if (instructors.length === 1) {
      // 교관이 1명이면 전체 시수 배정
      allocationMap.set(instructors[0].id, course.시수);
      return allocationMap;
    }

    // 여러 교관이 있는 경우 시수를 균등 분배
    const hoursPerInstructor = Math.floor(course.시수 / instructors.length);
    const remainder = course.시수 % instructors.length;

    for (let i = 0; i < instructors.length; i++) {
      const instructor = instructors[i];
      // 첫 번째 교관에게 나머지 시수 할당
      const allocatedHours = hoursPerInstructor + (i === 0 ? remainder : 0);
      allocationMap.set(instructor.id, allocatedHours);
    }

    return allocationMap;
  }

  /**
   * 교과목을 시간표에 배정하는 메인 함수
   * @param course 배정할 교과목
   * @param startDate 배정 시작 날짜
   * @returns 배정된 일정 정보 배열
   */
  async assignCourse(
    course: Course,
    startDate: string
  ): Promise<Array<{
    courseId: number;
    instructorId: number;
    date: string;
    startPeriod: number;
    endPeriod: number;
    isExam?: boolean;
  }>> {
    const assignments: Array<{
      courseId: number;
      instructorId: number;
      date: string;
      startPeriod: number;
      endPeriod: number;
      isExam?: boolean;
    }> = [];

    // 교관별 배정 시수 계산
    const allocationMap = await this.calculateAllocatedHours(course);

    if (allocationMap.size === 0) {
      throw new Error(`교과목 "${course.과목}"에 대한 교관을 찾을 수 없습니다.`);
    }

    let currentSearchDate = startDate;
    let lastAssignedDate: string | null = null;
    let lastInstructorId: number | null = null;

    // 각 교관별로 배정
    for (const [instructorId, allocatedHours] of allocationMap.entries()) {
      let remainingHours = allocatedHours;

      while (remainingHours > 0) {
        // 다음 사용 가능한 시간대 찾기
        const slot = await this.findNextAvailableSlot(
          currentSearchDate,
          instructorId,
          course.id,
          remainingHours,
          3 // 하루 최대 3시간
        );

        if (!slot) {
          throw new Error(
            `교과목 "${course.과목}"을 배정할 수 없습니다. ` +
            `교관 ID ${instructorId}, 남은 시수: ${remainingHours}`
          );
        }

        // 배정할 시수 계산
        const hoursToAssign = slot.endPeriod - slot.startPeriod + 1;

        // 배정 정보 저장
        assignments.push({
          courseId: course.id,
          instructorId,
          date: slot.date,
          startPeriod: slot.startPeriod,
          endPeriod: slot.endPeriod
        });

        // TimeSlot을 occupied로 표시 (교관과 과목 정보 포함)
        this.validator.markSlotsAsOccupied(
          slot.date,
          slot.startPeriod,
          slot.endPeriod,
          instructorId,
          course.id
        );

        remainingHours -= hoursToAssign;
        lastAssignedDate = slot.date;
        lastInstructorId = instructorId;
        
        // 다음 검색은 배정된 날짜부터 시작
        currentSearchDate = slot.date;
      }
    }

    // 평가=1인 경우 다음날 2시간 시험 자동 배정
    if (course.평가 === '1' && lastAssignedDate && lastInstructorId) {
      const examAssignment = await this.scheduleExam(
        course.id,
        lastInstructorId,
        lastAssignedDate
      );
      
      if (examAssignment) {
        assignments.push(examAssignment);
      }
    }

    return assignments;
  }

  /**
   * 시험 일정을 배정하는 함수
   * @param courseId 과목 ID
   * @param instructorId 교관 ID
   * @param lastCourseDate 마지막 수업 날짜
   * @returns 시험 배정 정보 또는 null
   */
  private async scheduleExam(
    courseId: number,
    instructorId: number,
    lastCourseDate: string
  ): Promise<{
    courseId: number;
    instructorId: number;
    date: string;
    startPeriod: number;
    endPeriod: number;
    isExam: boolean;
  } | null> {
    // 다음날부터 시험 시간 찾기
    const examStartDate = addDays(lastCourseDate, 1);
    
    // 시험은 2시간 필요
    const examSlot = await this.findNextAvailableSlot(
      examStartDate,
      instructorId,
      courseId,
      2, // 2시간
      2  // 시험은 하루에 2시간만
    );

    if (!examSlot) {
      // 시험 시간을 찾을 수 없으면 경고 로그만 남기고 계속 진행
      console.warn(`과목 ID ${courseId}의 시험 시간을 배정할 수 없습니다.`);
      return null;
    }

    // TimeSlot을 occupied로 표시 (교관과 과목 정보 포함)
    this.validator.markSlotsAsOccupied(
      examSlot.date,
      examSlot.startPeriod,
      examSlot.endPeriod,
      instructorId,
      courseId
    );

    return {
      courseId,
      instructorId,
      date: examSlot.date,
      startPeriod: examSlot.startPeriod,
      endPeriod: examSlot.endPeriod,
      isExam: true
    };
  }
}
