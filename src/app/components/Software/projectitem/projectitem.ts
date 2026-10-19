import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { TaskflowApiService } from '../../../services/taskflow-api.service';
import { Project } from '../../../models/project.model';
import { TaskItem } from '../../../models/task.model';
import { TodoItem } from '../../../models/todo.model';

@Component({
  selector: 'app-projectitem',
  standalone: true,
  imports: [],
  styleUrl: './projectitem.scss',
  templateUrl: './projectitem.html'
})
export class Projectitem implements OnChanges {

  private api = inject(TaskflowApiService);

  // Projekt aus der Sidebar
  @Input({ required: true })
  projekt!: Project;

  // Signals
  tasks = signal<TaskItem[]>([]);

  ausgewaehlterTask = signal<TaskItem | null>(null);

  todos = signal<TodoItem[]>([]);

  tasksLaden = signal(false);
  todosLaden = signal(false);

  errorMessage = signal('');

  // Verhindert doppelte API-Anfragen quasi wenn man mit signals arbeitet
  taskWirdGespeichert = signal<number | null>(null);
  todoWirdGespeichert = signal<number | null>(null);

  // Verhindert, dass alte HTTP-Antworten
  // die Daten eines neu ausgewählten Projekts überschreiben.
  private projektVersion = 0;
  private taskAuswahlVersion = 0;


  ngOnChanges(changes: SimpleChanges): void {

    if (changes['projekt'] && this.projekt) {

      this.projektVersion++;
      this.taskAuswahlVersion++;

      this.ausgewaehlterTask.set(null);

      this.tasks.set([]);
      this.todos.set([]);

      this.todosLaden.set(false);

      this.tasksAbrufen();

    }

  }


  tasksAbrufen(): void {

    const projectId = this.projekt.id;
    const version = this.projektVersion;

    this.tasksLaden.set(true);
    this.errorMessage.set('');

    this.api.getTasks(projectId).subscribe({

      next: (daten) => {

        if (
          this.projekt.id !== projectId ||
          this.projektVersion !== version
        ) {
          return;
        }

        this.tasks.set(daten);

        this.tasksLaden.set(false);

        console.log('Tasks geladen:', daten);

        // Ersten Task automatisch auswählen
        if (daten.length > 0) {

          this.taskAuswaehlen(daten[0]);

        }

      },

      error: (error) => {

        if (
          this.projekt.id !== projectId ||
          this.projektVersion !== version
        ) {
          return;
        }

        console.error('Fehler beim Laden der Tasks:', error);

        this.errorMessage.set(
          'Tasks konnten nicht geladen werden.'
        );

        this.tasksLaden.set(false);

      }

    });

  }

  taskAuswaehlen(task: TaskItem): void {

    this.taskAuswahlVersion++;

    this.ausgewaehlterTask.set(task);

    this.todos.set([]);

    this.todosAbrufen();

  }

  taskHinzufuegen(): void {

    const title = prompt('Wie soll der Task heißen?');

    if (!title || !title.trim()) {
      return;
    }

    const projectId = this.projekt.id;
    const version = this.projektVersion;

    this.api.createTask(
      projectId,
      {
        title: title.trim(),
        isCompleted: false
      }
    ).subscribe({

      next: (task) => {

        if (
          this.projekt.id !== projectId ||
          this.projektVersion !== version
        ) {
          return;
        }

        this.tasks.update(tasks => [
          ...tasks,
          task
        ]);

        // Neuen Task direkt auswählen
        this.taskAuswaehlen(task);

      },

      error: (error) => {

        console.error('Fehler beim Erstellen:', error);

        this.errorMessage.set(
          'Task konnte nicht erstellt werden.'
        );

      }

    });

  }

  taskUmbenennen(): void {

    const task = this.ausgewaehlterTask();

    if (!task) {
      return;
    }

    const neuerTitel = prompt(
      'Neuer Taskname:',
      task.title
    );

    if (!neuerTitel || !neuerTitel.trim()) {
      return;
    }

    const title = neuerTitel.trim();

    this.api.updateTask(
      task.id,
      {
        title: title,
        isCompleted: task.isCompleted
      }
    ).subscribe({

      next: () => {

        // Task-Liste aktualisieren
        this.tasks.update(tasks =>
          tasks.map(t =>
            t.id === task.id
              ? { ...t, title: title }
              : t
          )
        );

        // Ausgewählten Task aktualisieren
        this.ausgewaehlterTask.update(aktuell => {

          if (aktuell?.id === task.id) {

            return {
              ...aktuell,
              title: title
            };

          }

          return aktuell;

        });

      },

      error: (error) => {

        console.error('Fehler beim Umbenennen:', error);

        this.errorMessage.set(
          'Task konnte nicht umbenannt werden.'
        );

      }

    });

  }

  taskStatusAendern(task: TaskItem): void {

    // Keine mehrfachen Klicks während des Speicherns
    if (this.taskWirdGespeichert() !== null) {
      return;
    }

    const neuerStatus = !task.isCompleted;

    this.taskWirdGespeichert.set(task.id);

    this.api.updateTask(
      task.id,
      {
        title: task.title,
        isCompleted: neuerStatus
      }
    ).subscribe({

      next: () => {

        // Task-Liste aktualisieren
        this.tasks.update(tasks =>
          tasks.map(t =>
            t.id === task.id
              ? {
                  ...t,
                  isCompleted: neuerStatus
                }
              : t
          )
        );

        // Ausgewählten Task aktualisieren
        this.ausgewaehlterTask.update(aktuell => {

          if (aktuell?.id === task.id) {

            return {
              ...aktuell,
              isCompleted: neuerStatus
            };

          }

          return aktuell;

        });

        this.taskWirdGespeichert.set(null);

      },

      error: (error) => {

        console.error('Fehler beim Task-Status:', error);

        this.errorMessage.set(
          'Task-Status konnte nicht gespeichert werden.'
        );

        this.taskWirdGespeichert.set(null);

      }

    });

  }

  taskLoeschen(task: TaskItem): void {

    if (!confirm(`Task "${task.title}" löschen?`)) {
      return;
    }

    this.api.deleteTask(task.id).subscribe({

      next: () => {

        // Task aus Liste entfernen
        this.tasks.update(tasks =>
          tasks.filter(t => t.id !== task.id)
        );

        // War dieser Task ausgewählt?
        if (this.ausgewaehlterTask()?.id === task.id) {

          this.taskAuswahlVersion++;

          this.ausgewaehlterTask.set(null);
          this.todos.set([]);
          this.todosLaden.set(false);

          // Nächsten Task auswählen
          const ersterTask = this.tasks()[0];
          if (ersterTask) {
            this.taskAuswaehlen(ersterTask);
          }
        }
      },
      error: (error) => {

        console.error('Fehler beim Löschen:', error);

        this.errorMessage.set(
          'Task konnte nicht gelöscht werden.'
        );

      }

    });

  }


  todosAbrufen(): void {

    const task = this.ausgewaehlterTask();

    if (!task) {
      return;
    }

    const taskId = task.id;
    const version = this.taskAuswahlVersion;
    const projektVersion = this.projektVersion;

    this.todosLaden.set(true);

    this.api.getTodos(taskId).subscribe({

      next: (daten) => {

        // Nur die Antwort des aktuell
        // ausgewählten Tasks übernehmen.
        if (
          this.ausgewaehlterTask()?.id !== taskId ||
          this.taskAuswahlVersion !== version ||
          this.projektVersion !== projektVersion
        ) {
          return;
        }

        this.todos.set(daten);

        this.todosLaden.set(false);

        console.log('Todos geladen:', daten);

      },

      error: (error) => {

        if (
          this.ausgewaehlterTask()?.id !== taskId ||
          this.taskAuswahlVersion !== version ||
          this.projektVersion !== projektVersion
        ) {
          return;
        }

        console.error('Fehler beim Laden der Todos:', error);

        this.errorMessage.set(
          'Todos konnten nicht geladen werden.'
        );

        this.todosLaden.set(false);

      }

    });

  }

  todoHinzufuegen(): void {

    const task = this.ausgewaehlterTask();

    if (!task) {

      alert('Bitte zuerst einen Task auswählen.');
      return;

    }

    const title = prompt('Wie soll das Todo heißen?');

    if (!title || !title.trim()) {
      return;
    }

    this.api.createTodo(
      task.id,
      {
        title: title.trim(),
        isCompleted: false
      }
    ).subscribe({

      next: (todo) => {

        // Nur hinzufügen, wenn derselbe Task
        // noch ausgewählt ist.
        if (this.ausgewaehlterTask()?.id === task.id) {

          this.todos.update(todos => [
            ...todos,
            todo
          ]);

        }

      },

      error: (error) => {

        console.error('Fehler beim Erstellen:', error);

        this.errorMessage.set(
          'Todo konnte nicht erstellt werden.'
        );

      }

    });

  }

  todoStatusAendern(todo: TodoItem): void {

    const task = this.ausgewaehlterTask();

    if (!task) {
      return;
    }

    if (this.todoWirdGespeichert() !== null) {
      return;
    }

    const neuerStatus = !todo.isCompleted;

    this.todoWirdGespeichert.set(todo.id);

    this.api.updateTodo(
      task.id,
      todo.id,
      {
        title: todo.title,
        isCompleted: neuerStatus
      }
    ).subscribe({

      next: () => {

        this.todos.update(todos =>
          todos.map(t =>
            t.id === todo.id
              ? {
                  ...t,
                  isCompleted: neuerStatus
                }
              : t
          )
        );

        this.todoWirdGespeichert.set(null);

      },

      error: (error) => {

        console.error('Fehler beim Todo-Status:', error);

        this.errorMessage.set(
          'Todo-Status konnte nicht gespeichert werden.'
        );

        this.todoWirdGespeichert.set(null);

      }

    });

  }

  todoLoeschen(todo: TodoItem): void {

    const task = this.ausgewaehlterTask();

    if (!task) {
      return;
    }

    this.api.deleteTodo(
      task.id,
      todo.id
    ).subscribe({

      next: () => {

        if (this.ausgewaehlterTask()?.id === task.id) {

          this.todos.update(todos =>
            todos.filter(t => t.id !== todo.id)
          );

        }

      },

      error: (error) => {

        console.error('Fehler beim Löschen:', error);

        this.errorMessage.set(
          'Todo konnte nicht gelöscht werden.'
        );

      }

    });

  }

}