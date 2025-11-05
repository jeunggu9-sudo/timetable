import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { schoolHolidayService, SchoolHoliday } from '../services/schoolHolidayService';
import { showError, showSuccess } from '../utils/errorHandler';
import './SchoolHolidayPage.css';

export function SchoolHolidayPage() {
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('');
  const [startPeriod, setStartPeriod] = useState<number | ''>('');
  const [endPeriod, setEndPeriod] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const data = await schoolHolidayService.getHolidays();
      setHolidays(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      showError('날짜를 선택해주세요.');
      return;
    }

    try {
      await schoolHolidayService.createHoliday({
        date,
        startPeriod: startPeriod === '' ? null : startPeriod,
        endPeriod: endPeriod === '' ? null : endPeriod,
        description: description || null
      });
      
      showSuccess('휴관일이 등록되었습니다.');
      setDate('');
      setStartPeriod('');
      setEndPeriod('');
      setDescription('');
      fetchHolidays();
    } catch (error) {
      showError(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 휴관일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await schoolHolidayService.deleteHoliday(id);
      showSuccess('휴관일이 삭제되었습니다.');
      fetchHolidays();
    } catch (error) {
      showError(error);
    }
  };

  return (
    <div className="school-holiday-page">
      <div className="page-header">
        <h2>휴관일 관리</h2>
        <p>전체 휴관일(공휴일, 휴무일 등)을 관리합니다.</p>
      </div>

      <div className="holiday-form-card">
        <h3>휴관일 등록</h3>
        <form onSubmit={handleSubmit} className="holiday-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">날짜 *</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="startPeriod">시작 교시 (선택)</label>
              <select
                id="startPeriod"
                value={startPeriod}
                onChange={(e) => setStartPeriod(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">하루 전체</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(p => (
                  <option key={p} value={p}>{p}교시</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="endPeriod">종료 교시 (선택)</label>
              <select
                id="endPeriod"
                value={endPeriod}
                onChange={(e) => setEndPeriod(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">하루 전체</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(p => (
                  <option key={p} value={p}>{p}교시</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">설명 (선택)</label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 설날, 추석 등"
              />
            </div>
          </div>

          <button type="submit" className="submit-button">
            등록
          </button>
        </form>
      </div>

      <div className="holiday-list-card">
        <h3>등록된 휴관일</h3>
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : holidays.length === 0 ? (
          <div className="empty-message">등록된 휴관일이 없습니다.</div>
        ) : (
          <table className="holiday-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>교시</th>
                <th>설명</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map(holiday => (
                <tr key={holiday.id}>
                  <td>{format(new Date(holiday.date), 'yyyy-MM-dd (E)', { locale: ko })}</td>
                  <td>
                    {holiday.start_period && holiday.end_period
                      ? `${holiday.start_period}교시 - ${holiday.end_period}교시`
                      : '하루 전체'}
                  </td>
                  <td>{holiday.description || '-'}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(holiday.id)}
                      className="delete-button"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
