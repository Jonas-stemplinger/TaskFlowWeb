import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { TodoItem } from '../../../models/todo.model';
import { TaskflowApiService } from '../../../services/taskflow-api.service';

type BoardPriority = 'low' | 'medium' | 'high';

interface TodoOption {
  todo: TodoItem;
  taskTitle: string;
}

interface BoardTodo extends TodoOption {
  priority: BoardPriority;
}

@Component({
  selector: 'app-indexsite',
  styleUrl: './indexsite.scss',
  templateUrl: './indexsite.html',
})
export class Indexsite implements OnInit {
  private api = inject(TaskflowApiService);

  readonly allTodos = signal<TodoOption[]>([]);
  readonly boardTodos = signal<BoardTodo[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly todoPickerPriority = signal<BoardPriority | null>(null);
  readonly availableTodos = computed(() => {
    const addedTodoKeys = new Set(this.boardTodos().map(item => this.todoKey(item.todo)));
    return this.allTodos().filter(item => !addedTodoKeys.has(this.todoKey(item.todo)));
  });

  private draggedTodoKey: string | null = null;

  ngOnInit(): void {
    this.todosLaden();
  }

  todosInPriority(priority: BoardPriority): BoardTodo[] {
    return this.boardTodos().filter(item => item.priority === priority);
  }

  todoPickerOeffnen(priority: BoardPriority): void {
    this.todoPickerPriority.set(priority);
  }

  todoPickerSchliessen(): void {
    this.todoPickerPriority.set(null);
  }

  todoHinzufuegen(option: TodoOption): void {
    const priority = this.todoPickerPriority();
    if (!priority || this.boardTodos().some(item => this.todoKey(item.todo) === this.todoKey(option.todo))) {
      return;
    }

    this.boardTodos.update(items => [...items, { ...option, priority }]);
  }

  todoZiehen(option: TodoOption, event: DragEvent): void {
    this.draggedTodoKey = this.todoKey(option.todo);
    event.dataTransfer?.setData('text/plain', this.draggedTodoKey);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  ablageErlauben(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  todoAblegen(priority: BoardPriority, event: DragEvent): void {
    event.preventDefault();
    const todoKey = event.dataTransfer?.getData('text/plain') || this.draggedTodoKey;

    if (todoKey) {
      this.boardTodos.update(items =>
        items.map(item => this.todoKey(item.todo) === todoKey ? { ...item, priority } : item)
      );
    }

    this.draggedTodoKey = null;
  }

  todoKey(todo: TodoItem): string {
    return `${todo.taskItemId}:${todo.id}`;
  }

  private todosLaden(): void {
    const userId = Number(sessionStorage.getItem('userId'));
    if (!Number.isInteger(userId) || userId <= 0) {
      this.errorMessage.set('Benutzer konnte nicht ermittelt werden. Bitte erneut anmelden.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.api.getProjects(userId).pipe(
      switchMap(projects => {
        if (projects.length === 0) {
          return of([] as TodoOption[]);
        }

        return forkJoin(projects.map(project => this.api.getTasks(project.id))).pipe(
          switchMap(taskGroups => {
            const tasks = taskGroups.flat();
            if (tasks.length === 0) {
              return of([] as TodoOption[]);
            }

            return forkJoin(tasks.map(task =>
              this.api.getTodos(task.id).pipe(
                map(todos => todos.map(todo => ({ todo, taskTitle: task.title })))
              )
            )).pipe(map(todoGroups => todoGroups.flat()));
          })
        );
      })
    ).subscribe({
      next: todos => {
        this.allTodos.set(todos);
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Fehler beim Laden vorhandener Todos:', error);
        this.errorMessage.set('Vorhandene Todos konnten nicht geladen werden.');
        this.isLoading.set(false);
      }
    });
  }
}
