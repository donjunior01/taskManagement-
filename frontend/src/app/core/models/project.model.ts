export interface Project {
  id?: number;
  name: string;
  description?: string;
  managerId?: number;
  managerName?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  progress?: number;
  taskCount?: number;
  teamCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectRequest {
  name: string;
  description?: string;
  managerId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  progress?: number;
}
