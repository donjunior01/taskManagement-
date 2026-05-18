export interface Task {
  id?: number;
  name: string;
  description?: string;
  projectId?: number;
  projectName?: string;
  assignedToId?: number;
  assignedToName?: string;
  createdById?: number;
  createdByName?: string;
  priority?: string;
  difficulty?: string;
  status?: string;
  progress?: number;
  deadline?: string;
  reminderType?: string;
  commentCount?: number;
  totalHoursLogged?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskRequest {
  name: string;
  description?: string;
  projectId?: number;
  assignedToId?: number;
  priority?: string;
  difficulty?: string;
  status?: string;
  progress?: number;
  deadline?: string;
  reminderType?: string;
}
