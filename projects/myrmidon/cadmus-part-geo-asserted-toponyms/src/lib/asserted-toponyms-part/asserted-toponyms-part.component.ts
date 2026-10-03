import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
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

import { NgxToolsSignalValidators } from '@myrmidon/ngx-tools';
import { DialogService } from '@myrmidon/ngx-mat-tools';

import {
  ProperNameService,
  CadmusProperNamePipe,
} from '@myrmidon/cadmus-refs-proper-name';
import {
  CloseSaveButtonsComponent,
  ModelEditorComponentBase,
  HelpLinkComponent,
  copyFormValue,
} from '@myrmidon/cadmus-ui';
import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';

import {
  AssertedToponym,
  AssertedToponymsPart,
  ASSERTED_TOPONYMS_PART_TYPEID,
} from '../asserted-toponyms-part';
import { AssertedToponymComponent } from '../asserted-toponym/asserted-toponym.component';

interface AssertedToponymsPartSettings {
  lookupProviderOptions?: LookupProviderOptions;
}

/**
 * The editable shape behind the form.
 */
interface AssertedToponymsPartControls {
  toponyms: AssertedToponym[];
}

/**
 * Bound part -> editable draft.
 */
function toDraft(
  part?: AssertedToponymsPart | null,
): AssertedToponymsPartControls {
  return { toponyms: copyFormValue(part?.toponyms) || [] };
}

/**
 * AssertedToponymsPart editor component.
 * Thesauri: geo-toponym-tags, geo-name-tags, geo-name-languages,
 * geo-name-piece-types, assertion-tags, doc-reference-types, doc-reference-tags.
 */
@Component({
  selector: 'cadmus-asserted-toponyms-part',
  templateUrl: './asserted-toponyms-part.component.html',
  styleUrls: ['./asserted-toponyms-part.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
    HelpLinkComponent,
  ],
})
export class AssertedToponymsPartComponent extends ModelEditorComponentBase<AssertedToponymsPart> {
  private readonly _nameService = inject(ProperNameService);
  private readonly _dialogService = inject(DialogService);

  public readonly editedIndex = signal<number>(-1);
  public readonly edited = signal<AssertedToponym | undefined>(undefined);

  // geo-toponym-tags
  public readonly topTagEntries = computed(
    () => this.data()?.thesauri?.['geo-toponym-tags']?.entries,
  );
  // geo-name-tags
  public readonly nameTagEntries = computed(
    () => this.data()?.thesauri?.['geo-name-tags']?.entries,
  );
  // geo-name-languages
  public readonly nameLangEntries = computed(
    () => this.data()?.thesauri?.['geo-name-languages']?.entries,
  );
  // geo-name-piece-types
  public readonly nameTypeEntries = computed(
    () => this.data()?.thesauri?.['geo-name-piece-types']?.entries,
  );
  // assertion-tags
  public readonly assTagEntries = computed(
    () => this.data()?.thesauri?.['assertion-tags']?.entries,
  );
  // doc-reference-types
  public readonly refTypeEntries = computed(
    () => this.data()?.thesauri?.['doc-reference-types']?.entries,
  );
  // doc-reference-tags
  public readonly refTagEntries = computed(
    () => this.data()?.thesauri?.['doc-reference-tags']?.entries,
  );

  // lookup options depending on role
  public readonly lookupProviderOptions = signal<
    LookupProviderOptions | undefined
  >(undefined);

  private readonly _draft = linkedSignal(() => toDraft(this.data()?.value));
  public readonly form = this.createForm(this._draft, (p) => {
    // at least 1 entry
    NgxToolsSignalValidators.strictMinLength(p.toponyms, 1);
  });

  // calculated entries
  public readonly namePieceTypeEntries = computed(() => {
    return this._nameService.parseTypeEntries(this.nameTypeEntries() || []);
  });
  public readonly namePieceValueEntries = computed(() => {
    return this._nameService.getValueEntries(this.namePieceTypeEntries());
  });

  constructor() {
    super();
    this.initSettings<AssertedToponymsPartSettings>(
      ASSERTED_TOPONYMS_PART_TYPEID,
      (settings) =>
        this.lookupProviderOptions.set(
          settings?.lookupProviderOptions || undefined,
        ),
    );
  }

  protected getValue(): AssertedToponymsPart {
    const part = this.getEditedPart(
      ASSERTED_TOPONYMS_PART_TYPEID,
    ) as AssertedToponymsPart;
    part.toponyms = copyFormValue(this._draft().toponyms);
    return part;
  }

  private setToponyms(toponyms: AssertedToponym[]): void {
    this.form.toponyms().value.set(toponyms);
    this.form.toponyms().markAsDirty();
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
    this.edited.set(copyFormValue(entry));
  }

  public closeAssertedToponym(): void {
    this.editedIndex.set(-1);
    this.edited.set(undefined);
  }

  public saveAssertedToponym(entry: AssertedToponym): void {
    const toponyms = [...this._draft().toponyms];
    if (this.editedIndex() === -1) {
      toponyms.push(copyFormValue(entry));
    } else {
      toponyms.splice(this.editedIndex(), 1, copyFormValue(entry));
    }
    this.setToponyms(toponyms);
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
          this.setToponyms(
            this._draft().toponyms.filter((_, i) => i !== index),
          );
        }
      });
  }

  public moveAssertedToponymUp(index: number): void {
    if (index < 1) {
      return;
    }
    const toponyms = [...this._draft().toponyms];
    const entry = toponyms.splice(index, 1)[0];
    toponyms.splice(index - 1, 0, entry);
    this.setToponyms(toponyms);
  }

  public moveAssertedToponymDown(index: number): void {
    const toponyms = [...this._draft().toponyms];
    if (index + 1 >= toponyms.length) {
      return;
    }
    const entry = toponyms.splice(index, 1)[0];
    toponyms.splice(index + 1, 0, entry);
    this.setToponyms(toponyms);
  }
}
