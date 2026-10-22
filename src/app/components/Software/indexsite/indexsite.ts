import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { DashboardPriority, DashboardTodoSetting, UpdateDashboardRequest } from '../../../models/dashboard.model';
import { Project } from '../../../models/project.model';
import { TaskItem } from '../../../models/task.model';
import { TodoItem } from '../../../models/todo.model';
import { TaskflowApiService } from '../../../services/taskflow-api.service';

interface DashboardTodo {
  todo: TodoItem;
  task: TaskItem;
  project: Project;
}

interface DashboardBoardTodo extends DashboardTodo {
  priority: DashboardPriority;
}

@Component({
  standalone: true,
  imports: [],
  selector: 'app-indexsite',
  styleUrl: './indexsite.scss',
  templateUrl: './indexsite.html',
})
export class Indexsite implements OnInit {
  private readonly api = inject(TaskflowApiService);
  private readonly userId = Number(sessionStorage.getItem('userId'));

  readonly priorities: { id: DashboardPriority; label: string }[] = [
    { id: 'low', label: 'Low-Prio' },
    { id: 'medium', label: 'Mid-Prio' },
    { id: 'high', label: 'High-Prio' }
  ];

  readonly availableTodos = signal<DashboardTodo[]>([]);
  readonly boardTodos = signal<DashboardBoardTodo[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly pickerPriority = signal<DashboardPriority | null>(null);

  readonly availableTodosForPicker = computed(() => {
    const displayedTodoIds = new Set(this.boardTodos().map(entry => entry.todo.id));
    return this.availableTodos().filter(entry => !displayedTodoIds.has(entry.todo.id));
  });

  private draggedTodoId: number | null = null;

  ngOnInit(): void {
    if (!Number.isInteger(this.userId) || this.userId <= 0) {
      this.isLoading.set(false);
      this.errorMessage.set('Bitte melde dich an, um das Dashboard zu laden.');
      return;
    }

    this.todosLaden().subscribe({
      next: todos => {
        this.availableTodos.set(todos);
        this.dashboardLaden();
      },
      error: error => {
        console.error('Fehler beim Laden der Dashboard-Todos:', error);
        this.isLoading.set(false);
        this.errorMessage.set('Todos konnten nicht geladen werden.');
      }
    });
  }

  todosFuerPrioritaet(priority: DashboardPriority): DashboardTodo[] {
    return this.boardTodos().filter(entry => entry.priority === priority);
  }

  priorityLabel(priority: DashboardPriority): string {
    return this.priorities.find(option => option.id === priority)?.label ?? priority;
  }

  todoAuswahlOeffnen(priority: DashboardPriority): void {
    this.pickerPriority.set(priority);
  }

  todoAuswahlSchliessen(): void {
    this.pickerPriority.set(null);
  }

  todoHinzufuegen(entry: DashboardTodo): void {
    const priority = this.pickerPriority();
    if (!priority || this.isSaving() || this.boardTodos().some(item => item.todo.id === entry.todo.id)) {
      return;
    }

    const previousBoard = this.boardTodos();
    this.updateBoard(
      [...previousBoard, { ...entry, priority }],
      previousBoard,
      () => this.todoAuswahlSchliessen()
    );
  }

  todoVomDashboardEntfernen(entry: DashboardTodo): void {
    if (this.isSaving()) {
      return;
    }

    const previousBoard = this.boardTodos();
    const updatedBoard = previousBoard.filter(item => item.todo.id !== entry.todo.id);
    if (updatedBoard.length === previousBoard.length) {
      return;
    }

    this.updateBoard(updatedBoard, previousBoard);
  }

  dragStart(todoId: number, event: DragEvent): void {
    if (this.isSaving()) {
      event.preventDefault();
      return;
    }

    this.draggedTodoId = todoId;
    event.dataTransfer?.setData('text/plain', String(todoId));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  dragEnd(): void {
    this.draggedTodoId = null;
  }

  dragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  todoAblegen(event: DragEvent, priority: DashboardPriority, targetTodoId?: number): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isSaving()) {
      return;
    }

    const todoId = this.draggedTodoId;
    this.draggedTodoId = null;
    if (todoId === null || todoId === targetTodoId) {
      return;
    }

    const previousBoard = this.boardTodos();
    const draggedTodo = previousBoard.find(entry => entry.todo.id === todoId);
    if (!draggedTodo) {
      return;
    }

    const remaining = previousBoard.filter(entry => entry.todo.id !== todoId);
    const destination = remaining.filter(entry => entry.priority === priority);
    const targetIndex = targetTodoId === undefined
      ? -1
      : destination.findIndex(entry => entry.todo.id === targetTodoId);
    const insertionIndex = targetIndex < 0 ? destination.length : targetIndex;
    destination.splice(insertionIndex, 0, { ...draggedTodo, priority });

    const updatedBoard = this.priorities.flatMap(option =>
      option.id === priority
        ? destination
        : remaining.filter(entry => entry.priority === option.id)
    );

    this.updateBoard(updatedBoard, previousBoard);
  }

  private dashboardLaden(): void {
    this.api.getDashboard(this.userId).subscribe({
      next: settings => {
        const todosById = new Map(this.availableTodos().map(entry => [entry.todo.id, entry]));
        const todos = settings
          .map(setting => {
            const entry = todosById.get(setting.todoId);
            return entry && entry.task.id === setting.taskId &&
              this.priorities.some(priority => priority.id === setting.priority)
              ? { ...entry, priority: setting.priority, position: setting.position }
              : null;
          })
          .filter((entry): entry is DashboardBoardTodo & { position: number } => entry !== null)
          .sort((a, b) =>
            this.priorities.findIndex(priority => priority.id === a.priority) -
              this.priorities.findIndex(priority => priority.id === b.priority) ||
            a.position - b.position
          )
          .map(entry => ({
            todo: entry.todo,
            task: entry.task,
            project: entry.project,
            priority: entry.priority
          }));

        this.boardTodos.set(todos);
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Fehler beim Laden der Dashboard-Einstellungen:', error);
        this.isLoading.set(false);
        this.errorMessage.set('Dashboard-Einstellungen konnten nicht aus der Datenbank geladen werden.');
      }
    });
  }

  private todosLaden(): Observable<DashboardTodo[]> {
    return this.api.getProjects(this.userId).pipe(
      switchMap(projects => {
        if (projects.length === 0) {
          return of([]);
        }

        return forkJoin(projects.map(project =>
          this.api.getTasks(project.id).pipe(
            map(tasks => tasks.map(task => ({ project, task })))
          )
        )).pipe(
          switchMap(taskGroups => {
            const taskContexts = taskGroups.flat();
            if (taskContexts.length === 0) {
              return of([]);
            }

            return forkJoin(taskContexts.map(({ project, task }) =>
              this.api.getTodos(task.id).pipe(
                map(todos => todos.map(todo => ({ todo, task, project })))
              )
            )).pipe(map(todoGroups => todoGroups.flat()));
          })
        );
      })
    );
  }

  private updateBoard(
    updatedBoard: DashboardBoardTodo[],
    previousBoard: DashboardBoardTodo[],
    onSuccess?: () => void
  ): void {
    this.boardTodos.set(updatedBoard);
    this.errorMessage.set('');
    this.isSaving.set(true);

    const request: UpdateDashboardRequest = {
      todos: this.settingsForBoard(updatedBoard)
    };
    this.api.updateDashboard(this.userId, request).subscribe({
      next: () => {
        this.isSaving.set(false);
        onSuccess?.();
      },
      error: error => {
        console.error('Fehler beim Speichern der Dashboard-Einstellungen:', error);
        this.boardTodos.set(previousBoard);
        this.isSaving.set(false);
        this.errorMessage.set('Dashboard-Einstellungen konnten nicht in der Datenbank gespeichert werden.');
      }
    });
  }

  private settingsForBoard(board: DashboardBoardTodo[]): DashboardTodoSetting[] {
    return this.priorities.flatMap(priority =>
      board
        .filter(entry => entry.priority === priority.id)
        .map((entry, position) => ({
          todoId: entry.todo.id,
          taskId: entry.task.id,
          priority: priority.id,
          position
        }))
    );
  }
}
