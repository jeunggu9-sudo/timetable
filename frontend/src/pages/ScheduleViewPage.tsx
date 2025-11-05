import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Schedule } from '../services/courseService';
import { scheduleService } from '../services/scheduleService';
import { showError } from '../utils/errorHandler';
import { MonthlyView } from '../components/MonthlyView';
import { WeeklyView } from '../components/WeeklyView';
import { DailyView } from '../components/DailyView';
import { ScheduleEditModal } from '../components/ScheduleEditModal';
import './ScheduleViewPage.css';

type ViewMode = 'monthly' | 'weekly' | 'daily';

export function ScheduleViewPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // 날짜 범위 계산
  const getDateRange = () => {
    switch (viewMode) {
      case 'monthly':
        return {
          startDate: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(currentDate), 'yyyy-MM-dd')
        };
      case 'weekly':
        return {
          startDate: format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        };
      case 'daily':
        return {
          startDate: format(currentDate, 'yyyy-MM-dd'),
          endDate: format(currentDate, 'yyyy-MM-dd')
        };
    }
  };

  // 시간표 데이터 조회
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const data = await scheduleService.getSchedules({ 
        startDate, 
        endDate,
        displayFormat: true // 평가 필드를 사용자 친화적 형태로 표시
      });
      setSchedules(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [currentDate, viewMode]);

  // 날짜 네비게이션
  const handlePrevious = () => {
    switch (viewMode) {
      case 'monthly':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'weekly':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'daily':
        setCurrentDate(subDays(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'monthly':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'weekly':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'daily':
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
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
  };

  // 현재 날짜 표시 텍스트
  const getDateDisplayText = () => {
    switch (viewMode) {
      case 'monthly':
        return format(currentDate, 'yyyy년 M월', { locale: ko });
      case 'weekly':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'yyyy.MM.dd', { locale: ko })} - ${format(weekEnd, 'MM.dd', { locale: ko })}`;
      case 'daily':
        return format(currentDate, 'yyyy년 M월 d일 (E)', { locale: ko });
    }
  };

  return (
    <div className="schedule-view-page">
      <div className="page-header">
        <h2>시간표 조회</h2>
      </div>

      {/* 뷰 모드 전환 및 네비게이션 컨트롤 */}
      <div className="schedule-controls">
        <div className="view-mode-selector">
          <button
            className={viewMode === 'monthly' ? 'active' : ''}
            onClick={() => setViewMode('monthly')}
          >
            월별
          </button>
          <button
            className={viewMode === 'weekly' ? 'active' : ''}
            onClick={() => setViewMode('weekly')}
          >
            주별
          </button>
          <button
            className={viewMode === 'daily' ? 'active' : ''}
            onClick={() => setViewMode('daily')}
          >
            일별
          </button>
        </div>

        <div className="date-navigation">
          <button onClick={handlePrevious} className="nav-button">
            ◀ 이전
          </button>
          <button onClick={handleToday} className="today-button">
            오늘
          </button>
          <span className="current-date">{getDateDisplayText()}</span>
          <button onClick={handleNext} className="nav-button">
            다음 ▶
          </button>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>시간표를 불러오는 중...</p>
        </div>
      )}

      {/* 뷰 렌더링 영역 */}
      {!loading && (
        <div className="schedule-content">
          {viewMode === 'monthly' && (
            <MonthlyView
              schedules={schedules}
              currentDate={currentDate}
              onScheduleClick={handleScheduleClick}
            />
          )}
          {viewMode === 'weekly' && (
            <WeeklyView
              schedules={schedules}
              currentDate={currentDate}
              onScheduleClick={handleScheduleClick}
            />
          )}
          {viewMode === 'daily' && (
            <DailyView
              schedules={schedules}
              currentDate={currentDate}
              onScheduleClick={handleScheduleClick}
            />
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
