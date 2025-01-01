import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssertedLocationComponent } from './asserted-location.component';

describe('AssertedLocationComponent', () => {
  let component: AssertedLocationComponent;
  let fixture: ComponentFixture<AssertedLocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AssertedLocationComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(AssertedLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
