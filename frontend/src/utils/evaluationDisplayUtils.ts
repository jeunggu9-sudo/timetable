/**
 * EvaluationDisplayUtils
 * 
 * 평가 필드를 사용자 친화적인 형태로 변환하는 유틸리티
 * 데이터베이스에는 "0" 또는 "1"로 저장되지만, 사용자에게는 "무시험" 또는 "평가"로 표시
 */

import { Course, CourseDisplay } from '../types/models';

export class EvaluationDisplayUtils {
  /**
   * 데이터베이스 값을 사용자 친화적 텍스트로 변환
   * @param value - "0" 또는 "1" 문자열
   * @returns "무시험" 또는 "평가"
   */
  static formatEvaluationForDisplay(value: string): '평가' | '무시험' {
    return value === '1' ? '평가' : '무시험';
  }

  /**
   * Course 객체를 CourseDisplay 객체로 변환
   * @param course - 원본 Course 객체
   * @returns 표시용 CourseDisplay 객체
   */
  static convertCourseForDisplay(course: Course): CourseDisplay {
    return {
      ...course,
      평가: this.formatEvaluationForDisplay(course.평가)
    };
  }

  /**
   * Course 배열을 CourseDisplay 배열로 변환
   * @param courses - 원본 Course 배열
   * @returns 표시용 CourseDisplay 배열
   */
  static convertCoursesForDisplay(courses: Course[]): CourseDisplay[] {
    return courses.map(course => this.convertCourseForDisplay(course));
  }

  /**
   * 평가 필드에 따른 스타일 클래스 반환
   * @param evaluationValue - "평가" 또는 "무시험"
   * @returns CSS 클래스명
   */
  static getEvaluationStyleClass(evaluationValue: '평가' | '무시험'): string {
    return evaluationValue === '평가' 
      ? 'evaluation-required' 
      : 'evaluation-none';
  }
}
