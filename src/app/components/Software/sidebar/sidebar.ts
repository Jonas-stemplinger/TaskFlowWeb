import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Indexsite } from '../indexsite/indexsite';
import { Projectitem } from '../projectitem/projectitem';
import { TaskflowApiService } from '../../../services/taskflow-api.service';
import { Project } from '../../../models/project.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [Indexsite, Projectitem],
  styleUrl: './sidebar.scss',
  templateUrl: './sidebar.html'
})
export class Sidebar implements OnInit {
  private api = inject(TaskflowApiService);

  private cdr = inject(ChangeDetectorRef);

  //Standart Nutzer quasi festlegen, weil die Funktionen noch nicht drinnen sind. --> Sind jetzt drinnen
  userId: number = Number(sessionStorage.getItem('userId'));
  userName: string = String(sessionStorage.getItem('userName'));

  projekte: Project[] = [];

  ausgewaehltesProjekt: Project | null = null;

  popupSichtbar: boolean = false;
  ausgewaehltesProjektIndex: number | null = null;

  projectCreatePopupSichtbar: boolean = false;

  isLoading: boolean = false;

  errorMessage: string = '';

  constructor(private router: Router) {}


  ngOnInit(): void {

    this.projekteLaden();

  }

  projekteLaden(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.api.getProjects(this.userId).subscribe({

      next: (daten) => {

        console.log('API hat Projekte zurückgegeben:', daten);

        this.projekte = [...daten];

        this.isLoading = false;

        // Angular über die Änderung informieren
        this.cdr.markForCheck();

      },

      error: (error) => {

        console.error('Fehler beim Laden:', error);

        this.errorMessage = 'Projekte konnten nicht geladen werden.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }

    });

  }

  projektAuswaehlen(projekt: Project): void {

    this.ausgewaehltesProjekt = projekt;

    console.log('Projekt ausgewählt:', projekt);

  }

  projektPopupOeffnen(): void {
    this.projectCreatePopupSichtbar = true;
  }

  projektPopupschliesen(): void {
    this.projectCreatePopupSichtbar = false;
  }

  projektHinzufuegen(): void {

    const name = prompt('Wie soll dein Projekt heißen?');

    if (!name || !name.trim()) {
      return;
    }

    this.api.createProject(
      this.userId,
      {
        name: name.trim()
      }
    ).subscribe({

      next: (projekt) => {

        this.projekte = [
          ...this.projekte,
          projekt
        ];
        this.projektAuswaehlen(projekt);
      },

      error: (error) => {
        console.error(error);

        this.errorMessage = 'Projekt konnte nicht erstellt werden.';
      }

    });

  }

  TeamprojektHinzufuegen(): void {

    const name = prompt('Wie soll das Team-Projekt heißen?');

    if (!name || !name.trim()) {
      return;
    }

    this.api.createProject(
      this.userId,
      {
        name: name.trim()
      }
    ).subscribe({

      next: (projekt) => {
        this.projektAuswaehlen(projekt);
      },

      error: (error) => {
        console.error(error);

        this.errorMessage = 'Projekt konnte nicht erstellt werden.';
      }

    });

  }

  popupOeffnen(index: number): void {

    if (index < 0 || index >= this.projekte.length) {
      return;
    }

    this.ausgewaehltesProjektIndex = index;

    this.popupSichtbar = true;

  }
  popupSchliessen(): void {

    this.popupSichtbar = false;

    this.ausgewaehltesProjektIndex = null;

  }


  projektUmbenennen(): void {

    if (this.ausgewaehltesProjektIndex === null) {
      return;
    }

    const projekt = this.projekte[this.ausgewaehltesProjektIndex];

    if (!projekt) {
      return;
    }

    const neuerName = prompt('Neuer Projektname:', projekt.name);
    if (!neuerName || !neuerName.trim()) {
      return;
    }
    this.api.updateProject(this.userId, projekt.id, { name: neuerName.trim() } ).subscribe({
      next: () => {
        this.projekte = this.projekte.map(p => {
          if (p.id === projekt.id) {
            return {
              ...p, //Spread Operator: Er kopiert quasi alles in ein neues Objekt
              name: neuerName.trim()
            };
          }
          return p;
        });
        if (this.ausgewaehltesProjekt?.id === projekt.id) {
          this.ausgewaehltesProjekt = this.projekte.find(p => p.id === projekt.id) ?? null;
        }
        this.popupSchliessen();
      },

      error: (error) => {
        console.error(error);
        this.errorMessage = 'Projekt konnte nicht umbenannt werden.';
      }
    });
  }
  projektLoeschen(): void {
    if (this.ausgewaehltesProjektIndex === null) {
      return;
    }
    const projekt = this.projekte[this.ausgewaehltesProjektIndex];

    if (!projekt) {
      return;
    }
    const bestaetigung = confirm(`Projekt "${projekt.name}" inklusive Tasks und Todos löschen?`);

    if (!bestaetigung) {
      return;
    }

    this.api.deleteProject(this.userId, projekt.id).subscribe({
      next: () => {
        this.projekte = this.projekte.filter(p => p.id !== projekt.id);

        if (this.ausgewaehltesProjekt?.id === projekt.id) {

          this.ausgewaehltesProjekt = null;

        }
        this.popupSchliessen();
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Projekt konnte nicht gelöscht werden.';
      }
    });
  }
  startseiteAnzeigen(): void {
    this.ausgewaehltesProjekt = null;
  }





  goToLogout(): void {
    this.router.navigate(['/login']);
  }
}