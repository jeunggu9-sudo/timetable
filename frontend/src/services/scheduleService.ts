import { apiClient, handleApiCall } from './api';
import { Schedule } from './courseService';

export interface PreAssignmentRequest {
  courseId: number;
  instructorId: number;
  date: string;
  startPeriod: number;
  endPeriod: number;
}

export interface ScheduleQueryParams {
  startDate?: string;
  endDate?: string;
  displayFormat?: boolean;
}

export interface GenerateScheduleRequest {
  startDate: string;
}

export interface GenerateScheduleResult {
  success: boolean;
  message: string;
  scheduleCount?: number;
  errors?: string[];
}

export const scheduleService = {
  /**
   * 시간표 자동 생성
   */
  async generateSchedule(startDate: string): Promise<GenerateScheduleResult> {
    return handleApiCall(
      apiClient.post('/generate-schedule', { startDate }).then(res => res.data)
    );
  },

  /**
   * 선배정 일정 생성
   */
  async createPreAssignment(data: PreAssignmentRequest): Promise<Schedule> {
    return handleApiCall(
      apiClient.post('/schedules', data).then(res => res.data.schedule)
    );
  },

  /**
   * 시간표 조회
   * @param params - 조회 파라미터 (startDate, endDate, displayFormat)
   */
  async getSchedules(params?: ScheduleQueryParams): Promise<Schedule[]> {
    const queryParams: any = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.displayFormat) queryParams.displayFormat = 'true';
    
    const queryString = Object.keys(queryParams).length > 0
      ? `?${new URLSearchParams(queryParams).toString()}`
      : '';
    return handleApiCall(
      apiClient.get(`/schedules${queryString}`).then(res => res.data.schedules)
    );
  },

  /**
   * 교관별 시간표 조회
   * @param instructorId - 교관 ID
   * @param startDate - 시작 날짜 (optional)
   * @param endDate - 종료 날짜 (optional)
   * @param displayFormat - true일 경우 평가 필드를 "평가"/"무시험"으로 변환 (optional)
   */
  async getSchedulesByInstructor(
    instructorId: number,
    startDate?: string,
    endDate?: string,
    displayFormat?: boolean
  ): Promise<Schedule[]> {
    const params: any = { instructorId };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (displayFormat) params.displayFormat = 'true';
    
    const queryString = new URLSearchParams(params).toString();
    return handleApiCall(
      apiClient.get(`/schedules?${queryString}`).then(res => res.data.schedules)
    );
  },

  /**
   * 시간표 수정
   */
  async updateSchedule(id: number, data: { date: string; startPeriod: number; endPeriod: number }): Promise<Schedule> {
    return handleApiCall(
      apiClient.put(`/schedules/${id}`, data).then(res => res.data.schedule)
    );
  },

  /**
   * 시간표 삭제
   */
  async deleteSchedule(id: number): Promise<void> {
    return handleApiCall(
      apiClient.delete(`/schedules/${id}`).then(res => res.data)
    );
  }
};
