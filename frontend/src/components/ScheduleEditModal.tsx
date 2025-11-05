import { useState, useEffect } from 'react';
import { Schedule } from '../services/courseService';
import { scheduleService } from '../services/scheduleService';
import { showError, showSuccess } from '../utils/errorHandler';
import { getDaySchedule } from '../utils/scheduleConfig';
import './ScheduleEditModal.css';

interface ScheduleEditModalProps {
  schedule: Schedule;
  onClose: () => void;
  onUpdate: () => void;
}

export function ScheduleEditModal({ schedule, onClose, onUpdate }: ScheduleEditModalProps) {
  const [date, setDate] = useState(schedule.date);
  const [startPeriod, setStartPeriod] = useState(schedule.start_period);
  const [endPeriod, setEndPeriod] = useState(schedule.end_period);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const courseName = schedule.course?.과목 || '과목명 없음';
  const instructorName = schedule.instructor?.name || '교관명 없음';
  const courseHours = schedule.course?.시수 || 0;

  // 선택된 날짜의 요일에 따른 최대 교시 수
  const selectedDate = new Date(date);
  const dayOfWeek = selectedDate.getDay();
  const daySchedule = getDaySchedule(dayOfWeek);
  const maxPeriods = daySchedule?.maxPeriods || 9;

  // 선택된 시간의 총 시수 계산
  const selectedHours = endPeriod - startPeriod + 1;

  // 유효성 검증
  const isValid = () => {
    if (!daySchedule) {
      return { valid: false, message: '주말에는 수업을 배정할 수 없습니다.' };
    }
    if (startPeriod < 1 || endPeriod > maxPeriods) {
      return { valid: false, message: `선택한 요일의 교시 범위(1~${maxPeriods})를 벗어났습니다.` };
    }
    if (startPeriod > endPeriod) {
      return { valid: false, message: '시작 교시가 종료 교시보다 클 수 없습니다.' };
    }
    return { valid: true, message: '' };
  };

  const validation = isValid();

  // 수정 처리
  const handleUpdate = async () => {
    if (!validation.valid) {
      return;
    }

    setLoading(true);
    try {
      await scheduleService.updateSchedule(schedule.id, {
        date,
        startPeriod,
        endPeriod
      });
      showSuccess('시간표가 수정되었습니다.');
      onUpdate();
      onClose();
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) {
      return;
    }

    setDeleting(true);
    try {
      await scheduleService.deleteSchedule(schedule.id);
      showSuccess('시간표가 삭제되었습니다.');
      onUpdate();
      onClose();
    } catch (error) {
      showError(error);
    } finally {
      setDeleting(false);
    }
  };

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>시간표 수정</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* 과목 정보 */}
          <div className="info-section">
            <div className="info-item">
              <span className="info-label">과목:</span>
              <span className="info-value">{courseName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">교관:</span>
              <span className="info-value">{instructorName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">총 시수:</span>
              <span className="info-value">{courseHours}시간</span>
            </div>
            {schedule.is_pre_assigned && (
              <div className="pre-assigned-notice">
                <span className="badge">선배정</span>
              </div>
            )}
          </div>

          {/* 날짜 및 시간 수정 */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="date">날짜</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startPeriod">시작 교시</label>
                <select
                  id="startPeriod"
                  value={startPeriod}
                  onChange={(e) => setStartPeriod(Number(e.target.value))}
                  className="form-input"
                >
                  {Array.from({ length: maxPeriods }, (_, i) => i + 1).map(period => (
                    <option key={period} value={period}>{period}교시</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="endPeriod">종료 교시</label>
                <select
                  id="endPeriod"
                  value={endPeriod}
                  onChange={(e) => setEndPeriod(Number(e.target.value))}
                  className="form-input"
                >
                  {Array.from({ length: maxPeriods }, (_, i) => i + 1).map(period => (
                    <option key={period} value={period}>{period}교시</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="hours-info">
              선택한 시간: <strong>{selectedHours}시간</strong>
              {selectedHours !== courseHours && (
                <span className="warning-text">
                  (과목 시수 {courseHours}시간과 다릅니다)
                </span>
              )}
            </div>

            {!validation.valid && (
              <div className="error-message">
                {validation.message}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="delete-button"
            onClick={handleDelete}
            disabled={deleting || loading}
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
          <div className="button-group">
            <button
              className="cancel-button"
              onClick={onClose}
              disabled={loading || deleting}
            >
              취소
            </button>
            <button
              className="save-button"
              onClick={handleUpdate}
              disabled={!validation.valid || loading || deleting}
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
