export interface TaskItem {
  id: number;
  title: string;
  isCompleted: boolean;
  projectId: number;
}

export interface CreateTaskRequest {
  title: string;
  isCompleted: boolean;
}

export interface UpdateTaskRequest {
  title: string;
  isCompleted: boolean;
}