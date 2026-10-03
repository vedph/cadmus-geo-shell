import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  linkedSignal,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormField, form, maxLength, required } from '@angular/forms/signals';

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
import {
  copyFormValue,
  isImplicitSubmission,
  setFieldFromChild,
} from '@myrmidon/cadmus-ui';

import { AssertedLocation } from '../asserted-locations-part';

/**
 * The editable shape behind the form.
 */
interface AssertedLocationControls {
  value: GeoLocation | null;
  hasAssertion: boolean;
  assertion: Assertion | null;
  tag: string;
}

/**
 * Bound location -> editable draft.
 */
function toDraft(location?: AssertedLocation | null): AssertedLocationControls {
  return {
    value: copyFormValue(location?.value) ?? null,
    hasAssertion: !!location?.assertion,
    assertion: copyFormValue(location?.assertion) ?? null,
    tag: location?.tag || '',
  };
}

/**
 * Editable draft -> location.
 */
function toLocation(draft: AssertedLocationControls): AssertedLocation {
  return {
    value: copyFormValue(draft.value)!,
    assertion:
      draft.hasAssertion && draft.assertion
        ? copyFormValue(draft.assertion)
        : undefined,
    tag: draft.tag.trim() || undefined,
  };
}

/**
 * Editor for a location with an optional assertion.
 */
@Component({
  selector: 'cadmus-asserted-location',
  templateUrl: './asserted-location.component.html',
  styleUrls: ['./asserted-location.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
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

  /**
   * The editable draft, derived from `location`. On the echo of our own
   * save, keep the draft rather than rebuilding it from the normalized
   * location.
   */
  private readonly _draft = linkedSignal<
    AssertedLocation | undefined,
    AssertedLocationControls
  >({
    source: () => this.location(),
    computation: (location, previous) =>
      previous &&
      JSON.stringify(location) === JSON.stringify(toLocation(previous.value))
        ? previous.value
        : toDraft(location),
  });

  public readonly form = form(this._draft, (p) => {
    required(p.value);
    maxLength(p.tag, 50);
  });

  constructor() {
    // once the draft mirrors the bound location again there are no unsaved
    // edits: clear the interaction state
    effect(() => {
      const draft = this._draft();
      untracked(() => {
        if (this.isDraftInSync(draft)) {
          this.form().reset();
        }
      });
    });
  }

  private isDraftInSync(draft: AssertedLocationControls): boolean {
    return JSON.stringify(draft) === JSON.stringify(toDraft(this.location()));
  }

  public onLocationChange(value: GeoLocation): void {
    this.form.value().value.set(copyFormValue(value));
    this.form.value().markAsDirty();
    this.locationExpanded.set(false);
  }

  public onLocationClose(): void {
    this.locationExpanded.set(false);
  }

  public onLocationToggle(expanded: boolean): void {
    this.locationExpanded.set(expanded);
  }

  public onAssertionChange(assertion?: Assertion): void {
    setFieldFromChild(this.form.assertion, copyFormValue(assertion) ?? null);
  }

  public onEnterKey(event: Event): void {
    if (!isImplicitSubmission(event)) {
      return;
    }
    event.preventDefault();
    // as the save button, do nothing when invalid or unchanged
    if (this.form().invalid() || !this.form().dirty()) {
      return;
    }
    this.save();
  }

  public close(): void {
    this.editorClose.emit();
  }

  public save(): void {
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    this.location.set(toLocation(this._draft()));
    this.form().reset();
  }
}
