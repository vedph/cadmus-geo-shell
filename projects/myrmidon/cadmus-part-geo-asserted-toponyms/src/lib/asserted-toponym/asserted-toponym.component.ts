import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { ProperName } from '@myrmidon/cadmus-refs-proper-name';

import { AssertedToponym } from '../asserted-toponyms-part';

@Component({
  selector: 'cadmus-asserted-toponym',
  templateUrl: './asserted-toponym.component.html',
  styleUrls: ['./asserted-toponym.component.css'],
  standalone: false,
})
export class AssertedToponymComponent {
  private _toponym: AssertedToponym | undefined | null;

  public eid: FormControl<string | null>;
  public tag: FormControl<string | null>;
  public name: FormControl<ProperName | null>;
  public form: FormGroup;

  public initialName?: ProperName;

  @Input()
  public get toponym(): AssertedToponym | undefined | null {
    return this._toponym;
  }
  public set toponym(value: AssertedToponym | undefined | null) {
    if (this._toponym !== value) {
      this._toponym = value;
      this.updateForm(value);
    }
  }

  // geo-toponym-tags
  @Input()
  public topTagEntries?: ThesaurusEntry[] | undefined;

  // geo-name-tags
  @Input()
  public nameTagEntries?: ThesaurusEntry[] | undefined;

  // geo-name-languages
  @Input()
  public nameLangEntries?: ThesaurusEntry[] | undefined;

  // geo-name-piece-types
  @Input()
  public nameTypeEntries?: ThesaurusEntry[] | undefined;

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
  public toponymChange: EventEmitter<AssertedToponym>;
  @Output()
  public editorClose: EventEmitter<any>;

  constructor(formBuilder: FormBuilder) {
    this.toponymChange = new EventEmitter<AssertedToponym>();
    this.editorClose = new EventEmitter<any>();
    // form
    this.eid = formBuilder.control(null, Validators.maxLength(500));
    this.tag = formBuilder.control(null, Validators.maxLength(50));
    this.name = formBuilder.control(null, Validators.required);
    this.form = formBuilder.group({
      eid: this.eid,
      tag: this.tag,
      name: this.name,
    });
  }

  private updateForm(toponym: AssertedToponym | undefined | null): void {
    if (!toponym) {
      this.form.reset();
      return;
    }

    this.eid.setValue(toponym.eid || null);
    this.tag.setValue(toponym.tag || null);
    this.initialName = toponym.name;
    this.form.markAsPristine();
  }

  public onNameChange(name: ProperName | undefined): void {
    this.name.setValue(name || null);
    this.name.markAsDirty();
    this.name.updateValueAndValidity();
  }

  private getModel(): AssertedToponym {
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
    this.toponymChange.emit(this.getModel());
  }
}
