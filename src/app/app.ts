import { Component, signal } from '@angular/core';
import { Sidebar } from './components/Software/sidebar/sidebar';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('Task Flow Web');
}
