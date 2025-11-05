import { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, getDay, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Schedule } from '../services/courseService';
import { scheduleService } from '../services/scheduleService';
import { showError } from '../utils/errorHandler';
// @ts-ignore - jsPDF와 html2canvas는 npm install 후 사용 가능
import jsPDF from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';
import './SchedulePrintPage.css';

interface WeekData {
  weekStart: Date;
  days: (Date | null)[];
}

export function SchedulePrintPage() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await scheduleService.getSchedules({ startDate, endDate });
      setSchedules(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchSchedules();
    }
  }, [startDate, endDate]);

  const handlePrint = async () => {
    if (!printContentRef.current) return;
    
    setGenerating(true);
    
    try {
      // HTML을 캔버스로 변환
      const canvas = await html2canvas(printContentRef.current, {
        scale: 2, // 고해상도
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // 캔버스를 이미지로 변환
      const imgData = canvas.toDataURL('image/png');
      
      // PDF 생성 (A4 가로)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // A4 가로 크기 (297mm x 210mm)
      const pdfWidth = 297;
      const pdfHeight = 210;
      
      // 이미지 비율 계산
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      
      // PDF에 맞게 이미지 크기 조정
      let finalWidth = pdfWidth;
      let finalHeight = pdfWidth / ratio;
      
      // 높이가 PDF 높이를 초과하는 경우 페이지 분할
      if (finalHeight > pdfHeight) {
        const totalPages = Math.ceil(finalHeight / pdfHeight);
        
        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          
          const sourceY = (imgHeight / totalPages) * i;
          const sourceHeight = imgHeight / totalPages;
          
          // 캔버스의 일부를 잘라서 새 캔버스에 그리기
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgWidth;
          pageCanvas.height = sourceHeight;
          const pageCtx = pageCanvas.getContext('2d');
          
          if (pageCtx) {
            pageCtx.drawImage(
              canvas,
              0, sourceY, imgWidth, sourceHeight,
              0, 0, imgWidth, sourceHeight
            );
            
            const pageImgData = pageCanvas.toDataURL('image/png');
            pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          }
        }
      } else {
        // 한 페이지에 들어가는 경우
        pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);
      }

      // PDF 다운로드
      const fileName = `시간표_${format(new Date(startDate), 'yyyyMMdd')}_${format(new Date(endDate), 'yyyyMMdd')}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      showError('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  // 날짜별 스케줄 맵 생성
  const scheduleMap = new Map<string, Schedule[]>();
  schedules.forEach(schedule => {
    if (!scheduleMap.has(schedule.date)) {
      scheduleMap.set(schedule.date, []);
    }
    scheduleMap.get(schedule.date)!.push(schedule);
  });

  // 주간 단위로 데이터 그룹화
  const generateWeeklyData = (): WeekData[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const weeks: WeekData[] = [];
    
    let currentDate = start;
    
    while (currentDate <= end) {
      // 현재 날짜가 속한 주의 월요일 찾기
      let weekStart = currentDate;
      while (getDay(weekStart) !== 1) {
        weekStart = addDays(weekStart, -1);
      }
      
      // 이미 처리한 주인지 확인
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      if (weeks.some(w => format(w.weekStart, 'yyyy-MM-dd') === weekStartStr)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }
      
      // 월~금 날짜 생성
      const days: (Date | null)[] = [];
      for (let i = 0; i < 5; i++) {
        const day = addDays(weekStart, i);
        // 선택한 날짜 범위 내에 있는 날짜만 포함
        if (day >= start && day <= end) {
          days.push(day);
        } else {
          days.push(null);
        }
      }
      
      weeks.push({ weekStart, days });
      
      // 다음 주로 이동
      currentDate = addDays(weekStart, 7);
    }
    
    return weeks;
  };

  const weeklyData = generateWeeklyData();
  const dayNames = ['월', '화', '수', '목', '금'];

  // 교과목별 배정시간 계산
  const calculateCourseSummary = () => {
    const courseSummary = new Map<string, { 
      courseName: string; 
      regularHours: number; 
      examHours: number;
      instructor: string;
    }>();

    schedules.forEach(schedule => {
      const courseName = schedule.course?.과목 || '';
      const instructor = schedule.instructor?.name || '';
      const hours = schedule.end_period - schedule.start_period + 1;
      const key = `${courseName}_${instructor}`;

      if (!courseSummary.has(key)) {
        courseSummary.set(key, {
          courseName,
          regularHours: 0,
          examHours: 0,
          instructor
        });
      }

      const summary = courseSummary.get(key)!;
      if (schedule.is_exam) {
        summary.examHours += hours;
      } else {
        summary.regularHours += hours;
      }
    });

    return Array.from(courseSummary.values()).sort((a, b) => 
      a.courseName.localeCompare(b.courseName)
    );
  };

  const courseSummary = calculateCourseSummary();

  return (
    <div className="schedule-print-page">
      <div className="print-controls no-print">
        <h2>시간표 출력</h2>
        <div className="date-selector">
          <div className="form-group">
            <label>시작 날짜:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>종료 날짜:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button 
            onClick={handlePrint} 
            className="print-button"
            disabled={generating || loading}
          >
            {generating ? '📄 PDF 생성 중...' : '📄 PDF 다운로드'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading no-print">로딩 중...</div>
      ) : (
        <div className="print-content" ref={printContentRef}>
          <div className="print-header">
            <h1>교육 과정 시간표</h1>
            <p className="print-period">
              {format(new Date(startDate), 'yyyy년 M월 d일', { locale: ko })} ~ {format(new Date(endDate), 'M월 d일', { locale: ko })}
            </p>
          </div>

          <table className="schedule-table">
            <thead>
              <tr>
                <th className="date-column">날짜</th>
                {dayNames.map(day => (
                  <th key={day} className="day-column">{day}요일</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeklyData.map((week, weekIndex) => (
                <tr key={weekIndex}>
                  <td className="date-cell">
                    {format(week.weekStart, 'M/d', { locale: ko })}
                  </td>
                  {week.days.map((day, dayIndex) => {
                    if (!day) {
                      return (
                        <td key={dayIndex} className="schedule-cell empty">
                          <div className="empty-cell">-</div>
                        </td>
                      );
                    }
                    
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const daySchedules = scheduleMap.get(dateStr) || [];
                    
                    return (
                      <td key={dayIndex} className="schedule-cell">
                        {daySchedules.length > 0 ? (
                          <div className="day-schedules">
                            {daySchedules.map(schedule => (
                              <div key={schedule.id} className="schedule-item">
                                <div className="schedule-course">
                                  {schedule.is_exam && <span className="exam-label">[평가] </span>}
                                  {schedule.course?.과목}
                                </div>
                                <div className="schedule-instructor">
                                  {schedule.instructor?.name}
                                </div>
                                <div className="schedule-period">
                                  {schedule.start_period}~{schedule.end_period}교시
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-cell">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* 교과목별 배정시간 요약 */}
          <div className="summary-section">
            <h2 className="summary-title">교과목별 배정시간</h2>
            <table className="summary-table">
              <thead>
                <tr>
                  <th className="summary-course-column">교과목</th>
                  <th className="summary-instructor-column">담당교관</th>
                  <th className="summary-hours-column">수업시간</th>
                  <th className="summary-exam-column">평가시간</th>
                  <th className="summary-total-column">총 시간</th>
                </tr>
              </thead>
              <tbody>
                {courseSummary.map((summary, index) => (
                  <tr key={index}>
                    <td className="summary-course">{summary.courseName}</td>
                    <td className="summary-instructor">{summary.instructor}</td>
                    <td className="summary-hours">{summary.regularHours}시간</td>
                    <td className="summary-exam">
                      {summary.examHours > 0 ? `${summary.examHours}시간` : '-'}
                    </td>
                    <td className="summary-total">
                      {summary.regularHours + summary.examHours}시간
                    </td>
                  </tr>
                ))}
                {courseSummary.length === 0 && (
                  <tr>
                    <td colSpan={5} className="summary-empty">
                      배정된 스케줄이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="summary-total-row">
                  <td colSpan={2} className="summary-label">전체 합계</td>
                  <td className="summary-hours">
                    {courseSummary.reduce((sum, s) => sum + s.regularHours, 0)}시간
                  </td>
                  <td className="summary-exam">
                    {courseSummary.reduce((sum, s) => sum + s.examHours, 0)}시간
                  </td>
                  <td className="summary-total">
                    {courseSummary.reduce((sum, s) => sum + s.regularHours + s.examHours, 0)}시간
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
