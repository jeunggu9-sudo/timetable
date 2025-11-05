import { apiClient, handleApiCall } from './api';

export interface Instructor {
  id: number;
  name: string;
  created_at: string;
}

export interface OffDay {
  id: number;
  instructor_id: number;
  date: string;
  reason?: string;
  created_at: string;
  instructor?: Instructor;
}

export interface CreateOffDayRequest {
  instructorId: number;
  date: string;
}

export const instructorService = {
  // Get all instructors
  async getInstructors(): Promise<Instructor[]> {
    return handleApiCall(
      apiClient.get<{ instructors: Instructor[] }>('/instructors')
        .then(response => response.data.instructors)
    );
  },

  // Alias for getInstructors
  async getAllInstructors(): Promise<Instructor[]> {
    return this.getInstructors();
  },

  // Get off days for a specific instructor
  async getOffDays(instructorId?: number): Promise<OffDay[]> {
    const params = instructorId ? { instructorId } : {};
    return handleApiCall(
      apiClient.get<{ offDays: OffDay[] }>('/off-days', { params })
        .then(response => response.data.offDays)
    );
  },

  // Add a new off day
  async addOffDay(data: CreateOffDayRequest): Promise<OffDay> {
    return handleApiCall(
      apiClient.post<{ success: boolean; offDay: OffDay }>('/off-days', data)
        .then(response => response.data.offDay)
    );
  },

  // Delete an off day
  async deleteOffDay(offDayId: number): Promise<void> {
    return handleApiCall(
      apiClient.delete(`/off-days/${offDayId}`)
        .then(() => undefined)
    );
  },
};
