export interface TodoItem {
  id: number;
  title: string;
  isCompleted: boolean;
  taskItemId: number;
}

export interface CreateTodoRequest {
  title: string;
  isCompleted: boolean;
}

export interface UpdateTodoRequest {
  title: string;
  isCompleted: boolean;
}