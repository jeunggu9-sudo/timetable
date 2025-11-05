/**
 * 데이터베이스 모델 타입 정의
 */

export interface Course {
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

export interface Instructor {
  id: number;
  name: string;
  created_at: string;
}

export interface Schedule {
  id: number;
  course_id: number;
  instructor_id: number;
  date: string; // YYYY-MM-DD
  start_period: number; // 1-9
  end_period: number; // 1-9
  is_pre_assigned: boolean;
  is_exam: boolean;
  created_at: string;
  // Joined data (optional)
  course?: Course;
  instructor?: Instructor;
}

export interface OffDay {
  id: number;
  instructor_id: number;
  date: string; // YYYY-MM-DD
  reason?: string; // 휴무 사유
  created_at: string;
  instructor?: Instructor;
}

export interface SchoolHoliday {
  id: number;
  date: string; // YYYY-MM-DD
  start_period: number | null; // null이면 하루 전체
  end_period: number | null; // null이면 하루 전체
  description: string | null;
  created_at: string;
}

export interface TimeSlot {
  date: string;
  period: number;
  isOccupied: boolean;
}

export interface DaySchedule {
  dayOfWeek: number; // 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
  maxPeriods: number;
  periods: {
    period: number;
    startTime: string;
    endTime: string;
  }[];
}
