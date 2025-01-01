import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssertedToponymsPartFeatureComponent } from './asserted-toponyms-part-feature.component';

describe('AssertedToponymsPartFeatureComponent', () => {
  let component: AssertedToponymsPartFeatureComponent;
  let fixture: ComponentFixture<AssertedToponymsPartFeatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AssertedToponymsPartFeatureComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(AssertedToponymsPartFeatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
