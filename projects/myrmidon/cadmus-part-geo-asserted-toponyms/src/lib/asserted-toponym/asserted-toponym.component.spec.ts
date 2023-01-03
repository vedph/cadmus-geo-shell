import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssertedToponymComponent } from './asserted-toponym.component';

describe('AssertedToponymComponent', () => {
  let component: AssertedToponymComponent;
  let fixture: ComponentFixture<AssertedToponymComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssertedToponymComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssertedToponymComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
