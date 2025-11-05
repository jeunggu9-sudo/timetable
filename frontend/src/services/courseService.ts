import { apiClient, handleApiCall } from './api';

export interface Course {
  id: number;
  구분: string;
  과목: string;
  시수: number;
  담당교관: string;
  선배정: 1 | 2;
  평가: string;
  excel_order: number;
  created_at: string;
}

export interface Instructor {
  id: number;
  name: string;
  created_at: string;
}

export interface Schedule {
  id: number;
  course_id: number;
  instructor_id: number;
  date: string;
  start_period: number;
  end_period: number;
  is_pre_assigned: boolean;
  is_exam: boolean;
  created_at: string;
  course?: Course;
  instructor?: Instructor;
}

export interface CreateCourseRequest {
  구분: string;
  과목: string;
  시수: number;
  담당교관: string;
  선배정: 1 | 2;
  평가: string;
  excel_order?: number;
}

export interface UpdateCourseRequest {
  구분?: string;
  과목?: string;
  시수?: number;
  담당교관?: string;
  선배정?: 1 | 2;
  평가?: string;
  excel_order?: number;
}

export const courseService = {
  /**
   * 선배정 값으로 필터링된 교과목 목록 조회
   * @param preAssignment - 선배정 값 (1 또는 2)
   * @param displayFormat - true일 경우 평가 필드를 "평가"/"무시험"으로 변환
   */
  async getCoursesByPreAssignment(preAssignment: 1 | 2, displayFormat: boolean = false): Promise<Course[]> {
    const params = new URLSearchParams({ preAssignment: preAssignment.toString() });
    if (displayFormat) {
      params.append('displayFormat', 'true');
    }
    return handleApiCall(
      apiClient.get(`/courses?${params.toString()}`).then(res => res.data.courses)
    );
  },

  /**
   * 모든 교과목 조회
   * @param displayFormat - true일 경우 평가 필드를 "평가"/"무시험"으로 변환
   */
  async getAllCourses(displayFormat: boolean = false): Promise<Course[]> {
    const params = displayFormat ? '?displayFormat=true' : '';
    return handleApiCall(
      apiClient.get(`/courses${params}`).then(res => res.data.courses)
    );
  },

  /**
   * 특정 교과목 조회
   * @param id - 교과목 ID
   * @param displayFormat - true일 경우 평가 필드를 "평가"/"무시험"으로 변환
   */
  async getCourseById(id: number, displayFormat: boolean = false): Promise<Course> {
    const params = displayFormat ? '?displayFormat=true' : '';
    return handleApiCall(
      apiClient.get(`/courses/${id}${params}`).then(res => res.data.course)
    );
  },

  /**
   * 교과목 추가
   */
  async createCourse(data: CreateCourseRequest): Promise<Course> {
    return handleApiCall(
      apiClient.post('/courses', data).then(res => res.data.course)
    );
  },

  /**
   * 교과목 수정
   */
  async updateCourse(id: number, data: UpdateCourseRequest): Promise<Course> {
    return handleApiCall(
      apiClient.put(`/courses/${id}`, data).then(res => res.data.course)
    );
  },

  /**
   * 교과목 삭제
   */
  async deleteCourse(id: number): Promise<void> {
    return handleApiCall(
      apiClient.delete(`/courses/${id}`).then(() => undefined)
    );
  }
};
