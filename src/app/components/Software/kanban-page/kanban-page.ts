import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-kanban-page',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './kanban-page.scss',
  templateUrl: './kanban-page.html'
})
export class KanbanPage {
  readonly projectId = inject(ActivatedRoute).snapshot.paramMap.get('projectId');
}