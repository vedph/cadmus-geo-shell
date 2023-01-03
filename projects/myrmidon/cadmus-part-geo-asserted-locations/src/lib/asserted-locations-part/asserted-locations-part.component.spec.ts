import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssertedLocationsPartComponent } from './asserted-locations-part.component';

describe('AssertedLocationsPartComponent', () => {
  let component: AssertedLocationsPartComponent;
  let fixture: ComponentFixture<AssertedLocationsPartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssertedLocationsPartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssertedLocationsPartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
