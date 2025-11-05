import { useState, useEffect } from 'react';
import { instructorService, Instructor, OffDay } from '../services/instructorService';
import { showError, showSuccess } from '../utils/errorHandler';
import './InstructorOffDayPage.css';

// Upload-related interfaces
interface UploadResult {
  success: boolean;
  message: string;
  offDayCount?: number;
  instructorOffDays?: InstructorOffDaysSummary[];
}

interface InstructorOffDaysSummary {
  instructorName: string;
  offDays: {
    date: string;
    reason: string;
  }[];
}

export function InstructorOffDayPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [offDays, setOffDays] = useState<OffDay[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingOffDays, setLoadingOffDays] = useState(false);
  
  // Excel upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showUploadResult, setShowUploadResult] = useState(false);

  // Load instructors on mount
  useEffect(() => {
    loadInstructors();
  }, []);

  // Load off days when instructor is selected
  useEffect(() => {
    if (selectedInstructor) {
      loadOffDays(selectedInstructor.id);
    } else {
      setOffDays([]);
    }
  }, [selectedInstructor]);

  const loadInstructors = async () => {
    try {
      setLoading(true);
      const data = await instructorService.getInstructors();
      setInstructors(data);
    } catch (error) {
      showError(error, '교관 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadOffDays = async (instructorId: number) => {
    try {
      setLoadingOffDays(true);
      const data = await instructorService.getOffDays(instructorId);
      setOffDays(data);
    } catch (error) {
      showError(error, '휴무일 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoadingOffDays(false);
    }
  };

  const handleInstructorSelect = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setStartDate('');
    setEndDate('');
  };

  const handleAddOffDay = async () => {
    if (!selectedInstructor) {
      showError('교관을 먼저 선택해주세요.');
      return;
    }

    if (!startDate) {
      showError('시작 날짜를 선택해주세요.');
      return;
    }

    if (!endDate) {
      showError('종료 날짜를 선택해주세요.');
      return;
    }

    // 날짜 유효성 검사
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      showError('시작 날짜는 종료 날짜보다 이전이어야 합니다.');
      return;
    }

    try {
      setLoading(true);
      
      // 시작일부터 종료일까지 모든 날짜에 대해 휴무일 추가
      const dates: string[] = [];
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 각 날짜에 대해 휴무일 추가
      let successCount = 0;
      let errorCount = 0;

      for (const date of dates) {
        try {
          await instructorService.addOffDay({
            instructorId: selectedInstructor.id,
            date: date,
          });
          successCount++;
        } catch (error) {
          // 이미 존재하는 날짜는 무시
          errorCount++;
        }
      }

      if (successCount > 0) {
        showSuccess(`${successCount}개의 휴무일이 추가되었습니다.`);
      }
      
      if (errorCount > 0) {
        showError(`${errorCount}개의 날짜는 이미 등록되어 있습니다.`);
      }

      setStartDate('');
      setEndDate('');
      await loadOffDays(selectedInstructor.id);
    } catch (error) {
      showError(error, '휴무일 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffDay = async (offDayId: number) => {
    if (!confirm('이 휴무일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await instructorService.deleteOffDay(offDayId);
      showSuccess('휴무일이 삭제되었습니다.');
      if (selectedInstructor) {
        await loadOffDays(selectedInstructor.id);
      }
    } catch (error) {
      showError(error, '휴무일 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${year}-${month}-${day} (${dayOfWeek})`;
  };

  // Excel upload functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadResult(null);
      setShowUploadResult(false);
    }
  };

  const handleUploadExcel = async () => {
    if (!uploadFile) {
      showError('파일을 선택해주세요.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await fetch('/api/instructors/upload-off-days', {
        method: 'POST',
        body: formData,
      });

      const result: UploadResult = await response.json();

      if (result.success) {
        setUploadResult(result);
        setShowUploadResult(true);
        showSuccess(result.message);
        
        // Refresh instructors and off days
        await loadInstructors();
        if (selectedInstructor) {
          await loadOffDays(selectedInstructor.id);
        }
        
        // Clear file input
        setUploadFile(null);
        const fileInput = document.getElementById('excel-file') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        showError(result.message);
      }
    } catch (error) {
      showError(error, '파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/instructors/off-days-template');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '교관휴무일_업로드양식.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess('템플릿 파일이 다운로드되었습니다.');
      } else {
        showError('템플릿 다운로드에 실패했습니다.');
      }
    } catch (error) {
      showError(error, '템플릿 다운로드에 실패했습니다.');
    }
  };

  const getTotalOffDays = (): number => {
    if (!uploadResult?.instructorOffDays) return 0;
    return uploadResult.instructorOffDays.reduce((total, instructor) => total + instructor.offDays.length, 0);
  };

  const getInstructorCount = (): number => {
    return uploadResult?.instructorOffDays?.length || 0;
  };

  return (
    <div className="instructor-offday-page">
      <div className="page-header">
        <h2>교관 휴무일 관리</h2>
        <p>교관별 휴무일을 등록하고 관리할 수 있습니다.</p>
      </div>

      <div className="content-container">
        {/* Excel Upload Section */}
        <div className="upload-section">
          <h3>📤 엑셀 파일 업로드</h3>
          <p className="section-description">
            교관 휴무일 정보가 담긴 엑셀 파일을 업로드하세요. 파일에는 '이름', '시작날짜', '종료날짜' 컬럼이 필요합니다.
          </p>
          
          <div className="upload-controls">
            <button 
              className="btn-template"
              onClick={handleDownloadTemplate}
              disabled={uploading}
            >
              📥 양식 다운로드
            </button>
            
            <div className="file-input-wrapper">
              <input
                type="file"
                id="excel-file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={uploading}
                className="file-input"
              />
              <label htmlFor="excel-file" className="file-input-label">
                {uploadFile ? uploadFile.name : '파일 선택'}
              </label>
            </div>
            
            <button
              className="btn-upload"
              onClick={handleUploadExcel}
              disabled={!uploadFile || uploading}
            >
              {uploading ? '업로드 중...' : '업로드'}
            </button>
          </div>
        </div>

        {/* Upload Result Section */}
        {showUploadResult && uploadResult && uploadResult.success && (
          <div className="upload-result-section">
            <div className="result-header">
              <h3>✅ 업로드 결과</h3>
              <button 
                className="btn-close"
                onClick={() => setShowUploadResult(false)}
                title="닫기"
              >
                ✕
              </button>
            </div>
            
            <div className="result-summary">
              <div className="summary-item">
                <span className="summary-label">교관 수:</span>
                <span className="summary-value">{getInstructorCount()}명</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">총 휴무일:</span>
                <span className="summary-value">{getTotalOffDays()}일</span>
              </div>
            </div>

            <div className="result-details">
              <h4>교관별 휴무일 내역</h4>
              {uploadResult.instructorOffDays && uploadResult.instructorOffDays.length > 0 ? (
                <div className="instructor-offdays-list">
                  {uploadResult.instructorOffDays.map((instructor, index) => (
                    <div key={index} className="instructor-offdays-item">
                      <div className="instructor-header">
                        <span className="instructor-name-badge">{instructor.instructorName}</span>
                        <span className="offdays-count">{instructor.offDays.length}일</span>
                      </div>
                      <div className="offdays-grid">
                        {instructor.offDays.map((offDay, dayIndex) => (
                          <div key={dayIndex} className="offday-badge">
                            <span className="offday-date-text">{formatDate(offDay.date)}</span>
                            {offDay.reason && (
                              <span className="offday-reason-text">({offDay.reason})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">업로드된 휴무일 정보가 없습니다.</p>
              )}
            </div>
          </div>
        )}

        {/* Instructor List Section */}
        <div className="instructor-section">
          <h3>교관 목록</h3>
          {loading && !selectedInstructor ? (
            <div className="loading">교관 목록을 불러오는 중...</div>
          ) : instructors.length === 0 ? (
            <div className="empty-state">
              <p>등록된 교관이 없습니다.</p>
              <p className="hint">엑셀 업로드 페이지에서 교관 정보를 업로드할 수 있습니다.</p>
            </div>
          ) : (
            <div className="instructor-list">
              {instructors.map((instructor) => (
                <button
                  key={instructor.id}
                  className={`instructor-item ${
                    selectedInstructor?.id === instructor.id ? 'selected' : ''
                  }`}
                  onClick={() => handleInstructorSelect(instructor)}
                >
                  <span className="instructor-name">{instructor.name}</span>
                  {selectedInstructor?.id === instructor.id && (
                    <span className="selected-indicator">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Off Days Section */}
        <div className="offday-section">
          {selectedInstructor ? (
            <>
              <h3>{selectedInstructor.name} 교관 휴무일</h3>

              {/* Add Off Day Form */}
              <div className="add-offday-form">
                <div className="form-group">
                  <label>휴무일 기간 추가</label>
                  <div className="date-range-group">
                    <div className="date-input-wrapper">
                      <label htmlFor="start-date" className="date-label">시작일</label>
                      <input
                        type="date"
                        id="start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <span className="date-separator">~</span>
                    <div className="date-input-wrapper">
                      <label htmlFor="end-date" className="date-label">종료일</label>
                      <input
                        type="date"
                        id="end-date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        disabled={loading}
                        min={startDate}
                      />
                    </div>
                    <button
                      className="btn-add"
                      onClick={handleAddOffDay}
                      disabled={loading || !startDate || !endDate}
                    >
                      {loading ? '추가 중...' : '추가'}
                    </button>
                  </div>
                  <p className="hint-text">시작일부터 종료일까지 모든 날짜가 휴무일로 등록됩니다.</p>
                </div>
              </div>

              {/* Off Days List */}
              <div className="offday-list-container">
                {loadingOffDays ? (
                  <div className="loading">휴무일 목록을 불러오는 중...</div>
                ) : offDays.length === 0 ? (
                  <div className="empty-state">
                    <p>등록된 휴무일이 없습니다.</p>
                  </div>
                ) : (
                  <div className="offday-list">
                    {offDays
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((offDay) => (
                        <div key={offDay.id} className="offday-item">
                          <div className="offday-info">
                            <span className="offday-date">{formatDate(offDay.date)}</span>
                            {offDay.reason && (
                              <span className="offday-reason">사유: {offDay.reason}</span>
                            )}
                          </div>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteOffDay(offDay.id)}
                            disabled={loading}
                            title="삭제"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>교관을 선택해주세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
