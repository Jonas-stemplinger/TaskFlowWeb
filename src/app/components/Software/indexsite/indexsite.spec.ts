import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Indexsite } from './indexsite';
import { TaskflowApiService } from '../../../services/taskflow-api.service';

describe('Indexsite', () => {
  let component: Indexsite;
  let fixture: ComponentFixture<Indexsite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Indexsite],
    }).compileComponents();

    fixture = TestBed.createComponent(Indexsite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('removes only the selected todo from the dashboard', () => {
    const api = TestBed.inject(TaskflowApiService);
    const updateDashboard = vi.spyOn(api, 'updateDashboard').mockReturnValue(of(void 0));
    const selected = {
      todo: { id: 1, title: 'Selected', isCompleted: false, taskItemId: 10 },
      task: { id: 10, title: 'Task 1', isCompleted: false, projectId: 100 },
      project: { id: 100, name: 'Project', userId: 1 },
      priority: 'low'
    } as const;
    const other = {
      todo: { id: 2, title: 'Keep', isCompleted: false, taskItemId: 20 },
      task: { id: 20, title: 'Task 2', isCompleted: false, projectId: 100 },
      project: { id: 100, name: 'Project', userId: 1 },
      priority: 'high'
    } as const;
    component.boardTodos.set([selected, other]);

    component.todoVomDashboardEntfernen(selected);

    expect(component.boardTodos().map(entry => entry.todo.id)).toEqual([2]);
    expect(updateDashboard).toHaveBeenCalledTimes(1);
    expect(updateDashboard.mock.calls[0][1]).toEqual({
      todos: [{ todoId: 2, taskId: 20, priority: 'high', position: 0 }]
    });
  });
});
