import { Component, effect, input, model, output, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

import { MatCheckbox } from '@angular/material/checkbox';
import {
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
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
import { GeoLocation, GeoLocationEditor } from '@myrmidon/cadmus-geo-location';

import { AssertedLocation } from '../asserted-locations-part';

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
    MatCheckbox,
    MatError,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription,
    MatFormField,
    MatInput,
    MatLabel,
    MatOption,
    MatIconButton,
    MatSelect,
    MatTooltip,
    MatIcon,
    AssertionComponent,
    GeoLocationEditor,
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

  public readonly locationExpanded = signal<boolean>(false);

  // form
  public value: FormControl<GeoLocation | null>;
  public hasAssertion: FormControl<boolean>;
  public assertion: FormControl<Assertion | null>;
  public tag: FormControl<string | null>;
  public form: FormGroup;

  constructor(formBuilder: FormBuilder) {
    this.value = formBuilder.control(null, Validators.required);
    this.hasAssertion = formBuilder.control(false, { nonNullable: true });
    this.assertion = formBuilder.control(null);
    this.tag = formBuilder.control(null, Validators.maxLength(50));
    this.form = formBuilder.group({
      value: this.value,
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

    this.value.setValue(location.value || null);
    this.hasAssertion.setValue(location.assertion ? true : false);
    this.assertion.setValue(location.assertion || null);
    this.tag.setValue(location.tag || null);
    this.form.markAsPristine();
  }

  private getLocation(): AssertedLocation {
    return {
      value: this.value.value!,
      assertion:
        this.hasAssertion.value && this.assertion.value
          ? this.assertion.value
          : undefined,
      tag: this.tag.value?.trim(),
    };
  }

  public onLocationChange(value: GeoLocation): void {
    this.value.setValue(value);
    this.value.markAsDirty();
    this.value.updateValueAndValidity();
    this.locationExpanded.set(false);
  }

  public onLocationClose(): void {
    this.locationExpanded.set(false);
  }

  public onLocationToggle(expanded: boolean): void {
    this.locationExpanded.set(expanded);
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
