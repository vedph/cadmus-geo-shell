import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssertedLocationsPartFeatureComponent } from './asserted-locations-part-feature.component';

describe('AssertedLocationsPartFeatureComponent', () => {
  let component: AssertedLocationsPartFeatureComponent;
  let fixture: ComponentFixture<AssertedLocationsPartFeatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AssertedLocationsPartFeatureComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(AssertedLocationsPartFeatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
