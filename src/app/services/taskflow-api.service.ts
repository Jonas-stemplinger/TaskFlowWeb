import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserRequest, LoginRequest, LoginResponse } from '../models/user.model';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../models/project.model';
import { TaskItem, CreateTaskRequest, UpdateTaskRequest } from '../models/task.model';
import { TodoItem, CreateTodoRequest, UpdateTodoRequest } from '../models/todo.model';
import { errorContext } from 'rxjs/internal/util/errorContext';

@Injectable({
  providedIn: 'root'
})
export class TaskflowApiService {

  private http = inject(HttpClient);

  private apiUrl = 'https://localhost:7216/api';

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.apiUrl}/users`
    );
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(
      `${this.apiUrl}/users/${userId}`
    );
  }

  createUser(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(
      `${this.apiUrl}/users`,
      request
    );
  }

  getProjects(userId: number): Observable<Project[]> {
    return this.http.get<Project[]>(
      `${this.apiUrl}/users/${userId}/projects`
    );
  }

  createProject(userId: number, request: CreateProjectRequest): Observable<Project> {

    return this.http.post<Project>(`${this.apiUrl}/users/${userId}/projects`, request);
  }

  deleteProject(userId: number, projectId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}/projects/${projectId}`);
  }

  updateProject(userId: number, projectId: number, request: UpdateProjectRequest): Observable<void> {

    return this.http.put<void>(
      `${this.apiUrl}/users/${userId}/projects/${projectId}`,
      request
    );
  }

  getTasks(projectId: number): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(
      `${this.apiUrl}/projects/${projectId}/tasks`
    );
  }

  createTask(
    projectId: number,
    request: CreateTaskRequest
  ): Observable<TaskItem> {
    return this.http.post<TaskItem>(
      `${this.apiUrl}/projects/${projectId}/tasks`,
      request
    );
  }

  updateTask(
    taskId: number,
    request: UpdateTaskRequest
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/tasks/${taskId}`,
      request
    );
  }

  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/tasks/${taskId}`
    );
  }


  getTodos(taskId: number): Observable<TodoItem[]> {
    return this.http.get<TodoItem[]>(
      `${this.apiUrl}/tasks/${taskId}/todos`
    );
  }

  createTodo(
    taskId: number,
    request: CreateTodoRequest
  ): Observable<TodoItem> {
    return this.http.post<TodoItem>(
      `${this.apiUrl}/tasks/${taskId}/todos`,
      request
    );
  }

  deleteTodo(taskId: number, todoId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/tasks/${taskId}/todos/${todoId}`
    );
  }

  updateTodo(taskId: number, todoId: number, request: UpdateTodoRequest): Observable<void> {

    return this.http.put<void>(
      `${this.apiUrl}/tasks/${taskId}/todos/${todoId}`,
      request
    );
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, request, { withCredentials: true });
  }

  register(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, request, { withCredentials: true });
  }
}