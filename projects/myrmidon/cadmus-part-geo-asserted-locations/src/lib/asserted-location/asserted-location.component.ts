import { Component, effect, input, model, output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { Assertion, AssertionComponent } from '@myrmidon/cadmus-refs-assertion';
import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';

import {
  AssertedLocation,
  LocationBox,
  LocationPoint,
} from '../asserted-locations-part';
import { LocationPointComponent } from '../location-point/location-point.component';

/**
 * Editor for a location with an optional assertion.
 */
@Component({
  selector: 'cadmus-asserted-location',
  templateUrl: './asserted-location.component.html',
  styleUrls: ['./asserted-location.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LocationPointComponent,
    MatCheckbox,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatSelect,
    MatOption,
    AssertionComponent,
    MatIconButton,
    MatTooltip,
    MatIcon,
  ],
})
export class AssertedLocationComponent {
  /**
   * The location being edited.
   */
  public readonly location = model<AssertedLocation>();

  // geo-location-tags
  public readonly locTagEntries = input<ThesaurusEntry[]>();
  // assertion-tags
  public readonly assTagEntries = input<ThesaurusEntry[]>();
  // doc-reference-types
  public readonly refTypeEntries = input<ThesaurusEntry[]>();
  // doc-reference-tags
  public readonly refTagEntries = input<ThesaurusEntry[]>();

  public readonly lookupProviderOptions = input<
    LookupProviderOptions | undefined
  >();

  /**
   * Emitted when the editor is closed.
   */
  public readonly editorClose = output();

  // form
  public point: FormControl<LocationPoint | null>;
  public hasAltitude: FormControl<boolean>;
  public altitude: FormControl<number | null>;
  public hasBox: FormControl<boolean>;
  public box: FormControl<LocationBox | null>;
  public geometry: FormControl<string | null>;
  public hasAssertion: FormControl<boolean>;
  public assertion: FormControl<Assertion | null>;
  public tag: FormControl<string | null>;
  public form: FormGroup;

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
    this.tag = formBuilder.control(null, Validators.maxLength(50));
    this.form = formBuilder.group({
      point: this.point,
      hasAltitude: this.hasAltitude,
      altitude: this.altitude,
      hasBox: this.hasBox,
      box: this.box,
      geometry: this.geometry,
      hasAssertion: this.hasAssertion,
      assertion: this.assertion,
      tag: this.tag,
    });

    effect(() => {
      this.updateForm(this.location());
    });
  }

  private updateForm(location: AssertedLocation | undefined | null): void {
    if (!location) {
      this.form.reset();
      return;
    }

    this.point.setValue(location.point);
    this.hasBox.setValue(location.box?.a && location.box?.b ? true : false);
    if (this.hasBox.value) {
      this.box.setValue({
        a: location.box!.a,
        b: location.box!.b,
      });
    }
    this.hasAssertion.setValue(location.assertion ? true : false);
    this.assertion.setValue(location.assertion || null);

    this.hasAltitude.setValue(
      location.altitude !== undefined && location.altitude !== null,
    );
    if (this.hasAltitude.value) {
      this.altitude.setValue(location.altitude!);
    }
    this.geometry.setValue(location.geometry || null);
    this.tag.setValue(location.tag || null);
    this.form.markAsPristine();
  }

  private getLocation(): AssertedLocation {
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
      tag: this.tag.value?.trim(),
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
    this.location.set(this.getLocation());
  }
}
