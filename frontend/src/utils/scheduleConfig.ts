export interface PeriodInfo {
  period: number;
  startTime: string;
  endTime: string;
}

export interface DayScheduleConfig {
  maxPeriods: number;
  periods: PeriodInfo[];
}

export const DAILY_SCHEDULES: Record<number, DayScheduleConfig> = {
  1: { // 월요일
    maxPeriods: 9,
    periods: [
      { period: 1, startTime: '08:05', endTime: '08:50' },
      { period: 2, startTime: '08:55', endTime: '09:40' },
      { period: 3, startTime: '09:45', endTime: '10:30' },
      { period: 4, startTime: '10:35', endTime: '11:20' },
      { period: 5, startTime: '13:00', endTime: '13:45' },
      { period: 6, startTime: '13:50', endTime: '14:35' },
      { period: 7, startTime: '14:40', endTime: '15:25' },
      { period: 8, startTime: '15:30', endTime: '16:15' },
      { period: 9, startTime: '16:20', endTime: '17:05' }
    ]
  },
  2: { // 화요일
    maxPeriods: 9,
    periods: [
      { period: 1, startTime: '08:05', endTime: '08:50' },
      { period: 2, startTime: '08:55', endTime: '09:40' },
      { period: 3, startTime: '09:45', endTime: '10:30' },
      { period: 4, startTime: '10:35', endTime: '11:20' },
      { period: 5, startTime: '13:00', endTime: '13:45' },
      { period: 6, startTime: '13:50', endTime: '14:35' },
      { period: 7, startTime: '14:40', endTime: '15:25' },
      { period: 8, startTime: '15:30', endTime: '16:15' },
      { period: 9, startTime: '16:20', endTime: '17:05' }
    ]
  },
  3: { // 수요일
    maxPeriods: 9,
    periods: [
      { period: 1, startTime: '08:05', endTime: '08:50' },
      { period: 2, startTime: '08:55', endTime: '09:40' },
      { period: 3, startTime: '09:45', endTime: '10:30' },
      { period: 4, startTime: '10:35', endTime: '11:20' },
      { period: 5, startTime: '13:00', endTime: '13:45' },
      { period: 6, startTime: '13:50', endTime: '14:35' },
      { period: 7, startTime: '14:40', endTime: '15:25' },
      { period: 8, startTime: '15:30', endTime: '16:15' },
      { period: 9, startTime: '16:20', endTime: '17:05' }
    ]
  },
  4: { // 목요일
    maxPeriods: 8,
    periods: [
      { period: 1, startTime: '08:40', endTime: '09:25' },
      { period: 2, startTime: '09:30', endTime: '10:15' },
      { period: 3, startTime: '10:20', endTime: '11:05' },
      { period: 4, startTime: '13:00', endTime: '13:45' },
      { period: 5, startTime: '13:50', endTime: '14:35' },
      { period: 6, startTime: '14:40', endTime: '15:25' },
      { period: 7, startTime: '15:30', endTime: '16:15' },
      { period: 8, startTime: '16:20', endTime: '17:05' }
    ]
  },
  5: { // 금요일
    maxPeriods: 5,
    periods: [
      { period: 1, startTime: '08:40', endTime: '09:25' },
      { period: 2, startTime: '09:30', endTime: '10:15' },
      { period: 3, startTime: '10:20', endTime: '11:05' },
      { period: 4, startTime: '13:00', endTime: '13:45' },
      { period: 5, startTime: '13:50', endTime: '14:35' }
    ]
  }
};

export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export function getDaySchedule(dayOfWeek: number): DayScheduleConfig | null {
  // 주말은 일정이 없음
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return null;
  }
  return DAILY_SCHEDULES[dayOfWeek] || null;
}

export function getPeriodTime(dayOfWeek: number, period: number): string {
  const schedule = getDaySchedule(dayOfWeek);
  if (!schedule) return '';
  
  const periodInfo = schedule.periods.find(p => p.period === period);
  return periodInfo ? `${periodInfo.startTime}-${periodInfo.endTime}` : '';
}
