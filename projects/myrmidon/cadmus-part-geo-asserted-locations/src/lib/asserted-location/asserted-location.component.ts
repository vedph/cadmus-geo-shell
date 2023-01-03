import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { Assertion } from '@myrmidon/cadmus-refs-assertion';

import {
  AssertedLocation,
  LocationBox,
  LocationPoint,
} from '../asserted-locations-part';

@Component({
  selector: 'cadmus-asserted-location',
  templateUrl: './asserted-location.component.html',
  styleUrls: ['./asserted-location.component.css'],
})
export class AssertedLocationComponent {
  private _location: AssertedLocation | undefined | null;

  @Input()
  public get location(): AssertedLocation | undefined | null {
    return this._location;
  }
  public set location(value: AssertedLocation | undefined | null) {
    this._location = value;
    this.updateForm(value);
  }

  // assertion-tags
  @Input()
  public assTagEntries?: ThesaurusEntry[] | undefined;

  // doc-reference-types
  @Input()
  public refTypeEntries: ThesaurusEntry[] | undefined;

  // doc-reference-tags
  @Input()
  public refTagEntries: ThesaurusEntry[] | undefined;

  @Output()
  public editorClose: EventEmitter<any>;
  @Output()
  public locationChange: EventEmitter<AssertedLocation>;

  // form
  public point: FormControl<LocationPoint | null>;
  public hasAltitude: FormControl<boolean>;
  public altitude: FormControl<number | null>;
  public hasBox: FormControl<boolean>;
  public box: FormControl<LocationBox | null>;
  public geometry: FormControl<string | null>;
  public hasAssertion: FormControl<boolean>;
  public assertion: FormControl<Assertion | null>;
  public form: FormGroup;

  public initialAssertion?: Assertion | null;

  constructor(formBuilder: FormBuilder) {
    this.point = formBuilder.control(null, Validators.required);
    this.hasAltitude = formBuilder.control(false, { nonNullable: true });
    this.altitude = formBuilder.control(null);
    this.hasBox = formBuilder.control(false, { nonNullable: true });
    this.box = formBuilder.control(null);
    this.geometry = formBuilder.control(null, {
      validators: Validators.maxLength(5000),
    });
    this.hasAssertion = formBuilder.control(false, { nonNullable: true });
    this.assertion = formBuilder.control(null);
    this.form = formBuilder.group({
      point: this.point,
      hasAltitude: this.hasAltitude,
      altitude: this.altitude,
      hasBox: this.hasBox,
      box: this.box,
      geometry: this.geometry,
      hasAssertion: this.hasAssertion,
      assertion: this.assertion,
    });
    // events
    this.editorClose = new EventEmitter<any>();
    this.locationChange = new EventEmitter<AssertedLocation>();
  }

  private updateForm(location: AssertedLocation | undefined | null): void {
    if (!location) {
      this.form.reset();
      return;
    }

    //this.initialPoint = location.point;
    this.point.setValue(location.point);
    this.hasBox.setValue(location.box?.a && location.box?.b ? true : false);
    if (this.hasBox.value) {
      this.box.setValue({
        a: location.box!.a,
        b: location.box!.b
      });
    }
    this.hasAssertion.setValue(location.assertion ? true : false);
    this.initialAssertion = location.assertion;

    this.hasAltitude.setValue(
      location.altitude !== undefined && location.altitude !== null
    );
    if (this.hasAltitude.value) {
      this.altitude.setValue(location.altitude!);
    }
    this.geometry.setValue(location.geometry || null);
    this.form.markAsPristine();
  }

  private getModel(): AssertedLocation {
    return {
      point: this.point.value!,
      altitude:
        this.hasAltitude && this.altitude.value !== null
          ? this.altitude.value
          : undefined,
      box: this.hasBox.value && this.box.value ? this.box.value : undefined,
      geometry: this.geometry.value?.trim() || undefined,
      assertion:
        this.hasAssertion.value && this.assertion.value
          ? this.assertion.value
          : undefined,
    };
  }

  public onPointChange(point: LocationPoint): void {
    this.point.setValue(point);
    this.point.markAsDirty();
    this.point.updateValueAndValidity();
  }

  public onPointAChange(point: LocationPoint): void {
    const box: LocationBox = {
      a: point,
      b: this.box.value?.b || { lat: 0, lon: 0 },
    };
    this.box.setValue(box);
    this.box.markAsDirty();
    this.box.updateValueAndValidity();
  }

  public onPointBChange(point: LocationPoint): void {
    const box: LocationBox = {
      a: this.box.value?.a || { lat: 0, lon: 0 },
      b: point,
    };
    this.box.setValue(box);
    this.box.markAsDirty();
    this.box.updateValueAndValidity();
  }

  public onAssertionChange(assertion?: Assertion): void {
    this.assertion.setValue(assertion || null);
    this.assertion.markAsDirty();
    this.assertion.updateValueAndValidity();
  }

  public close(): void {
    this.editorClose.emit();
  }

  public save(): void {
    if (this.form.invalid) {
      return;
    }
    this.locationChange.emit(this.getModel());
  }
}
