import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Indexsite } from '../indexsite/indexsite';
import { Projectitem } from '../projectitem/projectitem';
import { TaskflowApiService } from '../../../services/taskflow-api.service';
import { Project } from '../../../models/project.model';
import { Teamproject } from '../../../models/teamproject.model';
import { OnDestroy } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [Indexsite, Projectitem],
  styleUrl: './sidebar.scss',
  templateUrl: './sidebar.html'
})
export class Sidebar implements OnInit, OnDestroy {
  private api = inject(TaskflowApiService);

  private cdr = inject(ChangeDetectorRef);

  //Standart Nutzer quasi festlegen, weil die Funktionen noch nicht drinnen sind. --> Sind jetzt drinnen
  userId: number = Number(sessionStorage.getItem('userId'));
  userName: string = String(sessionStorage.getItem('userName'));

  projekte: Project[] = [];
  teamprojekte: Teamproject[] = [];

  ausgewaehltesProjekt: Project | null = null;
  ausgewaehltesTeamprojekt: Teamproject | null = null;

  ausgewaehltesTeamprojektIndex: number | null = null;

  teamprojektPopupSichtbar: boolean = false;

  popupSichtbar: boolean = false;
  ausgewaehltesProjektIndex: number | null = null;

  projectCreatePopupSichtbar: boolean = false;

  isLoading: boolean = false;

  errorMessage: string = '';

  private refreshSubscription?: Subscription;

  constructor(private router: Router) { }


  ngOnInit(): void {

    this.projekteLaden();

    this.teamprojekteLaden();

    this.refreshSubscription = interval(10000).subscribe(() => {
      this.teamprojekteLaden();
    });

  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
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

    this.ausgewaehltesTeamprojekt = null;

    console.log('Projekt ausgewählt:', projekt);

  }

  teamprojektPopupOeffnen(index: number): void {

    if (index < 0 || index >= this.teamprojekte.length) {
      return;
    }

    this.ausgewaehltesTeamprojektIndex = index;

    this.teamprojektPopupSichtbar = true;

  }

  teamprojektPopupSchliessen(): void {

    this.teamprojektPopupSichtbar = false;

    this.ausgewaehltesTeamprojektIndex = null;

  }

  teamprojektUmbenennen(): void {

    if (this.ausgewaehltesTeamprojektIndex === null) {
      return;
    }

    const projekt =
      this.teamprojekte[this.ausgewaehltesTeamprojektIndex];

    if (!projekt) {
      return;
    }

    const neuerName = prompt(
      'Neuer Teamprojektname:',
      projekt.name
    );

    if (!neuerName || !neuerName.trim()) {
      return;
    }

    const name = neuerName.trim();

    this.api.updateTeamproject(
      this.userId,
      projekt.id,
      { name }
    ).subscribe({

      next: () => {

        this.teamprojekte = this.teamprojekte.map(p =>
          p.id === projekt.id
            ? { ...p, name }
            : p
        );

        if (this.ausgewaehltesTeamprojekt?.id === projekt.id) {

          this.ausgewaehltesTeamprojekt =
            this.teamprojekte.find(p => p.id === projekt.id) ?? null;

        }

        this.teamprojektPopupSchliessen();

        this.cdr.markForCheck();
      },

      error: (error) => {

        console.error(error);

        this.errorMessage =
          'Teamprojekt konnte nicht umbenannt werden.';

        this.cdr.markForCheck();
      }

    });

  }

  teamprojektLoeschen(): void {

    if (this.ausgewaehltesTeamprojektIndex === null) {
      return;
    }

    const projekt =
      this.teamprojekte[this.ausgewaehltesTeamprojektIndex];

    if (!projekt) {
      return;
    }

    const bestaetigung = confirm(
      `Teamprojekt "${projekt.name}" wirklich löschen?\n\n` +
      `Alle Tasks und Todos werden gelöscht.\n` +
      `Das Projekt verschwindet bei ALLEN Mitgliedern.`
    );

    if (!bestaetigung) {
      return;
    }

    this.api.deleteTeamproject(
      this.userId,
      projekt.id
    ).subscribe({

      next: () => {

        this.teamprojekte = this.teamprojekte.filter(
          p => p.id !== projekt.id
        );

        if (this.ausgewaehltesTeamprojekt?.id === projekt.id) {

          this.ausgewaehltesTeamprojekt = null;

        }

        this.teamprojektPopupSchliessen();

        this.cdr.markForCheck();
      },

      error: (error) => {

        console.error(error);

        this.errorMessage =
          'Teamprojekt konnte nicht gelöscht werden.';

        this.cdr.markForCheck();
      }

    });

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

  teamprojekteLaden(): void {

    this.api.getTeamprojects(this.userId).subscribe({

      next: (daten) => {

        this.teamprojekte = [...daten];

        if (this.ausgewaehltesTeamprojekt) {

          const aktuellesProjekt = this.teamprojekte.find(
            p => p.id === this.ausgewaehltesTeamprojekt?.id
          );

          if (!aktuellesProjekt) {

            this.ausgewaehltesTeamprojekt = null;

          } else {

            this.ausgewaehltesTeamprojekt = aktuellesProjekt;

          }

        }

        this.cdr.markForCheck();
      },

      error: (error) => {

        console.error(error);

        this.errorMessage =
          'Teamprojekte konnten nicht geladen werden.';
      }

    });

  }

  TeamprojektHinzufuegen(): void {

    const name = prompt('Wie soll das Teamprojekt heißen?');

    if (!name || !name.trim()) {
      return;
    }

    const emails = prompt(
      'E-Mail-Adressen der Mitglieder (mit Komma trennen):'
    );

    if (emails === null) {
      return;
    }

    const usersListEmail = emails.split(',').map(email => email.trim()).filter(email => email.length > 0);

    this.api.createTeamproject(
      this.userId,
      {
        name: name.trim(),
        usersListEmail: usersListEmail
      }
    ).subscribe({

      next: (projekt) => {

        this.teamprojekte = [
          ...this.teamprojekte,
          projekt
        ];

        this.projectCreatePopupSichtbar = false;

        console.log('Teamprojekt erstellt:', projekt);
      },

      error: (error) => {

        console.error(error);

        this.errorMessage =
          'Teamprojekt konnte nicht erstellt werden.';
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
    this.api.updateProject(this.userId, projekt.id, { name: neuerName.trim() }).subscribe({
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

    this.ausgewaehltesTeamprojekt = null;

  }

  goToLogout(): void {
    this.router.navigate(['/login']);
  }

  teamprojektAuswaehlen(projekt: Teamproject): void {

    this.ausgewaehltesTeamprojekt = projekt;

    this.ausgewaehltesProjekt = null;

    console.log('Teamprojekt ausgewählt:', projekt);

  }

  mitgliedHinzufuegen(teamprojectId: number): void {

    const email = prompt(
      'E-Mail-Adresse des neuen Mitglieds:'
    );

    if (!email || !email.trim()) {
      return;
    }

    this.api.addTeamprojectMember(
      this.userId,
      teamprojectId,
      email.trim()
    ).subscribe({

      next: () => {
        alert('Mitglied erfolgreich hinzugefügt!');
      },

      error: (error) => {

        if (error.status === 404) {
          alert('Benutzer oder Teamprojekt nicht gefunden.');
        }
        else if (error.status === 409) {
          alert('Dieser Benutzer ist bereits Mitglied.');
        }
        else {
          alert('Mitglied konnte nicht hinzugefügt werden.');
        }

      }

    });

  }
}