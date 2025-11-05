import { useState } from 'react';
import { apiClient, handleApiCall } from '../services/api';
import { Course, CourseDisplay } from '../types/models';
import CourseTable from '../components/CourseTable';
import { showError, showSuccess } from '../utils/errorHandler';
import './UploadPage.css';

interface UploadResult {
  success: boolean;
  message: string;
  courseCount?: number;
  instructorCount?: number;
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

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
type UploadType = 'courses' | 'offdays';

export function UploadPage() {
  const [uploadType, setUploadType] = useState<UploadType>('courses');
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [courses, setCourses] = useState<CourseDisplay[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // 파일 형식 검증
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        const errorMsg = '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다';
        setErrorMessage(errorMsg);
        showError(errorMsg);
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setErrorMessage('');
      setUploadStatus('idle');
      setUploadResult(null);
      setCourses([]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      const errorMsg = '파일을 선택해주세요';
      setErrorMessage(errorMsg);
      showError(errorMsg);
      return;
    }

    setUploadStatus('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = uploadType === 'courses' ? '/upload' : '/instructors/upload-off-days';
      const response = await handleApiCall(
        apiClient.post<UploadResult>(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );

      setUploadResult(response.data);
      setUploadStatus('success');
      showSuccess(response.data.message || '파일이 성공적으로 업로드되었습니다.');

      // 교과목 업로드인 경우에만 교과목 목록 조회
      if (uploadType === 'courses') {
        await fetchCourses();
      }
    } catch (error: any) {
      setUploadStatus('error');
      const message = error.message || '파일 업로드 중 오류가 발생했습니다';
      setErrorMessage(message);
      showError(error, '파일 업로드');
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await handleApiCall(
        apiClient.get<{ courses: Course[] }>('/courses', {
          params: { displayFormat: 'true' }
        })
      );
      // API가 displayFormat=true로 이미 변환된 데이터를 반환하므로 그대로 사용
      setCourses(response.data.courses as CourseDisplay[] || []);
    } catch (error: any) {
      console.error('Failed to fetch courses:', error);
      showError(error, '교과목 목록 조회');
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadStatus('idle');
    setUploadResult(null);
    setCourses([]);
    setErrorMessage('');
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.get('/instructors/off-days-template', {
        responseType: 'blob'
      });

      // 파일 다운로드
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', '교관휴무일_업로드양식.xlsx');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('양식 파일이 다운로드되었습니다.');
    } catch (error) {
      console.error('Template download error:', error);
      showError('양식 파일 다운로드에 실패했습니다.');
    }
  };

  const totalHours = courses.reduce((sum, course) => sum + course.시수, 0);

  return (
    <div className="upload-page">
      <h2>📤 엑셀 파일 업로드</h2>
      
      {/* 업로드 타입 선택 */}
      <div className="upload-type-selection">
        <div className="upload-type-tabs">
          <button
            className={`upload-type-tab ${uploadType === 'courses' ? 'active' : ''}`}
            onClick={() => {
              setUploadType('courses');
              handleReset();
            }}
          >
            📚 교과목 업로드
          </button>
          <button
            className={`upload-type-tab ${uploadType === 'offdays' ? 'active' : ''}`}
            onClick={() => {
              setUploadType('offdays');
              handleReset();
            }}
          >
            📅 교관 휴무일 업로드
          </button>
        </div>
      </div>

      <p className="description">
        {uploadType === 'courses' 
          ? '교과목 정보가 담긴 엑셀 파일을 업로드하세요. 파일에는 \'구분\', \'과목\', \'시수\', \'담당교관\', \'선배정\', \'평가\' 컬럼이 포함되어야 합니다.'
          : '교관 휴무일 정보가 담긴 엑셀 파일을 업로드하세요. 파일에는 \'이름\', \'시작날짜\', \'종료날짜\', \'비고\' 컬럼이 포함되어야 합니다.'
        }
      </p>

      {/* 양식 다운로드 섹션 */}
      {uploadType === 'offdays' && (
        <div className="template-section">
          <div className="template-info">
            <span className="template-icon">📄</span>
            <div className="template-text">
              <p>엑셀 양식을 다운로드하여 참고하세요.</p>
              <p className="template-hint">양식에는 예시 데이터가 포함되어 있습니다.</p>
            </div>
            <button 
              className="template-download-btn"
              onClick={handleDownloadTemplate}
            >
              📥 양식 다운로드
            </button>
          </div>
        </div>
      )}

      <div className="upload-section">
        <div className="file-input-wrapper">
          <input
            type="file"
            id="file-input"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            disabled={uploadStatus === 'uploading'}
            className="file-input"
          />
          <label htmlFor="file-input" className="file-input-label">
            {file ? file.name : '파일 선택'}
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploadStatus === 'uploading'}
          className="upload-button"
        >
          {uploadStatus === 'uploading' ? '업로드 중...' : '업로드'}
        </button>

        {uploadStatus !== 'idle' && (
          <button onClick={handleReset} className="reset-button">
            초기화
          </button>
        )}
      </div>

      {uploadStatus === 'uploading' && (
        <div className="status-message uploading">
          <div className="spinner"></div>
          <span>파일을 업로드하고 있습니다...</span>
        </div>
      )}

      {uploadStatus === 'success' && uploadResult && (
        <div className="status-message success">
          <span className="icon">✓</span>
          <div>
            <strong>{uploadResult.message}</strong>
            {uploadType === 'courses' ? (
              <p>교과목 {uploadResult.courseCount}개, 교관 {uploadResult.instructorCount}명이 등록되었습니다.</p>
            ) : (
              <p>교관 휴무일 {uploadResult.offDayCount}개가 등록되었습니다.</p>
            )}
          </div>
        </div>
      )}

      {uploadStatus === 'error' && errorMessage && (
        <div className="status-message error">
          <span className="icon">✗</span>
          <div>
            <strong>업로드 실패</strong>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && uploadStatus === 'idle' && (
        <div className="status-message error">
          <span className="icon">✗</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {courses.length > 0 && uploadType === 'courses' && (
        <div className="preview-section">
          <h3>📋 업로드된 교과목 목록</h3>
          
          <div className="summary-info">
            <div className="summary-item">
              <span className="summary-label">총 교과목 수:</span>
              <span className="summary-value">{courses.length}개</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">총 시수:</span>
              <span className="summary-value">{totalHours}시간</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">선배정 대상:</span>
              <span className="summary-value">
                {courses.filter(c => c.선배정 === 1).length}개
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">자동 배정 대상:</span>
              <span className="summary-value">
                {courses.filter(c => c.선배정 === 2).length}개
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">평가 대상:</span>
              <span className="summary-value">
                {courses.filter(c => c.평가 === '평가').length}개
              </span>
            </div>
          </div>

          <CourseTable courses={courses} showActions={false} />
        </div>
      )}

      {uploadStatus === 'success' && uploadType === 'offdays' && uploadResult?.instructorOffDays && uploadResult.instructorOffDays.length > 0 && (
        <div className="preview-section">
          <h3>📋 업로드된 교관 휴무일 정보</h3>
          
          <div className="summary-info">
            <div className="summary-item">
              <span className="summary-label">교관 수:</span>
              <span className="summary-value">{uploadResult.instructorOffDays.length}명</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">총 휴무일:</span>
              <span className="summary-value">
                {uploadResult.instructorOffDays.reduce((total, instructor) => total + instructor.offDays.length, 0)}일
              </span>
            </div>
          </div>

          <div className="instructor-offdays-container">
            {uploadResult.instructorOffDays.map((instructor, index) => (
              <div key={index} className="instructor-offdays-card">
                <div className="instructor-card-header">
                  <span className="instructor-name-badge">{instructor.instructorName}</span>
                  <span className="offdays-count-badge">{instructor.offDays.length}일</span>
                </div>
                <div className="offdays-grid">
                  {instructor.offDays.map((offDay, dayIndex) => (
                    <div key={dayIndex} className="offday-item-card">
                      <span className="offday-date">{formatDate(offDay.date)}</span>
                      {offDay.reason && (
                        <span className="offday-reason">({offDay.reason})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 날짜 포맷 함수
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${year}-${month}-${day} (${dayOfWeek})`;
}
