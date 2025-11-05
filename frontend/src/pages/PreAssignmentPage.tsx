import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { Course, Instructor, Schedule, CourseDisplay } from '../types/models';
import { courseService } from '../services/courseService';
import { scheduleService } from '../services/scheduleService';
import { instructorService } from '../services/instructorService';
import { TimeSlotModal } from '../components/TimeSlotModal';
import { MultiDayAssignmentModal, DayAssignment } from '../components/MultiDayAssignmentModal';
import { WeeklyView } from '../components/WeeklyView';
import { showError, showSuccess } from '../utils/errorHandler';
import { getCachedCourseColor } from '../utils/colorUtils';
import { EvaluationDisplayUtils } from '../utils/evaluationDisplayUtils';
import './PreAssignmentPage.css';

type ViewMode = 'month' | 'week';

export function PreAssignmentPage() {
  const [courses, setCourses] = useState<CourseDisplay[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [instructorOffDays, setInstructorOffDays] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDisplay | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMultiDayModalOpen, setIsMultiDayModalOpen] = useState(false);
  const [multiDayStartPeriod, setMultiDayStartPeriod] = useState<number>(1);
  const [multiDayRequestedHours, setMultiDayRequestedHours] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Load courses with 선배정=1
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesData, instructorsData, schedulesData] = await Promise.all([
        courseService.getCoursesByPreAssignment(1, true), // displayFormat=true
        instructorService.getAllInstructors(),
        scheduleService.getSchedules()
      ]);
      setCourses(coursesData as CourseDisplay[] || []);
      setInstructors(instructorsData || []);
      setSchedules(schedulesData || []);
    } catch (error) {
      console.error('Failed to load pre-assignment data:', error);
      showError(error, '선배정 데이터 로드 실패');
      // Set empty arrays to prevent further errors
      setCourses([]);
      setInstructors([]);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = async (course: CourseDisplay) => {
    setSelectedCourse(course);
    // Find instructor for this course
    const instructor = instructors.find(i => i.name === course.담당교관);
    setSelectedInstructor(instructor || null);
    
    // Load instructor's off days
    if (instructor) {
      try {
        const offDays = await instructorService.getOffDays(instructor.id);
        setInstructorOffDays(offDays.map(od => od.date));
      } catch (error) {
        console.error('Failed to load instructor off days:', error);
        setInstructorOffDays([]);
      }
    } else {
      setInstructorOffDays([]);
    }
  };

  const handleDateClick = (arg: DateClickArg) => {
    if (!selectedCourse) {
      showError(new Error('먼저 교과목을 선택하세요.'));
      return;
    }

    if (!selectedInstructor) {
      showError(new Error('교관 정보를 찾을 수 없습니다.'));
      return;
    }

    // Get the clicked date and check if it's a weekend
    const clickedDate = arg.date;
    const dayOfWeek = clickedDate.getDay();
    
    console.log('Clicked date:', clickedDate, 'Day of week:', dayOfWeek);
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      showError(new Error('주말에는 배정할 수 없습니다.'));
      return;
    }

    // Check if it's instructor's off day
    const year = clickedDate.getFullYear();
    const month = String(clickedDate.getMonth() + 1).padStart(2, '0');
    const day = String(clickedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    if (instructorOffDays.includes(dateStr)) {
      showError(new Error('해당 날짜는 교관의 휴무일입니다.'));
      return;
    }

    setSelectedDate(clickedDate);
    setIsModalOpen(true);
  };

  const handleTimeSlotConfirm = async (startPeriod: number, endPeriod: number) => {
    if (!selectedCourse || !selectedInstructor || !selectedDate) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Format date as YYYY-MM-DD (use local date, not UTC)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      console.log('Creating pre-assignment:', {
        courseId: selectedCourse.id,
        instructorId: selectedInstructor.id,
        date: dateStr,
        startPeriod,
        endPeriod
      });

      await scheduleService.createPreAssignment({
        courseId: Number(selectedCourse.id),
        instructorId: Number(selectedInstructor.id),
        date: dateStr,
        startPeriod: Number(startPeriod),
        endPeriod: Number(endPeriod)
      });

      showSuccess('선배정이 완료되었습니다.');
      
      // Reload schedules
      await loadData();
      
      // Close modal and reset selection
      setIsModalOpen(false);
      setSelectedDate(null);
    } catch (error) {
      console.error('Pre-assignment error:', error);
      showError(error, '선배정 생성 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMultiDayRequest = async (startPeriod: number, requestedHours: number) => {
    if (!selectedCourse || !selectedInstructor || !selectedDate) {
      return;
    }

    // 먼저 확인 모달 표시
    setMultiDayStartPeriod(startPeriod);
    setMultiDayRequestedHours(requestedHours);
    setIsModalOpen(false);
    setIsMultiDayModalOpen(true);
  };

  const handleMultiDayConfirm = async (assignments: DayAssignment[]) => {
    if (!selectedCourse || !selectedInstructor) {
      return;
    }

    try {
      setIsSubmitting(true);
      setIsMultiDayModalOpen(false);

      // 각 날짜별로 순차적으로 배정
      for (const assignment of assignments) {
        const year = assignment.date.getFullYear();
        const month = String(assignment.date.getMonth() + 1).padStart(2, '0');
        const day = String(assignment.date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        await scheduleService.createPreAssignment({
          courseId: Number(selectedCourse.id),
          instructorId: Number(selectedInstructor.id),
          date: dateStr,
          startPeriod: Number(assignment.startPeriod),
          endPeriod: Number(assignment.endPeriod)
        });
      }

      showSuccess(`${assignments.length}일에 걸쳐 선배정이 완료되었습니다.`);
      
      // Reload schedules
      await loadData();
      
      // Reset selection
      setSelectedDate(null);
    } catch (error) {
      console.error('Multi-day pre-assignment error:', error);
      showError(error, '다중 날짜 선배정 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setSelectedDate(null);
    }
  };

  const handleEventClick = async (clickInfo: any) => {
    const schedule = clickInfo.event.extendedProps.schedule as Schedule;
    
    // 선배정된 일정만 삭제 가능
    if (!schedule.is_pre_assigned) {
      showError(new Error('선배정된 일정만 취소할 수 있습니다.'));
      return;
    }

    const courseName = schedule.course?.과목 || '과목명 없음';
    const dateStr = format(new Date(schedule.date), 'yyyy년 M월 d일');
    
    if (!confirm(`${courseName} (${dateStr}, ${schedule.start_period}~${schedule.end_period}교시)\n\n이 선배정을 취소하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);
      await scheduleService.deleteSchedule(schedule.id);
      showSuccess('선배정이 취소되었습니다.');
      await loadData();
    } catch (error) {
      console.error('Failed to delete pre-assignment:', error);
      showError(error, '선배정 취소 실패');
    } finally {
      setLoading(false);
    }
  };

  // Convert schedules to FullCalendar events
  const calendarEvents = schedules.map(schedule => {
    const courseName = schedule.course?.과목 || '과목명 없음';
    const instructorName = schedule.instructor?.name || '교관 미지정';
    const colors = getCachedCourseColor(schedule.course_id, courseName);
    
    return {
      id: schedule.id.toString(),
      title: `${courseName} (${instructorName})`,
      start: schedule.date,
      extendedProps: {
        schedule,
        courseName,
        instructorName,
        startPeriod: schedule.start_period,
        endPeriod: schedule.end_period,
        textColor: colors.text
      },
      backgroundColor: colors.background,
      borderColor: colors.border,
      textColor: colors.text
    };
  });

  if (loading) {
    return (
      <div className="pre-assignment-page">
        <div className="loading">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="pre-assignment-page">
      <h2>선배정 관리</h2>
      <p className="page-description">
        선배정 값이 1인 교과목을 선택하여 원하는 날짜와 시간에 배정하세요.
      </p>

      <div className="pre-assignment-container">
        {/* Course Selection Panel */}
        <div className="course-panel">
          <h3>선배정 대상 교과목</h3>
          {courses.length === 0 ? (
            <div className="empty-message">
              선배정 대상 교과목이 없습니다. 엑셀 파일을 먼저 업로드하세요.
            </div>
          ) : (
            <div className="course-list">
              {courses.map(course => {
                // Calculate assigned hours for this course
                const assignedHours = schedules
                  .filter(s => s.course_id === course.id && s.is_pre_assigned)
                  .reduce((sum, s) => sum + (s.end_period - s.start_period + 1), 0);
                
                const isFullyAssigned = assignedHours >= course.시수;
                const isPartiallyAssigned = assignedHours > 0 && assignedHours < course.시수;
                
                return (
                  <div
                    key={course.id}
                    className={`course-item ${selectedCourse?.id === course.id ? 'selected' : ''} ${isFullyAssigned ? 'assigned' : ''} ${isPartiallyAssigned ? 'partial' : ''}`}
                    onClick={() => handleCourseSelect(course)}
                  >
                    <div className="course-name">
                      {course.과목}
                      {isFullyAssigned && <span className="assigned-badge">✓ 배정완료</span>}
                      {isPartiallyAssigned && <span className="partial-badge">{assignedHours}/{course.시수}시간</span>}
                    </div>
                    <div className="course-details">
                      <span className="course-type">{course.구분}</span>
                      <span className="course-hours">{course.시수}시간</span>
                    </div>
                    <div className="course-instructor">교관: {course.담당교관}</div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedCourse && (
            <div className="selected-course-info">
              <h4>선택된 교과목</h4>
              <div className="info-row">
                <span className="label">과목명:</span>
                <span className="value">{selectedCourse.과목}</span>
              </div>
              <div className="info-row">
                <span className="label">시수:</span>
                <span className="value">{selectedCourse.시수}시간</span>
              </div>
              <div className="info-row">
                <span className="label">교관:</span>
                <span className="value">{selectedCourse.담당교관}</span>
              </div>
              <div className="info-row">
                <span className="label">평가:</span>
                <span className={`value evaluation-badge ${EvaluationDisplayUtils.getEvaluationStyleClass(selectedCourse.평가)}`}>
                  {selectedCourse.평가}
                </span>
              </div>
              <div className="info-note">
                캘린더에서 날짜를 클릭하여 시간을 선택하세요.
                {instructorOffDays.length > 0 && (
                  <div className="offday-info">
                    ⚠️ 주황색으로 표시된 날짜는 교관의 휴무일입니다.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Calendar Panel */}
        <div className="calendar-panel">
          {/* View Mode Toggle */}
          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              월별
            </button>
            <button
              className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              주별
            </button>
          </div>

          {viewMode === 'month' ? (
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: ''
              }}
              datesSet={(dateInfo) => {
                setCurrentDate(dateInfo.start);
              }}
            events={calendarEvents}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            locale="ko"
            height="auto"
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            dayCellClassNames={(arg) => {
              // Add class to weekend cells for styling
              const dayOfWeek = arg.date.getDay();
              const classes = [];
              
              if (dayOfWeek === 0 || dayOfWeek === 6) {
                classes.push('weekend-cell');
              }
              
              // Add class to instructor off days
              if (selectedInstructor) {
                const year = arg.date.getFullYear();
                const month = String(arg.date.getMonth() + 1).padStart(2, '0');
                const day = String(arg.date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                if (instructorOffDays.includes(dateStr)) {
                  classes.push('offday-cell');
                }
              }
              
              return classes.join(' ');
            }}
            eventContent={(eventInfo) => {
              const { courseName, instructorName, startPeriod, endPeriod, schedule } = eventInfo.event.extendedProps;
              const isPreAssigned = schedule?.is_pre_assigned;
              return (
                <div className={`calendar-event ${isPreAssigned ? 'pre-assigned' : ''}`}>
                  <div className="event-title">
                    {courseName}
                    {isPreAssigned && <span className="pre-assigned-badge">선배정</span>}
                  </div>
                  <div className="event-instructor">교관: {instructorName}</div>
                  <div className="event-time">{startPeriod}교시 - {endPeriod}교시</div>
                  {isPreAssigned && <div className="event-hint">클릭하여 취소</div>}
                </div>
              );
            }}
            />
          ) : (
            <>
              {/* Week Navigation */}
              <div className="week-navigation">
                <button
                  className="nav-btn"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setDate(newDate.getDate() - 7);
                    setCurrentDate(newDate);
                  }}
                >
                  ← 이전 주
                </button>
                <div className="current-week">
                  {format(currentDate, 'yyyy년 M월', { locale: undefined })}
                </div>
                <button
                  className="nav-btn"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setDate(newDate.getDate() + 7);
                    setCurrentDate(newDate);
                  }}
                >
                  다음 주 →
                </button>
              </div>
              <WeeklyView
                schedules={schedules}
                currentDate={currentDate}
                onScheduleClick={async (schedule) => {
                  // 선배정된 일정만 삭제 가능
                  if (!schedule.is_pre_assigned) {
                    showError(new Error('선배정된 일정만 취소할 수 있습니다.'));
                    return;
                  }

                  const courseName = schedule.course?.과목 || '과목명 없음';
                  const dateStr = format(new Date(schedule.date), 'yyyy년 M월 d일');
                  
                  if (!confirm(`${courseName} (${dateStr}, ${schedule.start_period}~${schedule.end_period}교시)\n\n이 선배정을 취소하시겠습니까?`)) {
                    return;
                  }

                  try {
                    setLoading(true);
                    await scheduleService.deleteSchedule(schedule.id);
                    showSuccess('선배정이 취소되었습니다.');
                    await loadData();
                  } catch (error) {
                    console.error('Failed to delete pre-assignment:', error);
                    showError(error, '선배정 취소 실패');
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Time Slot Selection Modal */}
      <TimeSlotModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleTimeSlotConfirm}
        onMultiDayRequest={handleMultiDayRequest}
        selectedDate={selectedDate}
        requiredHours={selectedCourse?.시수 || 0}
        courseName={selectedCourse?.과목 || ''}
        assignedHours={
          selectedCourse
            ? schedules
                .filter((s) => s.course_id === selectedCourse.id)
                .reduce((sum, s) => sum + (s.end_period - s.start_period + 1), 0)
            : 0
        }
      />

      {/* Multi-Day Assignment Modal */}
      <MultiDayAssignmentModal
        isOpen={isMultiDayModalOpen}
        onClose={() => setIsMultiDayModalOpen(false)}
        onConfirm={handleMultiDayConfirm}
        selectedDate={selectedDate}
        startPeriod={multiDayStartPeriod}
        requestedHours={multiDayRequestedHours}
        courseName={selectedCourse?.과목 || ''}
        remainingHours={
          selectedCourse
            ? selectedCourse.시수 - schedules
                .filter((s) => s.course_id === selectedCourse.id)
                .reduce((sum, s) => sum + (s.end_period - s.start_period + 1), 0)
            : 0
        }
        maxHoursPerDay={selectedCourse?.과목.includes('전투체력') ? 2 : undefined}
        existingSchedules={schedules.map(s => ({
          date: s.date,
          start_period: s.start_period,
          end_period: s.end_period
        }))}
      />
    </div>
  );
}
