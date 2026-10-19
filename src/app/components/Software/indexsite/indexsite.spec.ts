import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Indexsite } from './indexsite';

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
});
