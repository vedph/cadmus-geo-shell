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

import { AssertedLocationsPartFeatureComponent } from './asserted-locations-part-feature.component';
import { AssertedLocationsPartComponent } from '../asserted-locations-part/asserted-locations-part.component';
import {
  AssertedLocationsPart,
  ASSERTED_LOCATIONS_PART_TYPEID,
} from '../asserted-locations-part';

@Component({ selector: 'cadmus-current-item-bar', template: '' })
class MockCurrentItemBarComponent {}

@Component({ selector: 'cadmus-asserted-locations-part', template: '' })
class MockAssertedLocationsPartComponent {
  public readonly identity = input<PartIdentity>();
  public readonly data = model<EditedObject<AssertedLocationsPart>>();
  public readonly dirtyChange = output<boolean>();
  public readonly editorClose = output();
}

const ITEM_ID = '7c9bf9c6-1c8c-4c56-8d3c-0e2a5f4e8b11';
const PART_ID = '1b2c3d4e-5f60-4a1b-8c2d-3e4f5a6b7c8d';

const THESAURI_IDS = [
  'geo-location-tags',
  'assertion-tags',
  'doc-reference-types',
  'doc-reference-tags',
];

function createPart(id = PART_ID): AssertedLocationsPart {
  return {
    id,
    itemId: ITEM_ID,
    typeId: ASSERTED_LOCATIONS_PART_TYPEID,
    roleId: undefined,
    timeCreated: new Date(),
    creatorId: 'zeus',
    timeModified: new Date(),
    userId: 'zeus',
    locations: [{ value: { label: 'Rome', latitude: 41.9, longitude: 12.5 } }],
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

describe('AssertedLocationsPartFeatureComponent', () => {
  let component: AssertedLocationsPartFeatureComponent;
  let fixture: ComponentFixture<AssertedLocationsPartFeatureComponent>;
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
    loaded?: EditedObject<AssertedLocationsPart>,
  ) => {
    editorService.load.mockResolvedValue(
      loaded ?? { value: createPart(), thesauri: createThesauri(THESAURI_IDS) },
    );
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: {
          params,
          queryParams,
          routeConfig: { path: `${ASSERTED_LOCATIONS_PART_TYPEID}/:pid` },
        },
      },
    });
    fixture = TestBed.createComponent(AssertedLocationsPartFeatureComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  };

  const editor = (): MockAssertedLocationsPartComponent =>
    fixture.debugElement.query(By.directive(MockAssertedLocationsPartComponent))
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

    TestBed.overrideComponent(AssertedLocationsPartFeatureComponent, {
      remove: {
        imports: [CurrentItemBarComponent, AssertedLocationsPartComponent],
      },
      add: {
        imports: [
          MockCurrentItemBarComponent,
          MockAssertedLocationsPartComponent,
        ],
      },
    });

    await TestBed.configureTestingModule({
      imports: [AssertedLocationsPartFeatureComponent],
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
        typeId: ASSERTED_LOCATIONS_PART_TYPEID,
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
            routeConfig: { path: `${ASSERTED_LOCATIONS_PART_TYPEID}/:pid` },
          },
        },
      });
      fixture = TestBed.createComponent(AssertedLocationsPartFeatureComponent);
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
