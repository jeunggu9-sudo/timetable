import React, { useState, useMemo } from 'react';
import { CourseDisplay } from '../types/models';
import { EvaluationDisplayUtils } from '../utils/evaluationDisplayUtils';
import './CourseTable.css';

interface CourseTableProps {
  courses: CourseDisplay[];
  showActions?: boolean;
  onEdit?: (course: CourseDisplay) => void;
  onDelete?: (courseId: number) => void;
}

type SortField = '과목' | '시수' | '담당교관' | '평가' | '구분';
type SortDirection = 'asc' | 'desc';

const CourseTable: React.FC<CourseTableProps> = ({
  courses,
  showActions = false,
  onEdit,
  onDelete
}) => {
  const [sortField, setSortField] = useState<SortField>('과목');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [evaluationFilter, setEvaluationFilter] = useState<'all' | '평가' | '무시험'>('all');

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 필터링 및 정렬된 교과목 목록
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = [...courses];

    // 평가 필터 적용
    if (evaluationFilter !== 'all') {
      filtered = filtered.filter(course => course.평가 === evaluationFilter);
    }

    // 정렬 적용
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // 숫자 필드 처리
      if (sortField === '시수') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [courses, sortField, sortDirection, evaluationFilter]);

  // 정렬 아이콘 렌더링
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div className="course-table-container">
      {/* 필터 컨트롤 */}
      <div className="course-table-filters">
        <label>
          평가 필터:
          <select
            value={evaluationFilter}
            onChange={(e) => setEvaluationFilter(e.target.value as 'all' | '평가' | '무시험')}
            className="evaluation-filter-select"
          >
            <option value="all">전체</option>
            <option value="평가">평가</option>
            <option value="무시험">무시험</option>
          </select>
        </label>
        <span className="course-count">
          총 {filteredAndSortedCourses.length}개 교과목
        </span>
      </div>

      {/* 테이블 */}
      <div className="course-table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('구분')} className="sortable">
                구분{renderSortIcon('구분')}
              </th>
              <th onClick={() => handleSort('과목')} className="sortable">
                과목{renderSortIcon('과목')}
              </th>
              <th onClick={() => handleSort('시수')} className="sortable">
                시수{renderSortIcon('시수')}
              </th>
              <th onClick={() => handleSort('담당교관')} className="sortable">
                담당교관{renderSortIcon('담당교관')}
              </th>
              <th onClick={() => handleSort('평가')} className="sortable">
                평가{renderSortIcon('평가')}
              </th>
              <th>선배정</th>
              {showActions && <th>작업</th>}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedCourses.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 7 : 6} className="no-data">
                  교과목이 없습니다.
                </td>
              </tr>
            ) : (
              filteredAndSortedCourses.map((course) => (
                <tr key={course.id}>
                  <td>{course.구분}</td>
                  <td>{course.과목}</td>
                  <td className="text-center">{course.시수}</td>
                  <td>{course.담당교관}</td>
                  <td className="text-center">
                    <span
                      className={`course-table-evaluation-cell ${EvaluationDisplayUtils.getEvaluationStyleClass(
                        course.평가
                      )}`}
                    >
                      {course.평가}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`pre-assignment-badge ${course.선배정 === 1 ? 'pre-assign' : 'auto-assign'}`}>
                      {course.선배정 === 1 ? '선배정' : '자동배정'}
                    </span>
                  </td>
                  {showActions && (
                    <td className="actions-cell">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(course)}
                          className="btn-edit"
                          title="수정"
                        >
                          수정
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(course.id)}
                          className="btn-delete"
                          title="삭제"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseTable;
