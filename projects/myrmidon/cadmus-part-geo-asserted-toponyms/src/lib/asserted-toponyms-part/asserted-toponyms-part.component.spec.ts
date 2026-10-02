import { Component, input, model, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';

import { AuthJwtService, User } from '@myrmidon/auth-jwt-login';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import {
  EditedObject,
  PartIdentity,
  ThesauriSet,
  ThesaurusEntry,
} from '@myrmidon/cadmus-core';
import { AppRepository } from '@myrmidon/cadmus-state';
import { EditorHelpService } from '@myrmidon/cadmus-ui';
import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';

import { AssertedToponymsPartComponent } from './asserted-toponyms-part.component';
import { AssertedToponymComponent } from '../asserted-toponym/asserted-toponym.component';
import {
  AssertedToponym,
  AssertedToponymsPart,
  ASSERTED_TOPONYMS_PART_TYPEID,
} from '../asserted-toponyms-part';

@Component({ selector: 'cadmus-asserted-toponym', template: '' })
class MockAssertedToponymComponent {
  public readonly toponym = model<AssertedToponym>();
  public readonly topTagEntries = input<ThesaurusEntry[]>();
  public readonly nameTagEntries = input<ThesaurusEntry[]>();
  public readonly nameLangEntries = input<ThesaurusEntry[]>();
  public readonly nameTypeEntries = input<ThesaurusEntry[]>();
  public readonly assTagEntries = input<ThesaurusEntry[]>();
  public readonly refTypeEntries = input<ThesaurusEntry[]>();
  public readonly refTagEntries = input<ThesaurusEntry[]>();
  public readonly lookupProviderOptions = input<
    LookupProviderOptions | undefined
  >();
  public readonly editorClose = output();
}

const ITEM_ID = '7c9bf9c6-1c8c-4c56-8d3c-0e2a5f4e8b11';
const PART_ID = '1b2c3d4e-5f60-4a1b-8c2d-3e4f5a6b7c8d';

function createToponym(value: string, eid?: string): AssertedToponym {
  return {
    eid,
    name: { language: 'lat', pieces: [{ type: 'name', value }] },
  };
}

const ROMA = createToponym('Roma', 'rome');
const MEDIOLANUM = createToponym('Mediolanum', 'milan');
const NEAPOLIS = createToponym('Neapolis', 'naples');

function createPart(toponyms: AssertedToponym[]): AssertedToponymsPart {
  return {
    id: PART_ID,
    itemId: ITEM_ID,
    typeId: ASSERTED_TOPONYMS_PART_TYPEID,
    roleId: undefined,
    timeCreated: new Date(),
    creatorId: 'zeus',
    timeModified: new Date(),
    userId: 'zeus',
    toponyms,
  };
}

const THESAURI_KEYS: { key: string; signal: keyof AssertedToponymsPartComponent }[] =
  [
    { key: 'geo-toponym-tags', signal: 'topTagEntries' },
    { key: 'geo-name-tags', signal: 'nameTagEntries' },
    { key: 'geo-name-languages', signal: 'nameLangEntries' },
    { key: 'geo-name-piece-types', signal: 'nameTypeEntries' },
    { key: 'assertion-tags', signal: 'assTagEntries' },
    { key: 'doc-reference-types', signal: 'refTypeEntries' },
    { key: 'doc-reference-tags', signal: 'refTagEntries' },
  ];

function createThesauri(): ThesauriSet {
  const set: ThesauriSet = {};
  for (const { key } of THESAURI_KEYS) {
    set[key] = {
      id: key + '@en',
      language: 'en',
      entries: [{ id: key + '-x', value: key + ' X' }],
    };
  }
  // name languages: first entry is the default for new toponyms
  set['geo-name-languages'].entries = [
    { id: 'ita', value: 'Italian' },
    { id: 'lat', value: 'Latin' },
  ];
  // piece types: a type entry with a dotted child value entry
  set['geo-name-piece-types'].entries = [
    { id: 'name', value: 'name' },
    { id: 'name.roma', value: 'Rome (value)' },
  ];
  return set;
}

describe('AssertedToponymsPartComponent', () => {
  let component: AssertedToponymsPartComponent;
  let fixture: ComponentFixture<AssertedToponymsPartComponent>;
  let dialogService: { confirm: ReturnType<typeof vi.fn> };
  let appRepository: {
    getSettingFor: ReturnType<typeof vi.fn>;
    getTypeThesaurus: ReturnType<typeof vi.fn>;
  };

  const identity: PartIdentity = {
    itemId: ITEM_ID,
    typeId: ASSERTED_TOPONYMS_PART_TYPEID,
    partId: PART_ID,
    roleId: null,
  };

  const setData = async (
    part?: AssertedToponymsPart,
    thesauri: ThesauriSet = {},
  ) => {
    fixture.componentRef.setInput('data', {
      value: part,
      thesauri,
    } as EditedObject<AssertedToponymsPart>);
    await fixture.whenStable();
  };

  const toponymEditor = (): MockAssertedToponymComponent | undefined =>
    fixture.debugElement.query(By.directive(MockAssertedToponymComponent))
      ?.componentInstance;

  beforeEach(async () => {
    dialogService = { confirm: vi.fn().mockReturnValue(of(true)) };
    appRepository = {
      getSettingFor: vi.fn().mockResolvedValue(undefined),
      getTypeThesaurus: vi.fn().mockReturnValue(undefined),
    };
    const user = {
      userName: 'zeus',
      email: 'zeus@olympus.org',
      roles: ['operator'],
    } as unknown as User;

    TestBed.overrideComponent(AssertedToponymsPartComponent, {
      remove: { imports: [AssertedToponymComponent] },
      add: { imports: [MockAssertedToponymComponent] },
    });

    await TestBed.configureTestingModule({
      imports: [AssertedToponymsPartComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: AuthJwtService,
          useValue: {
            currentUserValue: user,
            currentUser$: new BehaviorSubject<User | null>(user),
          },
        },
        { provide: DialogService, useValue: dialogService },
        { provide: AppRepository, useValue: appRepository },
        {
          provide: EditorHelpService,
          useValue: { resolveUrl: vi.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssertedToponymsPartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('identity', identity);
    await fixture.whenStable();
  });

  it('should create with an empty invalid form', () => {
    expect(component).toBeTruthy();
    expect(component.toponyms.value).toEqual([]);
    expect(component.form.invalid).toBe(true);
    expect(component.userLevel).toBe(2);
    expect(component.namePieceTypeEntries()).toEqual([]);
    expect(component.namePieceValueEntries()).toEqual([]);
  });

  describe('data', () => {
    it('should load toponyms from data', async () => {
      await setData(createPart([ROMA, MEDIOLANUM]));

      expect(component.toponyms.value).toEqual([ROMA, MEDIOLANUM]);
      expect(component.form.valid).toBe(true);
      expect(component.form.pristine).toBe(true);
    });

    it('should render one row per toponym with its name', async () => {
      await setData(createPart([ROMA, MEDIOLANUM]));
      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
      expect(rows[0].textContent).toContain('Roma');
      expect(rows[1].textContent).toContain('Mediolanum');
    });

    it('should reset form when data has no value', async () => {
      await setData(createPart([ROMA]));
      await setData(undefined);

      expect(component.toponyms.value).toEqual([]);
      expect(fixture.nativeElement.querySelector('table')).toBeNull();
    });

    it('should treat missing toponyms as empty', async () => {
      const part = createPart([]);
      delete (part as Partial<AssertedToponymsPart>).toponyms;
      await setData(part);
      expect(component.toponyms.value).toEqual([]);
    });

    it('should load thesauri entries', async () => {
      const thesauri = createThesauri();
      await setData(createPart([ROMA]), thesauri);

      for (const { key, signal } of THESAURI_KEYS) {
        const value = (component[signal] as () => unknown)();
        expect(value, key).toEqual(thesauri[key].entries);
      }
    });

    it('should compute name piece type and value entries', async () => {
      await setData(createPart([ROMA]), createThesauri());

      const types = component.namePieceTypeEntries();
      expect(types.map((t) => t.id)).toEqual(['name']);
      expect(component.namePieceValueEntries().map((e) => e.id)).toEqual([
        'name.roma',
      ]);
    });

    it('should clear thesauri entries when missing', async () => {
      await setData(createPart([ROMA]), createThesauri());
      await setData(createPart([ROMA]), {});

      for (const { key, signal } of THESAURI_KEYS) {
        const value = (component[signal] as () => unknown)();
        expect(value, key).toBeUndefined();
      }
    });

    it('should load lookup provider options from settings', async () => {
      const options = {} as LookupProviderOptions;
      appRepository.getSettingFor.mockResolvedValue({
        lookupProviderOptions: options,
      });
      await setData(createPart([ROMA]));

      expect(appRepository.getSettingFor).toHaveBeenCalledWith(
        ASSERTED_TOPONYMS_PART_TYPEID,
        undefined,
      );
      expect(component.lookupProviderOptions()).toBe(options);
    });

    it('should request settings for the identity role', async () => {
      fixture.componentRef.setInput('identity', { ...identity, roleId: 'old' });
      await setData(createPart([ROMA]));
      expect(appRepository.getSettingFor).toHaveBeenLastCalledWith(
        ASSERTED_TOPONYMS_PART_TYPEID,
        'old',
      );
    });

    it('should not fail when settings cannot be loaded', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      appRepository.getSettingFor.mockRejectedValue(new Error('offline'));
      await setData(createPart([ROMA]));
      await fixture.whenStable();

      expect(component.lookupProviderOptions()).toBeUndefined();
      expect(component.toponyms.value).toEqual([ROMA]);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe('toponyms CRUD', () => {
    it('should add a toponym with the first name language', async () => {
      await setData(createPart([ROMA]), createThesauri());
      component.addAssertedToponym();
      await fixture.whenStable();

      expect(component.editedIndex()).toBe(-1);
      expect(component.edited()).toEqual({
        name: { language: 'ita', pieces: [] },
      });
      expect(toponymEditor()!.toponym()).toEqual(component.edited());
    });

    it('should add a toponym with empty language without languages', async () => {
      component.addAssertedToponym();
      expect(component.edited()).toEqual({
        name: { language: '', pieces: [] },
      });
    });

    it('should pass thesauri and options to the toponym editor', async () => {
      const options = {} as LookupProviderOptions;
      appRepository.getSettingFor.mockResolvedValue({
        lookupProviderOptions: options,
      });
      const thesauri = createThesauri();
      await setData(createPart([ROMA]), thesauri);
      component.addAssertedToponym();
      await fixture.whenStable();

      const editor = toponymEditor()!;
      expect(editor.topTagEntries()).toEqual(
        thesauri['geo-toponym-tags'].entries,
      );
      expect(editor.nameTagEntries()).toEqual(
        thesauri['geo-name-tags'].entries,
      );
      expect(editor.nameLangEntries()).toEqual(
        thesauri['geo-name-languages'].entries,
      );
      expect(editor.nameTypeEntries()).toEqual(
        thesauri['geo-name-piece-types'].entries,
      );
      expect(editor.assTagEntries()).toEqual(
        thesauri['assertion-tags'].entries,
      );
      expect(editor.refTypeEntries()).toEqual(
        thesauri['doc-reference-types'].entries,
      );
      expect(editor.refTagEntries()).toEqual(
        thesauri['doc-reference-tags'].entries,
      );
      expect(editor.lookupProviderOptions()).toBe(options);
    });

    it('should edit a copy of the toponym', async () => {
      await setData(createPart([ROMA, MEDIOLANUM]));
      component.editAssertedToponym(MEDIOLANUM, 1);

      expect(component.editedIndex()).toBe(1);
      expect(component.edited()).toEqual(MEDIOLANUM);
      expect(component.edited()).not.toBe(MEDIOLANUM);
    });

    it('should open editor when clicking edit button', async () => {
      await setData(createPart([ROMA, MEDIOLANUM]));
      const button = fixture.nativeElement.querySelector(
        'tbody tr:nth-child(2) button',
      ) as HTMLButtonElement;
      button.click();
      await fixture.whenStable();

      expect(component.editedIndex()).toBe(1);
      expect(toponymEditor()).toBeTruthy();
      const header = fixture.nativeElement.querySelector(
        'mat-expansion-panel-header',
      ) as HTMLElement;
      expect(header.textContent).toContain('toponym #2');
      const row = fixture.nativeElement.querySelector('tbody tr:nth-child(2)');
      expect(row.classList.contains('selected')).toBe(true);
    });

    it('should close editor', async () => {
      component.addAssertedToponym();
      await fixture.whenStable();

      toponymEditor()!.editorClose.emit();
      await fixture.whenStable();

      expect(component.edited()).toBeUndefined();
      expect(component.editedIndex()).toBe(-1);
      expect(toponymEditor()).toBeUndefined();
    });

    it('should append a new toponym on save', async () => {
      await setData(createPart([ROMA]));
      component.addAssertedToponym();
      await fixture.whenStable();

      toponymEditor()!.toponym.set(MEDIOLANUM);
      await fixture.whenStable();

      expect(component.toponyms.value).toEqual([ROMA, MEDIOLANUM]);
      expect(component.toponyms.dirty).toBe(true);
      expect(component.edited()).toBeUndefined();
    });

    it('should replace an existing toponym on save', async () => {
      await setData(createPart([ROMA, MEDIOLANUM]));
      component.editAssertedToponym(MEDIOLANUM, 1);
      component.saveAssertedToponym(NEAPOLIS);

      expect(component.toponyms.value).toEqual([ROMA, NEAPOLIS]);
      expect(component.editedIndex()).toBe(-1);
    });

    it('should delete a toponym when confirmed', async () => {
      await setData(createPart([ROMA, MEDIOLANUM]));
      component.deleteAssertedToponym(0);

      expect(dialogService.confirm).toHaveBeenCalled();
      expect(component.toponyms.value).toEqual([MEDIOLANUM]);
      expect(component.toponyms.dirty).toBe(true);
    });

    it('should not delete a toponym when not confirmed', async () => {
      dialogService.confirm.mockReturnValue(of(false));
      await setData(createPart([ROMA, MEDIOLANUM]));
      component.deleteAssertedToponym(0);
      expect(component.toponyms.value).toEqual([ROMA, MEDIOLANUM]);
    });

    it('should close editor when deleting the edited toponym', async () => {
      await setData(createPart([ROMA, MEDIOLANUM]));
      component.editAssertedToponym(MEDIOLANUM, 1);
      component.deleteAssertedToponym(1);

      expect(component.edited()).toBeUndefined();
      expect(component.toponyms.value).toEqual([ROMA]);
    });

    it('should keep editor open when deleting another toponym', async () => {
      await setData(createPart([ROMA, MEDIOLANUM]));
      component.editAssertedToponym(MEDIOLANUM, 1);
      component.deleteAssertedToponym(0);

      expect(component.edited()).toEqual(MEDIOLANUM);
      expect(component.toponyms.value).toEqual([MEDIOLANUM]);
    });

    it('should move a toponym up', async () => {
      await setData(createPart([ROMA, MEDIOLANUM, NEAPOLIS]));
      component.moveAssertedToponymUp(2);
      expect(component.toponyms.value).toEqual([ROMA, NEAPOLIS, MEDIOLANUM]);
      expect(component.toponyms.dirty).toBe(true);
    });

    it('should not move the first toponym up', async () => {
      await setData(createPart([ROMA, MEDIOLANUM]));
      component.moveAssertedToponymUp(0);
      expect(component.toponyms.value).toEqual([ROMA, MEDIOLANUM]);
      expect(component.toponyms.dirty).toBe(false);
    });

    it('should move a toponym down', async () => {
      await setData(createPart([ROMA, MEDIOLANUM, NEAPOLIS]));
      component.moveAssertedToponymDown(0);
      expect(component.toponyms.value).toEqual([MEDIOLANUM, ROMA, NEAPOLIS]);
    });

    it('should not move the last toponym down', async () => {
      await setData(createPart([ROMA, MEDIOLANUM]));
      component.moveAssertedToponymDown(1);
      expect(component.toponyms.value).toEqual([ROMA, MEDIOLANUM]);
      expect(component.toponyms.dirty).toBe(false);
    });

    it('should disable move buttons at list boundaries', async () => {
      await setData(createPart([ROMA, MEDIOLANUM]));
      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      const up = (row: Element) =>
        row.querySelectorAll('button')[1] as HTMLButtonElement;
      const down = (row: Element) =>
        row.querySelectorAll('button')[2] as HTMLButtonElement;
      expect(up(rows[0]).disabled).toBe(true);
      expect(down(rows[0]).disabled).toBe(false);
      expect(up(rows[1]).disabled).toBe(false);
      expect(down(rows[1]).disabled).toBe(true);
    });
  });

  describe('save', () => {
    it('should not save when invalid', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      let emitted = false;
      component.data.subscribe(() => (emitted = true));
      component.save();
      expect(emitted).toBe(false);
      warn.mockRestore();
    });

    it('should save the edited part preserving its metadata', async () => {
      await setData(createPart([ROMA]));
      component.saveAssertedToponym(MEDIOLANUM);

      let saved: EditedObject<AssertedToponymsPart> | undefined;
      component.data.subscribe((d) => (saved = d));
      component.save();

      expect(saved!.value!.id).toBe(PART_ID);
      expect(saved!.value!.itemId).toBe(ITEM_ID);
      expect(saved!.value!.typeId).toBe(ASSERTED_TOPONYMS_PART_TYPEID);
      expect(saved!.value!.toponyms).toEqual([ROMA, MEDIOLANUM]);
      expect(component.form.pristine).toBe(true);
    });

    it('should create a new part when saving without data', () => {
      component.saveAssertedToponym(ROMA);

      let saved: EditedObject<AssertedToponymsPart> | undefined;
      component.data.subscribe((d) => (saved = d));
      component.save();

      expect(saved!.value!.itemId).toBe(ITEM_ID);
      expect(saved!.value!.typeId).toBe(ASSERTED_TOPONYMS_PART_TYPEID);
      expect(saved!.value!.toponyms).toEqual([ROMA]);
    });

    it('should emit dirty changes', () => {
      const dirty: boolean[] = [];
      component.dirtyChange.subscribe((d) => dirty.push(d));
      component.saveAssertedToponym(ROMA);
      expect(dirty).toEqual([true]);
      expect(component.isDirty()).toBe(true);
    });

    it('should emit editorClose on close', () => {
      let closed = false;
      component.editorClose.subscribe(() => (closed = true));
      component.close();
      expect(closed).toBe(true);
    });
  });
});
