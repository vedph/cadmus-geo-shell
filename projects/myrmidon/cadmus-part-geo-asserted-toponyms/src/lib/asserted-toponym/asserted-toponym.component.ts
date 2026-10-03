import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  linkedSignal,
  model,
  output,
  untracked,
} from '@angular/core';
import { FormField, form, maxLength, required } from '@angular/forms/signals';

import { MatFormField, MatError, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { Assertion } from '@myrmidon/cadmus-refs-assertion';
import {
  ProperName,
  ProperNameComponent,
} from '@myrmidon/cadmus-refs-proper-name';
import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';
import {
  copyFormValue,
  isImplicitSubmission,
  setFieldFromChild,
} from '@myrmidon/cadmus-ui';

import { AssertedToponym } from '../asserted-toponyms-part';

/**
 * The editable shape behind the form.
 */
interface AssertedToponymControls {
  eid: string;
  tag: string;
  name: ProperName | null;
  // the toponym-level assertion is not edited here: carried through
  assertion: Assertion | null;
}

/**
 * Bound toponym -> editable draft.
 */
function toDraft(toponym?: AssertedToponym | null): AssertedToponymControls {
  return {
    eid: toponym?.eid || '',
    tag: toponym?.tag || '',
    name: copyFormValue(toponym?.name) ?? null,
    assertion: copyFormValue(toponym?.assertion) ?? null,
  };
}

/**
 * Editable draft -> toponym.
 */
function toToponym(draft: AssertedToponymControls): AssertedToponym {
  return {
    eid: draft.eid.trim() || undefined,
    tag: draft.tag.trim() || undefined,
    name: copyFormValue(draft.name)!,
    assertion: copyFormValue(draft.assertion) ?? undefined,
  };
}

@Component({
  selector: 'cadmus-asserted-toponym',
  templateUrl: './asserted-toponym.component.html',
  styleUrls: ['./asserted-toponym.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
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

  /**
   * The editable draft, derived from `toponym`. On the echo of our own
   * save, keep the draft rather than rebuilding it from the normalized
   * toponym.
   */
  private readonly _draft = linkedSignal<
    AssertedToponym | undefined,
    AssertedToponymControls
  >({
    source: () => this.toponym(),
    computation: (toponym, previous) =>
      previous &&
      JSON.stringify(toponym) === JSON.stringify(toToponym(previous.value))
        ? previous.value
        : toDraft(toponym),
  });

  public readonly form = form(this._draft, (p) => {
    maxLength(p.eid, 500);
    maxLength(p.tag, 50);
    required(p.name);
  });

  constructor() {
    // once the draft mirrors the bound toponym again there are no unsaved
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

  private isDraftInSync(draft: AssertedToponymControls): boolean {
    return JSON.stringify(draft) === JSON.stringify(toDraft(this.toponym()));
  }

  public onNameChange(name: ProperName | undefined): void {
    setFieldFromChild(this.form.name, copyFormValue(name) ?? null);
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

  public cancel(): void {
    this.editorClose.emit();
  }

  public save(): void {
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    this.toponym.set(toToponym(this._draft()));
    this.form().reset();
  }
}
