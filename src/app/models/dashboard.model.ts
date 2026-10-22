export type DashboardPriority = 'low' | 'medium' | 'high';

export interface DashboardTodoSetting {
  todoId: number;
  taskId: number;
  priority: DashboardPriority;
  position: number;
}

export interface UpdateDashboardRequest {
  todos: DashboardTodoSetting[];
}
