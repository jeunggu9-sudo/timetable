import { format, addDays, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Schedule } from '../services/courseService';
import { getDaySchedule, DAY_NAMES, getPeriodTime } from '../utils/scheduleConfig';
import { getCachedCourseColor } from '../utils/colorUtils';
import './WeeklyView.css';

interface WeeklyViewProps {
  schedules: Schedule[];
  currentDate: Date;
  onScheduleClick?: (schedule: Schedule) => void;
}

export function WeeklyView({ schedules, currentDate, onScheduleClick }: WeeklyViewProps) {
  // 주의 시작일 (월요일)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  
  // 월~금 날짜 배열 생성
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  
  // 최대 교시 수 계산 (월~수: 9교시, 목: 8교시, 금: 5교시)
  const maxPeriods = 9;
  
  // 날짜별, 교시별 스케줄 맵 생성
  const scheduleMap = new Map<string, Schedule>();
  schedules.forEach(schedule => {
    for (let period = schedule.start_period; period <= schedule.end_period; period++) {
      const key = `${schedule.date}-${period}`;
      scheduleMap.set(key, schedule);
    }
  });

  const handleCellClick = (schedule: Schedule) => {
    if (onScheduleClick) {
      onScheduleClick(schedule);
    }
  };

  return (
    <div className="weekly-view">
      <div className="weekly-table-container">
        <table className="weekly-table">
          <thead>
            <tr>
              <th className="period-header">교시</th>
              {weekDays.map((date, index) => {
                const dayOfWeek = date.getDay();
                const daySchedule = getDaySchedule(dayOfWeek);
                
                return (
                  <th key={index} className="day-header">
                    <div className="day-name">{DAY_NAMES[dayOfWeek]}</div>
                    <div className="day-date">{format(date, 'M/d', { locale: ko })}</div>
                    {!daySchedule && <div className="weekend-label">주말</div>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxPeriods }, (_, periodIndex) => {
              const period = periodIndex + 1;
              
              return (
                <tr key={period}>
                  <td className="period-cell">
                    <div className="period-number">{period}교시</div>
                  </td>
                  {weekDays.map((date, dayIndex) => {
                    const dayOfWeek = date.getDay();
                    const daySchedule = getDaySchedule(dayOfWeek);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const key = `${dateStr}-${period}`;
                    const schedule = scheduleMap.get(key);
                    
                    // 주말이거나 해당 요일의 교시 범위를 벗어난 경우
                    if (!daySchedule || period > daySchedule.maxPeriods) {
                      return (
                        <td key={dayIndex} className="schedule-cell disabled">
                          <div className="empty-cell"></div>
                        </td>
                      );
                    }
                    
                    const periodTime = getPeriodTime(dayOfWeek, period);
                    
                    // 스케줄이 있는 경우
                    if (schedule) {
                      // 이 교시가 스케줄의 시작 교시인 경우에만 렌더링
                      if (schedule.start_period === period) {
                        const rowSpan = schedule.end_period - schedule.start_period + 1;
                        const courseName = schedule.course?.과목 || '과목명 없음';
                        const instructorName = schedule.instructor?.name || '교관명 없음';
                        const isExam = schedule.is_exam;
                        
                        const colors = getCachedCourseColor(schedule.course_id, courseName);
                        
                        return (
                          <td
                            key={dayIndex}
                            rowSpan={rowSpan}
                            className={`schedule-cell filled ${schedule.is_pre_assigned ? 'pre-assigned' : ''} ${isExam ? 'exam-schedule' : ''}`}
                            onClick={() => handleCellClick(schedule)}
                            style={{
                              backgroundColor: colors.background,
                              borderLeft: `4px solid ${colors.border}`,
                              color: colors.text
                            }}
                          >
                            <div className="schedule-info">
                              <div className="course-name">{isExam ? '[평가] ' : ''}{courseName}</div>
                              <div className="instructor-name">{instructorName}</div>
                              <div className="period-info">
                                {schedule.start_period}~{schedule.end_period}교시
                              </div>
                              <div className="time-info">{periodTime}</div>
                            </div>
                          </td>
                        );
                      } else {
                        // 중간 교시는 rowSpan으로 처리되므로 렌더링하지 않음
                        return null;
                      }
                    }
                    
                    // 빈 셀
                    return (
                      <td key={dayIndex} className="schedule-cell empty">
                        <div className="empty-cell">
                          <div className="time-label">{periodTime}</div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {schedules.length === 0 && (
        <div className="empty-state">
          <p>이 주에 배정된 시간표가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
