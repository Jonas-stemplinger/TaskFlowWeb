import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { TaskflowApiService } from '../../../services/taskflow-api.service';
import { Project } from '../../../models/project.model';
import { Teamproject, TeamprojectMember } from '../../../models/teamproject.model';
import { TaskItem } from '../../../models/task.model';
import { TodoItem } from '../../../models/todo.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-projectitem',
  standalone: true,
  imports: [],
  styleUrl: './projectitem.scss',
  templateUrl: './projectitem.html'
})
export class Projectitem implements OnChanges {

  private api = inject(TaskflowApiService);
  private router = inject(Router);

  // Projekt aus der Sidebar
  @Input({ required: true })
  projekt!: Project | Teamproject;

  @Input()
  isTeamProject = false;

  @Input()
  userId = 0;

  // Signals
  tasks = signal<TaskItem[]>([]);

  ausgewaehlterTask = signal<TaskItem | null>(null);

  todos = signal<TodoItem[]>([]);

  tasksLaden = signal(false);
  todosLaden = signal(false);

  errorMessage = signal('');

  todoWirdGespeichert = signal<number | null>(null);

  membersPopupSichtbar = signal(false);

  members = signal<TeamprojectMember[]>([]);

  membersLaden = signal(false);

  memberEmail = '';

  membersError = signal('');

  // Verhindert, dass alte HTTP-Antworten
  // die Daten eines neu ausgewählten Projekts überschreiben.
  private projektVersion = 0;
  private taskAuswahlVersion = 0;


  ngOnChanges(changes: SimpleChanges): void {

    if ((changes['projekt'] || changes['isTeamProject']) && this.projekt) {

      this.projektVersion++;
      this.taskAuswahlVersion++;

      this.ausgewaehlterTask.set(null);

      this.tasks.set([]);
      this.todos.set([]);

      this.todosLaden.set(false);

      this.tasksAbrufen();

    }
  }

  openMembers(): void {

    if (!this.isTeamProject) {
      return;
    }

    this.membersPopupSichtbar.set(true);

    this.membersAbrufen();

  }

  closeMembers(): void {

    this.membersPopupSichtbar.set(false);

    this.membersError.set('');

  }

  membersAbrufen(): void {

    if (!this.isTeamProject) {
      return;
    }

    const projectId = this.projekt.id;

    this.membersLaden.set(true);

    this.membersError.set('');

    this.api.getTeamprojectMembers(
      this.userId,
      projectId
    ).subscribe({

      next: (daten) => {

        if (this.projekt.id !== projectId) {
          return;
        }

        this.members.set(daten);

        this.membersLaden.set(false);
      },

      error: (error) => {

        console.error(error);

        this.membersError.set(
          'Mitglieder konnten nicht geladen werden.'
        );

        this.membersLaden.set(false);
      }

    });

  }

  memberHinzufuegen(): void {

    const email = prompt(
      'E-Mail-Adresse des neuen Mitglieds:'
    );

    if (!email || !email.trim()) {
      return;
    }

    this.api.addTeamprojectMember(
      this.userId,
      this.projekt.id,
      email.trim()
    ).subscribe({

      next: () => {

        this.membersAbrufen();

      },

      error: (error) => {

        if (error.status === 404) {

          this.membersError.set(
            'Benutzer oder Teamprojekt nicht gefunden.'
          );

        } else if (error.status === 409) {

          this.membersError.set(
            'Dieser Benutzer ist bereits Mitglied.'
          );

        } else {

          this.membersError.set(
            'Mitglied konnte nicht hinzugefügt werden.'
          );

        }

      }

    });

  }

  memberEntfernen(member: TeamprojectMember): void {

    const bestaetigung = confirm(
      `Möchtest du "${member.name}" wirklich entfernen?`
    );

    if (!bestaetigung) {
      return;
    }

    this.api.removeTeamprojectMember(
      this.userId,
      this.projekt.id,
      member.id
    ).subscribe({

      next: () => {

        this.members.update(members =>
          members.filter(m => m.id !== member.id)
        );

        if (member.id === this.userId) {

          this.closeMembers();

          alert(
            'Du hast dich selbst aus dem Teamprojekt entfernt.'
          );

          // Die Sidebar muss anschließend
          // ihre Teamprojektliste aktualisieren.
        }

      },

      error: (error) => {

        console.error(error);

        this.membersError.set(
          'Mitglied konnte nicht entfernt werden.'
        );

      }

    });

  }

  tasksAbrufen(): void {

    const projectId = this.projekt.id;
    const version = this.projektVersion;

    this.tasksLaden.set(true);
    this.errorMessage.set('');

    const request = this.isTeamProject ? this.api.getTeamprojectTasks(projectId) : this.api.getTasks(projectId);

    request.subscribe({

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

  kanbanBoardAnzeigen(): void {
    this.router.navigate(['/kanban', this.projekt.id]);
  }

  taskHinzufuegen(): void {

    const title = prompt('Wie soll der Task heißen?');

    if (!title || !title.trim()) {
      return;
    }

    const projectId = this.projekt.id;
    const version = this.projektVersion;

    const request = {
      title: title.trim(),
      isCompleted: false
    };

    const createRequest = this.isTeamProject
      ? this.api.createTeamprojectTask(projectId, request)
      : this.api.createTask(projectId, request);

    createRequest.subscribe({

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