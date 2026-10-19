import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TaskflowApiService } from '../../../services/taskflow-api.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  styleUrl: './login-page.scss',
  templateUrl: './login-page.html'
})

export class LoginPage {

  private api = inject(TaskflowApiService);
  private router = inject(Router);

  email: string = '';
  password: string = '';

  errorMessage: string = '';
  isLoading: boolean = false;

  login(): void {

    this.errorMessage = '';
    this.isLoading = true;

    const request = {
      email: this.email,
      password: this.password
    };

    this.api.login(request).subscribe({

      next: (user) => {

        console.log('Login erfolgreich:', user);

        sessionStorage.setItem('userId', user.id.toString());
        sessionStorage.setItem('userName', user.name.toString());

        this.isLoading = false;

        this.router.navigate(['/dashboard']);

      },

      error: (error) => {

        console.error('Login fehlgeschlagen:', error);

        this.isLoading = false;

        if (error.status === 401) {
          this.errorMessage = 'E-Mail oder Passwort falsch.';
        } else {
          this.errorMessage = 'Verbindung zum Server fehlgeschlagen.';
        }

      }

    });

  }

}