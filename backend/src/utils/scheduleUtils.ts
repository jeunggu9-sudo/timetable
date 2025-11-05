import { DaySchedule } from '../types/models';

/**
 * 요일별 최대 교시 수 및 시간 정보 상수
 */
export const DAILY_SCHEDULES: Record<number, DaySchedule> = {
  1: { // 월요일
    dayOfWeek: 1,
    maxPeriods: 9,
    periods: [
      { period: 1, startTime: '08:05', endTime: '08:50' },
      { period: 2, startTime: '08:55', endTime: '09:40' },
      { period: 3, startTime: '09:45', endTime: '10:30' },
      { period: 4, startTime: '10:35', endTime: '11:20' },
      // 점심시간 11:35-13:00
      { period: 5, startTime: '13:00', endTime: '13:45' },
      { period: 6, startTime: '13:50', endTime: '14:35' },
      { period: 7, startTime: '14:40', endTime: '15:25' },
      { period: 8, startTime: '15:30', endTime: '16:15' },
      { period: 9, startTime: '16:20', endTime: '17:05' }
    ]
  },
  2: { // 화요일
    dayOfWeek: 2,
    maxPeriods: 9,
    periods: [
      { period: 1, startTime: '08:05', endTime: '08:50' },
      { period: 2, startTime: '08:55', endTime: '09:40' },
      { period: 3, startTime: '09:45', endTime: '10:30' },
      { period: 4, startTime: '10:35', endTime: '11:20' },
      // 점심시간 11:35-13:00
      { period: 5, startTime: '13:00', endTime: '13:45' },
      { period: 6, startTime: '13:50', endTime: '14:35' },
      { period: 7, startTime: '14:40', endTime: '15:25' },
      { period: 8, startTime: '15:30', endTime: '16:15' },
      { period: 9, startTime: '16:20', endTime: '17:05' }
    ]
  },
  3: { // 수요일
    dayOfWeek: 3,
    maxPeriods: 9,
    periods: [
      { period: 1, startTime: '08:05', endTime: '08:50' },
      { period: 2, startTime: '08:55', endTime: '09:40' },
      { period: 3, startTime: '09:45', endTime: '10:30' },
      { period: 4, startTime: '10:35', endTime: '11:20' },
      // 점심시간 11:35-13:00
      { period: 5, startTime: '13:00', endTime: '13:45' },
      { period: 6, startTime: '13:50', endTime: '14:35' },
      { period: 7, startTime: '14:40', endTime: '15:25' },
      { period: 8, startTime: '15:30', endTime: '16:15' },
      { period: 9, startTime: '16:20', endTime: '17:05' }
    ]
  },
  4: { // 목요일
    dayOfWeek: 4,
    maxPeriods: 8,
    periods: [
      { period: 1, startTime: '08:40', endTime: '09:25' },
      { period: 2, startTime: '09:30', endTime: '10:15' },
      { period: 3, startTime: '10:20', endTime: '11:05' },
      // 점심시간 11:35-13:00
      { period: 4, startTime: '13:00', endTime: '13:45' },
      { period: 5, startTime: '13:50', endTime: '14:35' },
      { period: 6, startTime: '14:40', endTime: '15:25' },
      { period: 7, startTime: '15:30', endTime: '16:15' },
      { period: 8, startTime: '16:20', endTime: '17:05' }
    ]
  },
  5: { // 금요일
    dayOfWeek: 5,
    maxPeriods: 5,
    periods: [
      { period: 1, startTime: '08:40', endTime: '09:25' },
      { period: 2, startTime: '09:30', endTime: '10:15' },
      { period: 3, startTime: '10:20', endTime: '11:05' },
      // 점심시간 11:35-13:00
      { period: 4, startTime: '13:00', endTime: '13:45' },
      { period: 5, startTime: '13:50', endTime: '14:35' }
    ]
  }
};

/**
 * 날짜가 주말인지 확인하는 함수
 * @param date YYYY-MM-DD 형식의 날짜 문자열 또는 Date 객체
 * @returns 주말이면 true, 평일이면 false
 */
export function isWeekend(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dayOfWeek = dateObj.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0=일요일, 6=토요일
}

/**
 * 날짜의 요일을 반환하는 함수
 * @param date YYYY-MM-DD 형식의 날짜 문자열 또는 Date 객체
 * @returns 요일 (0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토)
 */
export function getDayOfWeek(date: string | Date): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getDay();
}

/**
 * 교시 번호를 시간으로 변환하는 함수
 * @param date YYYY-MM-DD 형식의 날짜 문자열
 * @param period 교시 번호 (1-9)
 * @returns 시작 시간과 종료 시간을 포함한 객체, 유효하지 않으면 null
 */
export function periodToTime(date: string, period: number): { startTime: string; endTime: string } | null {
  const dayOfWeek = getDayOfWeek(date);
  
  // 주말은 일과시간이 없음
  if (isWeekend(date)) {
    return null;
  }
  
  const daySchedule = DAILY_SCHEDULES[dayOfWeek];
  if (!daySchedule) {
    return null;
  }
  
  const periodInfo = daySchedule.periods.find(p => p.period === period);
  if (!periodInfo) {
    return null;
  }
  
  return {
    startTime: periodInfo.startTime,
    endTime: periodInfo.endTime
  };
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷하는 함수
 * @param date Date 객체
 * @returns YYYY-MM-DD 형식의 문자열
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 날짜에 일수를 더하는 함수
 * @param date YYYY-MM-DD 형식의 날짜 문자열 또는 Date 객체
 * @param days 더할 일수
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export function addDays(date: string | Date, days: number): string {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return formatDate(dateObj);
}
