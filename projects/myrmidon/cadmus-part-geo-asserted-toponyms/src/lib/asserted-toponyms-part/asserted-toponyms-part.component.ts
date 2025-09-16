import { Component, computed, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
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

import { deepCopy, NgxToolsValidators } from '@myrmidon/ngx-tools';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import { AuthJwtService } from '@myrmidon/auth-jwt-login';
import {
  ProperNameService,
  CadmusProperNamePipe,
} from '@myrmidon/cadmus-refs-proper-name';

import {
  CloseSaveButtonsComponent,
  ModelEditorComponentBase,
} from '@myrmidon/cadmus-ui';
import {
  EditedObject,
  ThesauriSet,
  ThesaurusEntry,
} from '@myrmidon/cadmus-core';

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
    TitleCasePipe,
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
  public readonly editedIndex = signal<number>(-1);
  public readonly edited = signal<AssertedToponym | undefined>(undefined);

  // geo-toponym-tags
  public readonly topTagEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // geo-name-tags
  public readonly nameTagEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // geo-name-languages
  public readonly nameLangEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // geo-name-piece-types
  public readonly nameTypeEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // assertion-tags
  public readonly assTagEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // doc-reference-types
  public readonly refTypeEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // doc-reference-tags
  public readonly refTagEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );

  public toponyms: FormControl<AssertedToponym[]>;

  // calculated entries
  public readonly namePieceTypeEntries = computed(() => {
    return this._nameService.parseTypeEntries(this.nameTypeEntries() || []);
  });
  public readonly namePieceValueEntries = computed(() => {
    return this._nameService.getValueEntries(this.namePieceTypeEntries());
  });

  constructor(
    authService: AuthJwtService,
    formBuilder: FormBuilder,
    private _nameService: ProperNameService,
    private _dialogService: DialogService
  ) {
    super(authService, formBuilder);
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

  private updateThesauri(thesauri: ThesauriSet): void {
    let key = 'geo-toponym-tags';
    if (this.hasThesaurus(key)) {
      this.topTagEntries.set(thesauri[key].entries);
    } else {
      this.topTagEntries.set(undefined);
    }

    key = 'geo-name-tags';
    if (this.hasThesaurus(key)) {
      this.nameTagEntries.set(thesauri[key].entries);
    } else {
      this.nameTagEntries.set(undefined);
    }

    key = 'geo-name-languages';
    if (this.hasThesaurus(key)) {
      this.nameLangEntries.set(thesauri[key].entries);
    } else {
      this.nameLangEntries.set(undefined);
    }

    key = 'geo-name-piece-types';
    if (this.hasThesaurus(key)) {
      this.nameTypeEntries.set(thesauri[key].entries);
    } else {
      this.nameTypeEntries.set(undefined);
    }

    key = 'assertion-tags';
    if (this.hasThesaurus(key)) {
      this.assTagEntries.set(thesauri[key].entries);
    } else {
      this.assTagEntries.set(undefined);
    }
    key = 'doc-reference-types';
    if (this.hasThesaurus(key)) {
      this.refTypeEntries.set(thesauri[key].entries);
    } else {
      this.refTypeEntries.set(undefined);
    }
    key = 'doc-reference-tags';
    if (this.hasThesaurus(key)) {
      this.refTagEntries.set(thesauri[key].entries);
    } else {
      this.refTagEntries.set(undefined);
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
        language: this.nameLangEntries()?.length
          ? this.nameLangEntries()![0].id
          : '',
        pieces: [],
      },
    };
    this.editAssertedToponym(entry, -1);
  }

  public editAssertedToponym(entry: AssertedToponym, index: number): void {
    this.editedIndex.set(index);
    this.edited.set(deepCopy(entry));
  }

  public closeAssertedToponym(): void {
    this.editedIndex.set(-1);
    this.edited.set(undefined);
  }

  public saveAssertedToponym(entry: AssertedToponym): void {
    const entries = [...this.toponyms.value];
    if (this.editedIndex() === -1) {
      entries.push(entry);
    } else {
      entries.splice(this.editedIndex(), 1, entry);
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
          if (this.editedIndex() === index) {
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
