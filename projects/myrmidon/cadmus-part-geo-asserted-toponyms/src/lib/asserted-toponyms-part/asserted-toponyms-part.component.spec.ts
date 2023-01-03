import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssertedToponymsPartComponent } from './asserted-toponyms-part.component';

describe('AssertedToponymsPartComponent', () => {
  let component: AssertedToponymsPartComponent;
  let fixture: ComponentFixture<AssertedToponymsPartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssertedToponymsPartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssertedToponymsPartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
