import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { take } from 'rxjs/operators';

import {
  MatCard,
  MatCardHeader,
  MatCardAvatar,
  MatCardTitle,
  MatCardContent,
  MatCardActions,
} from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
} from '@angular/material/expansion';

import { NgxToolsValidators } from '@myrmidon/ngx-tools';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import { AuthJwtService } from '@myrmidon/auth-jwt-login';
import {
  ProperNameService,
  CadmusProperNamePipe,
} from '@myrmidon/cadmus-refs-proper-name';

import {
  CloseSaveButtonsComponent,
  EditedObject,
  ModelEditorComponentBase,
} from '@myrmidon/cadmus-ui';
import { ThesauriSet, ThesaurusEntry } from '@myrmidon/cadmus-core';

import {
  AssertedToponym,
  AssertedToponymsPart,
  ASSERTED_TOPONYMS_PART_TYPEID,
} from '../asserted-toponyms-part';
import { AssertedToponymComponent } from '../asserted-toponym/asserted-toponym.component';

/**
 * AssertedToponymsPart editor component.
 * Thesauri: geo-toponym-tags, geo-name-tags, geo-name-languages,
 * geo-name-piece-types, assertion-tags, doc-reference-types, doc-reference-tags.
 */
@Component({
  selector: 'cadmus-asserted-toponyms-part',
  templateUrl: './asserted-toponyms-part.component.html',
  styleUrls: ['./asserted-toponyms-part.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatCard,
    MatCardHeader,
    MatCardAvatar,
    MatIcon,
    MatCardTitle,
    MatCardContent,
    MatButton,
    MatIconButton,
    MatTooltip,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    AssertedToponymComponent,
    MatCardActions,
    CadmusProperNamePipe,
    CloseSaveButtonsComponent,
  ],
})
export class AssertedToponymsPartComponent
  extends ModelEditorComponentBase<AssertedToponymsPart>
  implements OnInit
{
  public editedIndex: number;

  public edited: AssertedToponym | undefined;

  // geo-toponym-tags
  public topTagEntries?: ThesaurusEntry[];

  // geo-name-tags
  public nameTagEntries?: ThesaurusEntry[] | undefined;

  // geo-name-languages
  public nameLangEntries?: ThesaurusEntry[] | undefined;

  // geo-name-piece-types
  public nameTypeEntries?: ThesaurusEntry[] | undefined;

  // assertion-tags
  public assTagEntries?: ThesaurusEntry[] | undefined;

  // doc-reference-types
  public refTypeEntries: ThesaurusEntry[] | undefined;

  // doc-reference-tags
  public refTagEntries: ThesaurusEntry[] | undefined;

  public toponyms: FormControl<AssertedToponym[]>;

  // calculated entries
  public namePieceTypeEntries: ThesaurusEntry[];
  public namePieceValueEntries: ThesaurusEntry[];

  constructor(
    authService: AuthJwtService,
    formBuilder: FormBuilder,
    private _nameService: ProperNameService,
    private _dialogService: DialogService
  ) {
    super(authService, formBuilder);
    this.editedIndex = -1;
    this.namePieceTypeEntries = [];
    this.namePieceValueEntries = [];
    // form
    this.toponyms = formBuilder.control([], {
      // at least 1 entry
      validators: NgxToolsValidators.strictMinLengthValidator(1),
      nonNullable: true,
    });
  }

  public override ngOnInit(): void {
    super.ngOnInit();
  }

  protected buildForm(formBuilder: FormBuilder): FormGroup | UntypedFormGroup {
    return formBuilder.group({
      entries: this.toponyms,
    });
  }

  private updateCalculatedEntries(typeEntries: ThesaurusEntry[]): void {
    this.namePieceTypeEntries = this._nameService.parseTypeEntries(typeEntries);
    this.namePieceValueEntries = this._nameService.getValueEntries(
      this.namePieceTypeEntries
    );
  }

  private updateThesauri(thesauri: ThesauriSet): void {
    let key = 'geo-toponym-tags';
    if (this.hasThesaurus(key)) {
      this.topTagEntries = thesauri[key].entries;
    } else {
      this.topTagEntries = undefined;
    }

    key = 'geo-name-tags';
    if (this.hasThesaurus(key)) {
      this.nameTagEntries = thesauri[key].entries;
    } else {
      this.nameTagEntries = undefined;
    }

    key = 'geo-name-languages';
    if (this.hasThesaurus(key)) {
      this.nameLangEntries = thesauri[key].entries;
    } else {
      this.nameLangEntries = undefined;
    }

    key = 'geo-name-piece-types';
    if (this.hasThesaurus(key)) {
      this.nameTypeEntries = thesauri[key].entries;
      this.updateCalculatedEntries(this.nameTypeEntries || []);
    } else {
      this.nameTypeEntries = undefined;
      this.namePieceTypeEntries = [];
      this.namePieceValueEntries = [];
    }

    key = 'assertion-tags';
    if (this.hasThesaurus(key)) {
      this.assTagEntries = thesauri[key].entries;
    } else {
      this.assTagEntries = undefined;
    }
    key = 'doc-reference-types';
    if (this.hasThesaurus(key)) {
      this.refTypeEntries = thesauri[key].entries;
    } else {
      this.refTypeEntries = undefined;
    }
    key = 'doc-reference-tags';
    if (this.hasThesaurus(key)) {
      this.refTagEntries = thesauri[key].entries;
    } else {
      this.refTagEntries = undefined;
    }
  }

  private updateForm(part?: AssertedToponymsPart | null): void {
    if (!part) {
      this.form.reset();
      return;
    }
    this.toponyms.setValue(part.toponyms || []);
    this.form.markAsPristine();
  }

  protected override onDataSet(
    data?: EditedObject<AssertedToponymsPart>
  ): void {
    // thesauri
    if (data?.thesauri) {
      this.updateThesauri(data.thesauri);
    }

    // form
    this.updateForm(data?.value);
  }

  protected getValue(): AssertedToponymsPart {
    let part = this.getEditedPart(
      ASSERTED_TOPONYMS_PART_TYPEID
    ) as AssertedToponymsPart;
    part.toponyms = this.toponyms.value || [];
    return part;
  }

  public addAssertedToponym(): void {
    const entry: AssertedToponym = {
      name: {
        language: this.nameLangEntries?.length
          ? this.nameLangEntries[0].id
          : '',
        pieces: [],
      },
    };
    this.editAssertedToponym(entry, -1);
  }

  public editAssertedToponym(entry: AssertedToponym, index: number): void {
    this.editedIndex = index;
    this.edited = entry;
  }

  public closeAssertedToponym(): void {
    this.editedIndex = -1;
    this.edited = undefined;
  }

  public saveAssertedToponym(entry: AssertedToponym): void {
    const entries = [...this.toponyms.value];
    if (this.editedIndex === -1) {
      entries.push(entry);
    } else {
      entries.splice(this.editedIndex, 1, entry);
    }
    this.toponyms.setValue(entries);
    this.toponyms.markAsDirty();
    this.toponyms.updateValueAndValidity();
    this.closeAssertedToponym();
  }

  public deleteAssertedToponym(index: number): void {
    this._dialogService
      .confirm('Confirmation', 'Delete toponym?')
      .pipe(take(1))
      .subscribe((yes) => {
        if (yes) {
          if (this.editedIndex === index) {
            this.closeAssertedToponym();
          }
          const entries = [...this.toponyms.value];
          entries.splice(index, 1);
          this.toponyms.setValue(entries);
          this.toponyms.markAsDirty();
          this.toponyms.updateValueAndValidity();
        }
      });
  }

  public moveAssertedToponymUp(index: number): void {
    if (index < 1) {
      return;
    }
    const entry = this.toponyms.value[index];
    const entries = [...this.toponyms.value];
    entries.splice(index, 1);
    entries.splice(index - 1, 0, entry);
    this.toponyms.setValue(entries);
    this.toponyms.markAsDirty();
    this.toponyms.updateValueAndValidity();
  }

  public moveAssertedToponymDown(index: number): void {
    if (index + 1 >= this.toponyms.value.length) {
      return;
    }
    const entry = this.toponyms.value[index];
    const entries = [...this.toponyms.value];
    entries.splice(index, 1);
    entries.splice(index + 1, 0, entry);
    this.toponyms.setValue(entries);
    this.toponyms.markAsDirty();
    this.toponyms.updateValueAndValidity();
  }
}
