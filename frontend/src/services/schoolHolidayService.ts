import { apiClient, handleApiCall } from './api';

export interface SchoolHoliday {
  id: number;
  date: string;
  start_period: number | null;
  end_period: number | null;
  description: string | null;
  created_at: string;
}

export interface CreateSchoolHolidayRequest {
  date: string;
  startPeriod?: number | null;
  endPeriod?: number | null;
  description?: string | null;
}

export const schoolHolidayService = {
  /**
   * 휴관일 조회
   */
  async getHolidays(startDate?: string, endDate?: string): Promise<SchoolHoliday[]> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const queryString = Object.keys(params).length > 0
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    
    return handleApiCall(
      apiClient.get(`/school-holidays${queryString}`).then(res => res.data.holidays)
    );
  },

  /**
   * 휴관일 생성
   */
  async createHoliday(data: CreateSchoolHolidayRequest): Promise<SchoolHoliday> {
    return handleApiCall(
      apiClient.post('/school-holidays', data).then(res => res.data.holiday)
    );
  },

  /**
   * 휴관일 삭제
   */
  async deleteHoliday(id: number): Promise<void> {
    return handleApiCall(
      apiClient.delete(`/school-holidays/${id}`).then(res => res.data)
    );
  }
};
