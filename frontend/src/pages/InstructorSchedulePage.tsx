import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Schedule } from '../services/courseService';
import { scheduleService } from '../services/scheduleService';
import { instructorService, Instructor } from '../services/instructorService';
import { showError } from '../utils/errorHandler';
import { ScheduleEditModal } from '../components/ScheduleEditModal';
import './InstructorSchedulePage.css';

export function InstructorSchedulePage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // 교관 목록 조회
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const data = await instructorService.getInstructors();
        setInstructors(data);
        if (data.length > 0) {
          setSelectedInstructor(data[0].id);
        }
      } catch (error) {
        showError(error);
      }
    };
    fetchInstructors();
  }, []);

  // 전체 시간표 데이터 조회 (날짜 제한 없음)
  const fetchAllSchedules = async () => {
    if (!selectedInstructor) return;

    try {
      const data = await scheduleService.getSchedulesByInstructor(selectedInstructor);
      setAllSchedules(data);
    } catch (error) {
      showError(error);
    }
  };

  // 월별 시간표 데이터 조회
  const fetchSchedules = async () => {
    if (!selectedInstructor) return;

    setLoading(true);
    try {
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      const data = await scheduleService.getSchedulesByInstructor(
        selectedInstructor,
        startDate,
        endDate
      );
      setSchedules(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInstructor) {
      fetchSchedules();
      fetchAllSchedules();
    }
  }, [selectedInstructor, currentDate]);

  // 날짜 네비게이션
  const handlePrevious = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 스케줄 클릭 핸들러
  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setSelectedSchedule(null);
  };

  // 스케줄 업데이트 후 재조회
  const handleScheduleUpdate = () => {
    fetchSchedules();
    fetchAllSchedules();
  };

  // 날짜별로 그룹화
  const schedulesByDate = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.date]) {
      acc[schedule.date] = [];
    }
    acc[schedule.date].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  const sortedDates = Object.keys(schedulesByDate).sort();

  // 선택된 교관 정보
  const currentInstructor = instructors.find(i => i.id === selectedInstructor);

  // 이번 달 총 시수 계산
  const totalHours = schedules.reduce((sum, schedule) => {
    return sum + (schedule.end_period - schedule.start_period + 1);
  }, 0);

  // 전체 총 시수 계산
  const totalAllHours = allSchedules.reduce((sum, schedule) => {
    return sum + (schedule.end_period - schedule.start_period + 1);
  }, 0);

  return (
    <div className="instructor-schedule-page">
      <div className="page-header">
        <h2>교관별 시간표 조회</h2>
      </div>

      {/* 교관 선택 */}
      <div className="instructor-selector">
        <label htmlFor="instructor-select">교관 선택:</label>
        <select
          id="instructor-select"
          value={selectedInstructor || ''}
          onChange={(e) => setSelectedInstructor(Number(e.target.value))}
          className="instructor-select"
        >
          {instructors.map(instructor => (
            <option key={instructor.id} value={instructor.id}>
              {instructor.name}
            </option>
          ))}
        </select>
      </div>

      {/* 날짜 네비게이션 */}
      <div className="date-navigation">
        <button onClick={handlePrevious} className="nav-button">
          ◀ 이전 달
        </button>
        <button onClick={handleToday} className="today-button">
          이번 달
        </button>
        <span className="current-date">
          {format(currentDate, 'yyyy년 M월', { locale: ko })}
        </span>
        <button onClick={handleNext} className="nav-button">
          다음 달 ▶
        </button>
      </div>

      {/* 교관 정보 요약 */}
      {currentInstructor && (
        <div 
          className="instructor-summary"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            gap: '20px'
          }}
        >
          <div className="summary-item" style={{ background: 'transparent', flex: 1 }}>
            <span className="summary-label" style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>교관명:</span>
            <span className="summary-value" style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700 }}>{currentInstructor.name}</span>
          </div>
          <div className="summary-item" style={{ background: 'transparent', flex: 1 }}>
            <span className="summary-label" style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>전체 배정 시수:</span>
            <span className="summary-value" style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700 }}>{totalAllHours}시간</span>
          </div>
          <div className="summary-item" style={{ background: 'transparent', flex: 1 }}>
            <span className="summary-label" style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>이번 달 시수:</span>
            <span className="summary-value" style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700 }}>{totalHours}시간</span>
          </div>
          <div className="summary-item" style={{ background: 'transparent', flex: 1 }}>
            <span className="summary-label" style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>이번 달 일정:</span>
            <span className="summary-value" style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700 }}>{schedules.length}건</span>
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>시간표를 불러오는 중...</p>
        </div>
      )}

      {/* 시간표 목록 */}
      {!loading && selectedInstructor && (
        <div className="schedule-list">
          {sortedDates.length === 0 ? (
            <div className="empty-message">
              <p>선택한 기간에 배정된 일정이 없습니다.</p>
            </div>
          ) : (
            sortedDates.map(date => (
              <div key={date} className="date-group">
                <div className="date-header">
                  <h3>{format(new Date(date), 'M월 d일 (E)', { locale: ko })}</h3>
                  <span className="date-count">
                    {schedulesByDate[date].length}건
                  </span>
                </div>
                <div className="schedule-items">
                  {schedulesByDate[date].map(schedule => (
                    <div
                      key={schedule.id}
                      className="schedule-item"
                      onClick={() => handleScheduleClick(schedule)}
                    >
                      <div className="schedule-time">
                        {schedule.start_period}교시 - {schedule.end_period}교시
                        <span className="schedule-hours">
                          ({schedule.end_period - schedule.start_period + 1}시간)
                        </span>
                      </div>
                      <div className="schedule-course">
                        {schedule.course?.과목 || '과목명 없음'}
                      </div>
                      <div className="schedule-badges">
                        {schedule.is_pre_assigned && (
                          <span className="badge badge-pre-assigned">선배정</span>
                        )}
                        {schedule.is_exam && (
                          <span className="badge badge-exam">평가</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 수정 모달 */}
      {selectedSchedule && (
        <ScheduleEditModal
          schedule={selectedSchedule}
          onClose={handleCloseModal}
          onUpdate={handleScheduleUpdate}
        />
      )}
    </div>
  );
}
