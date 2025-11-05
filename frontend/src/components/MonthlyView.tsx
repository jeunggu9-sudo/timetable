import { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Schedule } from '../services/courseService';
import { format } from 'date-fns';
import { getCachedCourseColor } from '../utils/colorUtils';
import './MonthlyView.css';

interface MonthlyViewProps {
  schedules: Schedule[];
  currentDate: Date;
  onScheduleClick?: (schedule: Schedule) => void;
}

export function MonthlyView({ schedules, currentDate, onScheduleClick }: MonthlyViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // FullCalendar 이벤트 형식으로 변환
  const events = schedules.map(schedule => {
    const courseName = schedule.course?.과목 || '과목명 없음';
    const instructorName = schedule.instructor?.name || '교관명 없음';
    const startPeriod = schedule.start_period;
    const endPeriod = schedule.end_period;
    const isExam = schedule.is_exam;
    
    // 과목별 색상 가져오기
    const colors = getCachedCourseColor(schedule.course_id, courseName);
    
    return {
      id: schedule.id.toString(),
      title: `${isExam ? '[평가] ' : ''}${courseName} (${instructorName})`,
      start: schedule.date,
      allDay: true,
      extendedProps: {
        schedule,
        periods: `${startPeriod}~${endPeriod}교시`,
        textColor: colors.text,
        isExam
      },
      backgroundColor: colors.background,
      borderColor: colors.border,
      textColor: colors.text
    };
  });

  // 날짜 변경 시 캘린더 업데이트
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.gotoDate(currentDate);
    }
  }, [currentDate]);

  // 이벤트 클릭 핸들러
  const handleEventClick = (info: any) => {
    const schedule = info.event.extendedProps.schedule;
    if (onScheduleClick && schedule) {
      onScheduleClick(schedule);
    }
  };

  return (
    <div className="monthly-view">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={currentDate}
        locale="ko"
        headerToolbar={false}
        height="auto"
        events={events}
        eventClick={handleEventClick}
        eventContent={(eventInfo) => {
          const isExam = eventInfo.event.extendedProps.isExam;
          return (
            <div className={`event-content ${isExam ? 'exam-event' : ''}`}>
              <div className="event-title">{eventInfo.event.title}</div>
              <div className="event-periods">{eventInfo.event.extendedProps.periods}</div>
            </div>
          );
        }}
        dayCellClassNames={(arg) => {
          const today = format(new Date(), 'yyyy-MM-dd');
          const cellDate = format(arg.date, 'yyyy-MM-dd');
          return cellDate === today ? 'today-cell' : '';
        }}
        dayHeaderFormat={{ weekday: 'short' }}
        fixedWeekCount={false}
      />
      
      {schedules.length === 0 && (
        <div className="empty-state">
          <p>이 기간에 배정된 시간표가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
