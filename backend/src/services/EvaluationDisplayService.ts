/**
 * EvaluationDisplayService
 * 
 * 평가 필드를 사용자 친화적인 형태로 변환하는 서비스
 * 데이터베이스에는 "0" 또는 "1"로 저장되지만, 사용자에게는 "무시험" 또는 "평가"로 표시
 */

interface Course {
  id: number;
  구분: string;
  과목: string;
  시수: number;
  담당교관: string;
  선배정: 1 | 2;
  평가: string;
  excel_order: number;
  created_at: string;
}

interface CourseDisplay extends Omit<Course, '평가'> {
  평가: '평가' | '무시험';
}

interface Schedule {
  id: number;
  course_id: number;
  instructor_id: number;
  date: string;
  start_period: number;
  end_period: number;
  is_pre_assigned: boolean;
  is_exam?: boolean;
  created_at: string;
  course?: Course;
  instructor?: any;
}

interface ScheduleDisplay extends Omit<Schedule, 'course'> {
  course?: CourseDisplay;
}

export class EvaluationDisplayService {
  /**
   * Course 객체의 평가 필드를 표시용으로 변환
   * @param course - 원본 Course 객체
   * @returns 표시용 CourseDisplay 객체
   */
  static formatCourseForDisplay(course: Course): CourseDisplay {
    return {
      ...course,
      평가: course.평가 === '1' ? '평가' : '무시험'
    };
  }

  /**
   * Course 배열을 표시용으로 변환
   * @param courses - 원본 Course 배열
   * @returns 표시용 CourseDisplay 배열
   */
  static formatCoursesForDisplay(courses: Course[]): CourseDisplay[] {
    return courses.map(course => this.formatCourseForDisplay(course));
  }

  /**
   * Schedule 객체의 연관된 Course 정보를 표시용으로 변환
   * @param schedule - 원본 Schedule 객체
   * @returns 표시용 ScheduleDisplay 객체
   */
  static formatScheduleForDisplay(schedule: Schedule): ScheduleDisplay {
    if (schedule.course) {
      return {
        ...schedule,
        course: this.formatCourseForDisplay(schedule.course)
      } as ScheduleDisplay;
    }
    return schedule as ScheduleDisplay;
  }

  /**
   * Schedule 배열의 연관된 Course 정보를 표시용으로 변환
   * @param schedules - 원본 Schedule 배열
   * @returns 표시용 ScheduleDisplay 배열
   */
  static formatSchedulesForDisplay(schedules: Schedule[]): ScheduleDisplay[] {
    return schedules.map(schedule => this.formatScheduleForDisplay(schedule));
  }
}
