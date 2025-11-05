import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import './MultiDayAssignmentModal.css';

interface DayAssignment {
  date: Date;
  startPeriod: number;
  endPeriod: number;
  hours: number;
}

interface Schedule {
  date: string;
  start_period: number;
  end_period: number;
}

interface MultiDayAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (assignments: DayAssignment[]) => void;
  selectedDate: Date | null;
  startPeriod: number;
  requestedHours: number;
  courseName: string;
  remainingHours: number;
  maxHoursPerDay?: number; // 하루 최대 시간 제한 (전투체력 등)
  existingSchedules?: Schedule[]; // 이미 배정된 스케줄 (해당 날짜의 비는 시간 계산용)
}

// 요일별 최대 교시 수
const MAX_PERIODS_BY_DAY: { [key: number]: number } = {
  1: 9, // 월요일
  2: 9, // 화요일
  3: 9, // 수요일
  4: 8, // 목요일
  5: 5, // 금요일
};

// 다음 평일 찾기 (주말 건너뛰기)
function getNextWeekday(date: Date): Date {
  let nextDay = addDays(date, 1);
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
}

export function MultiDayAssignmentModal({
  isOpen,
  onClose,
  onConfirm,
  selectedDate,
  startPeriod,
  requestedHours,
  courseName,
  remainingHours,
  maxHoursPerDay = 999,
  existingSchedules = []
}: MultiDayAssignmentModalProps) {
  const [assignments, setAssignments] = useState<DayAssignment[]>([]);

  useEffect(() => {
    if (isOpen && selectedDate) {
      calculateAssignments();
    }
  }, [isOpen, selectedDate, startPeriod, requestedHours, maxHoursPerDay, existingSchedules]);

  // 특정 날짜에 이미 배정된 교시를 확인하는 함수
  const getOccupiedPeriods = (date: Date): Set<number> => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const occupied = new Set<number>();
    
    existingSchedules.forEach(schedule => {
      if (schedule.date === dateStr) {
        for (let period = schedule.start_period; period <= schedule.end_period; period++) {
          occupied.add(period);
        }
      }
    });
    
    return occupied;
  };

  // 특정 날짜의 다음 비는 교시를 찾는 함수
  const findNextAvailablePeriod = (date: Date, startFrom: number): number => {
    const occupied = getOccupiedPeriods(date);
    const dayOfWeek = date.getDay();
    const maxPeriods = MAX_PERIODS_BY_DAY[dayOfWeek] || 9;
    
    for (let period = startFrom; period <= maxPeriods; period++) {
      if (!occupied.has(period)) {
        return period;
      }
    }
    
    return -1; // 비는 시간이 없음
  };

  const calculateAssignments = () => {
    if (!selectedDate) return;

    const result: DayAssignment[] = [];
    let currentDate = new Date(selectedDate);
    let currentStartPeriod = startPeriod;
    let hoursLeft = requestedHours;

    while (hoursLeft > 0) {
      const dayOfWeek = currentDate.getDay();
      
      // 주말이면 다음 평일로
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate = getNextWeekday(currentDate);
        currentStartPeriod = 1;
        continue;
      }

      // 이미 배정된 시간을 고려하여 다음 비는 교시 찾기
      const nextAvailable = findNextAvailablePeriod(currentDate, currentStartPeriod);
      
      if (nextAvailable === -1) {
        // 이 날은 비는 시간이 없으므로 다음 날로
        currentDate = getNextWeekday(currentDate);
        currentStartPeriod = 1;
        continue;
      }

      const maxPeriods = MAX_PERIODS_BY_DAY[dayOfWeek] || 9;
      const occupied = getOccupiedPeriods(currentDate);
      
      // 연속된 비는 시간 계산
      let consecutiveAvailable = 0;
      for (let period = nextAvailable; period <= maxPeriods && consecutiveAvailable < hoursLeft && consecutiveAvailable < maxHoursPerDay; period++) {
        if (!occupied.has(period)) {
          consecutiveAvailable++;
        } else {
          break; // 이미 배정된 시간을 만나면 중단
        }
      }

      if (consecutiveAvailable > 0) {
        result.push({
          date: new Date(currentDate),
          startPeriod: nextAvailable,
          endPeriod: nextAvailable + consecutiveAvailable - 1,
          hours: consecutiveAvailable
        });

        hoursLeft -= consecutiveAvailable;
      }

      // 다음 날로 이동
      if (hoursLeft > 0) {
        currentDate = getNextWeekday(currentDate);
        currentStartPeriod = 1;
      }
    }

    setAssignments(result);
  };

  if (!isOpen || !selectedDate) return null;

  const totalDays = assignments.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content multi-day-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>다중 날짜 배정 확인</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="warning-box">
            <span className="warning-icon">⚠️</span>
            <div className="warning-content">
              <p><strong>{courseName}</strong> 교과목을 배정하려고 합니다.</p>
              {maxHoursPerDay < 999 ? (
                <>
                  <p>이 과목은 하루 최대 <strong>{maxHoursPerDay}시간</strong>까지만 배정할 수 있어</p>
                  <p><strong>{totalDays}일</strong>에 걸쳐 배정됩니다.</p>
                </>
              ) : (
                <>
                  <p>요청한 시간({requestedHours}시간)이 선택한 날짜의 남은 교시를 초과하여</p>
                  <p><strong>{totalDays}일</strong>에 걸쳐 배정됩니다.</p>
                </>
              )}
            </div>
          </div>

          <div className="assignment-details">
            <h4>배정 계획</h4>
            <div className="assignment-list">
              {assignments.map((assignment, index) => (
                <div key={index} className="assignment-item">
                  <div className="assignment-day">
                    <span className="day-number">Day {index + 1}</span>
                    <span className="day-date">
                      {format(assignment.date, 'yyyy-MM-dd (EEE)')}
                    </span>
                  </div>
                  <div className="assignment-time">
                    <span className="period-range">
                      {assignment.startPeriod}교시 ~ {assignment.endPeriod}교시
                    </span>
                    <span className="hours-badge">
                      {assignment.hours}시간
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-box">
            <div className="summary-item">
              <span className="summary-label">총 배정 시간:</span>
              <span className="summary-value">{requestedHours}시간</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">배정 후 남은 시수:</span>
              <span className="summary-value">{remainingHours - requestedHours}시간</span>
            </div>
          </div>

          <div className="confirmation-message">
            <p>위와 같이 여러 날에 걸쳐 배정하시겠습니까?</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => onConfirm(assignments)}
          >
            배정하기
          </button>
        </div>
      </div>
    </div>
  );
}

export type { DayAssignment };
