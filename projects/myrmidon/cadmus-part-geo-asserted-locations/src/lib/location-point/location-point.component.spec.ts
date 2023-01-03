import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationPointComponent } from './location-point.component';

describe('LocationPointComponent', () => {
  let component: LocationPointComponent;
  let fixture: ComponentFixture<LocationPointComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocationPointComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationPointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
