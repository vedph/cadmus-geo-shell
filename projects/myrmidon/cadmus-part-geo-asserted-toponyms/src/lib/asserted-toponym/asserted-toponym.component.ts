import { Component, effect, input, model, output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

import { MatFormField, MatError, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import {
  ProperName,
  ProperNameComponent,
} from '@myrmidon/cadmus-refs-proper-name';
import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';

import { AssertedToponym } from '../asserted-toponyms-part';

@Component({
  selector: 'cadmus-asserted-toponym',
  templateUrl: './asserted-toponym.component.html',
  styleUrls: ['./asserted-toponym.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatError,
    MatLabel,
    MatSelect,
    MatOption,
    ProperNameComponent,
    MatIconButton,
    MatTooltip,
    MatIcon,
  ],
})
export class AssertedToponymComponent {
  public readonly toponym = model<AssertedToponym>();

  // geo-toponym-tags
  public readonly topTagEntries = input<ThesaurusEntry[]>();
  // geo-name-tags
  public readonly nameTagEntries = input<ThesaurusEntry[]>();
  // geo-name-languages
  public readonly nameLangEntries = input<ThesaurusEntry[]>();
  // geo-name-piece-types
  public readonly nameTypeEntries = input<ThesaurusEntry[]>();
  // assertion-tags
  public readonly assTagEntries = input<ThesaurusEntry[]>();
  // doc-reference-types
  public readonly refTypeEntries = input<ThesaurusEntry[]>();
  // doc-reference-tags
  public readonly refTagEntries = input<ThesaurusEntry[]>();

  public readonly lookupProviderOptions = input<
    LookupProviderOptions | undefined
  >();

  public readonly editorClose = output();

  public eid: FormControl<string | null>;
  public tag: FormControl<string | null>;
  public name: FormControl<ProperName | null>;
  public form: FormGroup;

  constructor(formBuilder: FormBuilder) {
    // form
    this.eid = formBuilder.control(null, Validators.maxLength(500));
    this.tag = formBuilder.control(null, Validators.maxLength(50));
    this.name = formBuilder.control(null, Validators.required);
    this.form = formBuilder.group({
      eid: this.eid,
      tag: this.tag,
      name: this.name,
    });

    effect(() => {
      const toponym = this.toponym();
      this.updateForm(toponym);
    });
  }

  private updateForm(toponym: AssertedToponym | undefined | null): void {
    if (!toponym) {
      this.form.reset();
      return;
    }

    this.eid.setValue(toponym.eid || null);
    this.tag.setValue(toponym.tag || null);
    this.name.setValue(toponym.name);
    this.form.markAsPristine();
  }

  public onNameChange(name: ProperName | undefined): void {
    this.name.setValue(name || null);
    this.name.markAsDirty();
    this.name.updateValueAndValidity();
  }

  private getToponym(): AssertedToponym {
    return {
      eid: this.eid.value?.trim(),
      tag: this.tag.value?.trim(),
      name: this.name.value!,
    };
  }

  public cancel(): void {
    this.editorClose.emit();
  }

  public save(): void {
    if (this.form.invalid) {
      return;
    }
    const toponym = this.getToponym();
    this.toponym.set(toponym);
  }
}
