import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Projectitem } from './projectitem';

describe('Projectitem', () => {
  let component: Projectitem;
  let fixture: ComponentFixture<Projectitem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Projectitem],
    }).compileComponents();

    fixture = TestBed.createComponent(Projectitem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
