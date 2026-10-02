import { Component, input, model, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';

import { EditedObject, PartIdentity, ThesauriSet } from '@myrmidon/cadmus-core';
import { ItemService, ThesaurusService } from '@myrmidon/cadmus-api';
import { PartEditorService } from '@myrmidon/cadmus-state';
import { CurrentItemBarComponent } from '@myrmidon/cadmus-item-editor';

import { AssertedToponymsPartFeatureComponent } from './asserted-toponyms-part-feature.component';
import { AssertedToponymsPartComponent } from '../asserted-toponyms-part/asserted-toponyms-part.component';
import {
  AssertedToponymsPart,
  ASSERTED_TOPONYMS_PART_TYPEID,
} from '../asserted-toponyms-part';

@Component({ selector: 'cadmus-current-item-bar', template: '' })
class MockCurrentItemBarComponent {}

@Component({ selector: 'cadmus-asserted-toponyms-part', template: '' })
class MockAssertedToponymsPartComponent {
  public readonly identity = input<PartIdentity>();
  public readonly data = model<EditedObject<AssertedToponymsPart>>();
  public readonly dirtyChange = output<boolean>();
  public readonly editorClose = output();
}

const ITEM_ID = '7c9bf9c6-1c8c-4c56-8d3c-0e2a5f4e8b11';
const PART_ID = '1b2c3d4e-5f60-4a1b-8c2d-3e4f5a6b7c8d';

const THESAURI_IDS = [
  'geo-toponym-tags',
  'geo-name-tags',
  'geo-name-languages',
  'geo-name-piece-types',
  'assertion-tags',
  'doc-reference-types',
  'doc-reference-tags',
];

function createPart(id = PART_ID): AssertedToponymsPart {
  return {
    id,
    itemId: ITEM_ID,
    typeId: ASSERTED_TOPONYMS_PART_TYPEID,
    roleId: undefined,
    timeCreated: new Date(),
    creatorId: 'zeus',
    timeModified: new Date(),
    userId: 'zeus',
    toponyms: [
      { name: { language: 'lat', pieces: [{ type: 'name', value: 'Roma' }] } },
    ],
  };
}

function createThesauri(ids: string[]): ThesauriSet {
  const set: ThesauriSet = {};
  for (const id of ids) {
    set[id] = {
      id: id + '@en',
      language: 'en',
      entries: [{ id: 'x', value: id }],
    };
  }
  return set;
}

describe('AssertedToponymsPartFeatureComponent', () => {
  let component: AssertedToponymsPartFeatureComponent;
  let fixture: ComponentFixture<AssertedToponymsPartFeatureComponent>;
  let editorService: {
    loading$: BehaviorSubject<boolean>;
    saving$: BehaviorSubject<boolean>;
    load: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let snackbar: { open: ReturnType<typeof vi.fn> };

  const createComponent = async (
    params: Record<string, string> = { iid: ITEM_ID, pid: PART_ID },
    queryParams: Record<string, string> = {},
    loaded?: EditedObject<AssertedToponymsPart>,
  ) => {
    editorService.load.mockResolvedValue(
      loaded ?? { value: createPart(), thesauri: createThesauri(THESAURI_IDS) },
    );
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: {
          params,
          queryParams,
          routeConfig: { path: `${ASSERTED_TOPONYMS_PART_TYPEID}/:pid` },
        },
      },
    });
    fixture = TestBed.createComponent(AssertedToponymsPartFeatureComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  };

  const editor = (): MockAssertedToponymsPartComponent =>
    fixture.debugElement.query(By.directive(MockAssertedToponymsPartComponent))
      .componentInstance;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    editorService = {
      loading$: new BehaviorSubject<boolean>(false),
      saving$: new BehaviorSubject<boolean>(false),
      load: vi.fn(),
      save: vi.fn(),
    };
    router = { navigate: vi.fn() };
    snackbar = { open: vi.fn() };

    TestBed.overrideComponent(AssertedToponymsPartFeatureComponent, {
      remove: {
        imports: [CurrentItemBarComponent, AssertedToponymsPartComponent],
      },
      add: {
        imports: [
          MockCurrentItemBarComponent,
          MockAssertedToponymsPartComponent,
        ],
      },
    });

    await TestBed.configureTestingModule({
      imports: [AssertedToponymsPartFeatureComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
        { provide: MatSnackBar, useValue: snackbar },
        { provide: ItemService, useValue: {} },
        { provide: ThesaurusService, useValue: {} },
        { provide: PartEditorService, useValue: editorService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  describe('identity', () => {
    it('should build identity from route', async () => {
      await createComponent();
      expect(component.identity()).toEqual({
        itemId: ITEM_ID,
        typeId: ASSERTED_TOPONYMS_PART_TYPEID,
        partId: PART_ID,
        roleId: undefined,
      });
    });

    it('should map "new" part and "default" role to null', async () => {
      await createComponent({ iid: ITEM_ID, pid: 'new' }, { rid: 'default' });
      expect(component.identity().partId).toBeNull();
      expect(component.identity().roleId).toBeNull();
    });

    it('should pass identity to the editor', async () => {
      await createComponent();
      expect(editor().identity()).toEqual(component.identity());
    });
  });

  describe('loading', () => {
    it('should load data with the required thesauri', async () => {
      await createComponent();
      expect(editorService.load).toHaveBeenCalledWith(
        component.identity(),
        THESAURI_IDS,
      );
      expect(component.data()?.value?.id).toBe(PART_ID);
      expect(editor().data()).toEqual(component.data());
    });

    it('should load role-suffixed thesauri and alias them', async () => {
      const suffixed = THESAURI_IDS.map((id) => id + '_birth');
      await createComponent(
        { iid: ITEM_ID, pid: PART_ID },
        { rid: 'birth' },
        { value: createPart(), thesauri: createThesauri(suffixed) },
      );

      expect(editorService.load).toHaveBeenCalledWith(
        component.identity(),
        suffixed,
      );
      const thesauri = component.data()!.thesauri;
      for (let i = 0; i < THESAURI_IDS.length; i++) {
        expect(thesauri[THESAURI_IDS[i]]).toBe(thesauri[suffixed[i]]);
      }
    });

    it('should notify load errors', async () => {
      editorService.load.mockRejectedValue(new Error('load failed'));
      TestBed.overrideProvider(ActivatedRoute, {
        useValue: {
          snapshot: {
            params: { iid: ITEM_ID, pid: PART_ID },
            queryParams: {},
            routeConfig: { path: `${ASSERTED_TOPONYMS_PART_TYPEID}/:pid` },
          },
        },
      });
      fixture = TestBed.createComponent(AssertedToponymsPartFeatureComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      expect(snackbar.open).toHaveBeenCalledWith('load failed', 'OK');
      expect(component.data()).toBeUndefined();
    });

    it('should track loading and saving state', async () => {
      await createComponent();
      editorService.loading$.next(true);
      editorService.saving$.next(true);
      expect(component.loading()).toBe(true);
      expect(component.saving()).toBe(true);
    });
  });

  describe('editor events', () => {
    it('should save part when editor data changes', async () => {
      await createComponent();
      const part = createPart();
      editorService.save.mockResolvedValue(part);

      editor().data.set({ value: part, thesauri: {} });
      await fixture.whenStable();

      expect(editorService.save).toHaveBeenCalledWith(part);
      expect(snackbar.open).toHaveBeenCalledWith('Part saved', 'OK', {
        duration: 3000,
      });
    });

    it('should update part ID after saving a new part', async () => {
      await createComponent({ iid: ITEM_ID, pid: 'new' });
      const part = createPart('');
      editorService.save.mockResolvedValue(createPart('new-id'));

      editor().data.set({ value: part, thesauri: {} });
      await fixture.whenStable();

      expect(component.identity().partId).toBe('new-id');
    });

    it('should restore dirty state when save fails', async () => {
      await createComponent();
      editorService.save.mockRejectedValue(new Error('save failed'));

      editor().data.set({ value: createPart(), thesauri: {} });
      await fixture.whenStable();

      expect(component.dirty()).toBe(true);
      expect(snackbar.open).toHaveBeenCalledWith('save failed', 'OK');
    });

    it('should track editor dirty state', async () => {
      await createComponent();
      editor().dirtyChange.emit(true);
      expect(component.dirty()).toBe(true);
      expect(component.canDeactivate()).toBe(false);

      editor().dirtyChange.emit(false);
      expect(component.canDeactivate()).toBe(true);
    });

    it('should navigate back to item on editor close', async () => {
      await createComponent();
      editor().editorClose.emit();
      expect(router.navigate).toHaveBeenCalledWith(['items', ITEM_ID]);
    });
  });
});
