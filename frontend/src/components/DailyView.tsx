import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Schedule } from '../services/courseService';
import { getDaySchedule, getPeriodTime } from '../utils/scheduleConfig';
import { getCachedCourseColor } from '../utils/colorUtils';
import './DailyView.css';

interface DailyViewProps {
  schedules: Schedule[];
  currentDate: Date;
  onScheduleClick?: (schedule: Schedule) => void;
}

export function DailyView({ schedules, currentDate, onScheduleClick }: DailyViewProps) {
  const dayOfWeek = currentDate.getDay();
  const daySchedule = getDaySchedule(dayOfWeek);
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  
  // 교시별 스케줄 맵 생성
  const scheduleMap = new Map<number, Schedule>();
  schedules.forEach(schedule => {
    if (schedule.date === dateStr) {
      for (let period = schedule.start_period; period <= schedule.end_period; period++) {
        scheduleMap.set(period, schedule);
      }
    }
  });

  const handleScheduleClick = (schedule: Schedule) => {
    if (onScheduleClick) {
      onScheduleClick(schedule);
    }
  };

  // 주말인 경우
  if (!daySchedule) {
    return (
      <div className="daily-view">
        <div className="weekend-notice">
          <div className="notice-icon">📅</div>
          <h3>주말입니다</h3>
          <p>{format(currentDate, 'yyyy년 M월 d일 (E)', { locale: ko })}</p>
          <p className="notice-text">주말에는 수업이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-view">
      <div className="daily-header">
        <h3>{format(currentDate, 'yyyy년 M월 d일 (E)', { locale: ko })}</h3>
        <div className="day-info">
          총 {daySchedule.maxPeriods}교시
        </div>
      </div>

      <div className="daily-table-container">
        <table className="daily-table">
          <thead>
            <tr>
              <th className="period-column">교시</th>
              <th className="time-column">시간</th>
              <th className="schedule-column">수업 내용</th>
            </tr>
          </thead>
          <tbody>
            {daySchedule.periods.map((periodInfo) => {
              const schedule = scheduleMap.get(periodInfo.period);
              const isScheduleStart = schedule && schedule.start_period === periodInfo.period;
              
              // 스케줄이 있지만 시작 교시가 아닌 경우 (rowSpan으로 처리됨)
              if (schedule && !isScheduleStart) {
                return null;
              }

              // 스케줄이 있고 시작 교시인 경우
              if (schedule && isScheduleStart) {
                const rowSpan = schedule.end_period - schedule.start_period + 1;
                const courseName = schedule.course?.과목 || '과목명 없음';
                const instructorName = schedule.instructor?.name || '교관명 없음';
                const courseType = schedule.course?.구분 || '';
                const evaluation = schedule.course?.평가 || '';
                const isExam = schedule.is_exam;
                const colors = getCachedCourseColor(schedule.course_id, courseName);

                return (
                  <tr key={periodInfo.period} className="schedule-row filled">
                    <td className="period-cell" rowSpan={rowSpan}>
                      <div className="period-badge">
                        {schedule.start_period}~{schedule.end_period}교시
                      </div>
                    </td>
                    <td className="time-cell" rowSpan={rowSpan}>
                      <div className="time-range">
                        {getPeriodTime(dayOfWeek, schedule.start_period)}
                      </div>
                    </td>
                    <td
                      className={`schedule-content-cell ${schedule.is_pre_assigned ? 'pre-assigned' : ''} ${isExam ? 'exam-schedule' : ''}`}
                      rowSpan={rowSpan}
                      onClick={() => handleScheduleClick(schedule)}
                      style={{
                        backgroundColor: colors.background,
                        borderLeft: `4px solid ${colors.border}`,
                        color: colors.text
                      }}
                    >
                      <div className="schedule-content">
                        <div className="schedule-header">
                          <h4 className="course-title">{isExam ? '[평가] ' : ''}{courseName}</h4>
                          {schedule.is_pre_assigned && (
                            <span className="pre-assigned-badge">선배정</span>
                          )}
                          {isExam && (
                            <span className="exam-badge">평가</span>
                          )}
                        </div>
                        <div className="schedule-details">
                          <div className="detail-item">
                            <span className="detail-label">교관:</span>
                            <span className="detail-value">{instructorName}</span>
                          </div>
                          {courseType && (
                            <div className="detail-item">
                              <span className="detail-label">구분:</span>
                              <span className="detail-value">{courseType}</span>
                            </div>
                          )}
                          {evaluation && (
                            <div className="detail-item">
                              <span className="detail-label">평가:</span>
                              <span className="detail-value">{evaluation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }

              // 빈 교시
              return (
                <tr key={periodInfo.period} className="schedule-row empty">
                  <td className="period-cell">
                    <div className="period-number">{periodInfo.period}교시</div>
                  </td>
                  <td className="time-cell">
                    <div className="time-range">
                      {periodInfo.startTime} - {periodInfo.endTime}
                    </div>
                  </td>
                  <td className="schedule-content-cell empty">
                    <div className="empty-schedule">
                      <span className="empty-text">수업 없음</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {schedules.length === 0 && (
        <div className="empty-state">
          <p>이 날짜에 배정된 시간표가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
