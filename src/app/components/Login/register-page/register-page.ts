import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TaskflowApiService } from '../../../services/taskflow-api.service';
import { CreateUserRequest } from '../../../models/user.model';

@Component({
  imports: [FormsModule],
  selector: 'app-register-page',
  styleUrl: './register-page.scss',
  templateUrl: './register-page.html',
})
export class RegisterPage {

  private api = inject(TaskflowApiService);
  private router = inject(Router);

  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  register(): void {

    this.errorMessage = '';
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Unterschiedliche Passwörter!';
      return;
    }

    this.isLoading = true;

    const request: CreateUserRequest = {
      name: this.name,
      email: this.email,
      password: this.password
    };

    this.api.register(request).subscribe({

      next: (user) => {

        console.log('Registrierung erfolgreich:', user);

        sessionStorage.setItem('userId', user.id.toString());
        sessionStorage.setItem('userName', user.name.toString());

        this.isLoading = false;

        this.router.navigate(['/dashboard']);

      },

      error: (error) => {

        console.error('Registrierung fehlgeschlagen:', error);

        this.isLoading = false;

        this.errorMessage = 'Registrierung fehlgeschlagen. Bitte Eingaben prüfen oder später erneut versuchen.';

      }

    });

  }

}
