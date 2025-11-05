import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleService } from '../services/scheduleService';
import { showError, showSuccess } from '../utils/errorHandler';
import './ScheduleGenerationPage.css';

interface GenerationResult {
  success: boolean;
  message: string;
  scheduleCount?: number;
  errors?: string[];
}

type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

export function ScheduleGenerationPage() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<string>('');
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(event.target.value);
    // Reset status when date changes
    if (generationStatus !== 'idle') {
      setGenerationStatus('idle');
      setGenerationResult(null);
    }
  };

  const handleGenerate = async () => {
    if (!startDate) {
      showError(new Error('시작 날짜를 선택해주세요.'));
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      showError(new Error('과거 날짜는 선택할 수 없습니다.'));
      return;
    }

    // Check if it's a weekend
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      showError(new Error('주말은 시작 날짜로 선택할 수 없습니다.'));
      return;
    }

    setGenerationStatus('generating');
    setGenerationResult(null);

    try {
      const result = await scheduleService.generateSchedule(startDate);
      
      setGenerationResult(result);
      setGenerationStatus('success');
      showSuccess(result.message || '시간표가 성공적으로 생성되었습니다.');
      
      // Navigate to schedule view after a short delay
      setTimeout(() => {
        navigate('/schedule');
      }, 2000);
    } catch (error: any) {
      setGenerationStatus('error');
      const errorMessage = error.message || '시간표 생성 중 오류가 발생했습니다.';
      setGenerationResult({
        success: false,
        message: errorMessage,
        errors: error.details?.errors || []
      });
      showError(error);
    }
  };

  const handleReset = () => {
    setStartDate('');
    setGenerationStatus('idle');
    setGenerationResult(null);
  };

  const handleViewSchedule = () => {
    navigate('/schedule');
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="schedule-generation-page">
      <h2>⚡ 시간표 자동 생성</h2>
      <p className="page-description">
        시작 날짜를 선택하면 시스템이 자동으로 교과목을 배정하여 시간표를 생성합니다.
        선배정된 일정은 그대로 유지되며, 나머지 교과목이 자동으로 배정됩니다.
      </p>

      <div className="generation-container">
        <div className="generation-card">
          <div className="card-header">
            <h3>시간표 생성 설정</h3>
          </div>

          <div className="card-body">
            <div className="form-group">
              <label htmlFor="start-date" className="form-label">
                시작 날짜 <span className="required">*</span>
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={handleDateChange}
                min={today}
                disabled={generationStatus === 'generating'}
                className="date-input"
              />
              <p className="form-hint">
                교육 과정이 시작되는 날짜를 선택하세요. (주말 제외)
              </p>
            </div>

            <div className="info-box">
              <div className="info-icon">ℹ️</div>
              <div className="info-content">
                <h4>자동 생성 규칙</h4>
                <ul>
                  <li>선배정된 일정은 변경되지 않습니다</li>
                  <li>교과목은 엑셀 순서대로 배정됩니다</li>
                  <li>하루 최대 3시간까지 동일 과목을 배정합니다</li>
                  <li>교관 휴무일에는 해당 교관의 과목을 배정하지 않습니다</li>
                  <li>일과시간 내에서만 배정됩니다 (월~금, 점심시간 제외)</li>
                </ul>
              </div>
            </div>

            <div className="button-group">
              <button
                onClick={handleGenerate}
                disabled={!startDate || generationStatus === 'generating'}
                className="generate-button"
              >
                {generationStatus === 'generating' ? (
                  <>
                    <span className="spinner-small"></span>
                    생성 중...
                  </>
                ) : (
                  '시간표 생성'
                )}
              </button>

              {generationStatus !== 'idle' && generationStatus !== 'generating' && (
                <button onClick={handleReset} className="reset-button">
                  초기화
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Generation Status Messages */}
        {generationStatus === 'generating' && (
          <div className="status-card generating">
            <div className="status-icon">
              <div className="spinner"></div>
            </div>
            <div className="status-content">
              <h3>시간표 생성 중...</h3>
              <p>교과목을 배정하고 있습니다. 잠시만 기다려주세요.</p>
            </div>
          </div>
        )}

        {generationStatus === 'success' && generationResult && (
          <div className="status-card success">
            <div className="status-icon">✓</div>
            <div className="status-content">
              <h3>생성 완료!</h3>
              <p>{generationResult.message}</p>
              {generationResult.scheduleCount !== undefined && (
                <p className="schedule-count">
                  총 <strong>{generationResult.scheduleCount}개</strong>의 일정이 생성되었습니다.
                </p>
              )}
              <button onClick={handleViewSchedule} className="view-button">
                시간표 보기
              </button>
            </div>
          </div>
        )}

        {generationStatus === 'error' && generationResult && (
          <div className="status-card error">
            <div className="status-icon">✗</div>
            <div className="status-content">
              <h3>생성 실패</h3>
              <p>{generationResult.message}</p>
              {generationResult.errors && generationResult.errors.length > 0 && (
                <div className="error-details">
                  <h4>오류 상세:</h4>
                  <ul>
                    {generationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="error-actions">
                <p className="error-hint">
                  교과목 정보, 선배정 일정, 교관 휴무일을 확인한 후 다시 시도해주세요.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
