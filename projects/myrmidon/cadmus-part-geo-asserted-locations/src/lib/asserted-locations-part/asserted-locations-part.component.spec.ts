import { Component, Directive, input, model, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import type { Map as MaplibreMap } from 'maplibre-gl';

import {
  MapComponent,
  MarkerComponent,
  ControlComponent,
  NavigationControlDirective,
  ScaleControlDirective,
  GeoJSONSourceComponent,
  LayerComponent,
} from '@maplibre/ngx-maplibre-gl';

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

import { AssertedLocationsPartComponent } from './asserted-locations-part.component';
import { AssertedLocationComponent } from '../asserted-location/asserted-location.component';
import {
  AssertedLocation,
  AssertedLocationsPart,
  ASSERTED_LOCATIONS_PART_TYPEID,
} from '../asserted-locations-part';

//#region MapLibre stubs
// the real components create a maplibre-gl Map, which needs WebGL
@Component({ selector: 'mgl-map', template: '<ng-content />' })
class MockMapComponent {
  public readonly mapStyle = input<unknown>();
  public readonly center = input<unknown>();
  public readonly zoom = input<unknown>();
  public readonly mapLoad = output<unknown>();
}

@Component({ selector: 'mgl-marker', template: '' })
class MockMarkerComponent {
  public readonly lngLat = input<unknown>();
  public readonly color = input<unknown>();
}

@Component({ selector: 'mgl-control', template: '' })
class MockControlComponent {
  public readonly position = input<unknown>();
}

@Directive({ selector: '[mglNavigation]' })
class MockNavigationControlDirective {}

@Directive({ selector: '[mglScale]' })
class MockScaleControlDirective {
  public readonly unit = input<unknown>();
}

@Component({ selector: 'mgl-geojson-source', template: '' })
class MockGeoJSONSourceComponent {
  public readonly id = input<unknown>();
  public readonly data = input<unknown>();
}

@Component({ selector: 'mgl-layer', template: '' })
class MockLayerComponent {
  public readonly id = input<unknown>();
  public readonly type = input<unknown>();
  public readonly source = input<unknown>();
  public readonly layout = input<unknown>();
  public readonly paint = input<unknown>();
}
//#endregion

@Component({ selector: 'cadmus-asserted-location', template: '' })
class MockAssertedLocationComponent {
  public readonly location = model<AssertedLocation>();
  public readonly locTagEntries = input<ThesaurusEntry[]>();
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

function createLocation(
  label: string,
  latitude: number,
  longitude: number,
): AssertedLocation {
  return { value: { label, latitude, longitude } };
}

const ROME = createLocation('Rome', 41.9, 12.5);
const MILAN = createLocation('Milan', 45.46, 9.19);
const NAPLES = createLocation('Naples', 40.85, 14.27);

function createPart(locations: AssertedLocation[]): AssertedLocationsPart {
  return {
    id: PART_ID,
    itemId: ITEM_ID,
    typeId: ASSERTED_LOCATIONS_PART_TYPEID,
    roleId: undefined,
    timeCreated: new Date(),
    creatorId: 'zeus',
    timeModified: new Date(),
    userId: 'zeus',
    locations,
  };
}

function createThesauri(): ThesauriSet {
  const thesaurus = (id: string, entries: ThesaurusEntry[]) => ({
    id: id + '@en',
    language: 'en',
    entries,
  });
  return {
    'geo-location-tags': thesaurus('geo-location-tags', [
      { id: 'capital', value: 'capital' },
    ]),
    'assertion-tags': thesaurus('assertion-tags', [
      { id: 'ass', value: 'ass' },
    ]),
    'doc-reference-types': thesaurus('doc-reference-types', [
      { id: 'book', value: 'book' },
    ]),
    'doc-reference-tags': thesaurus('doc-reference-tags', [
      { id: 'ref', value: 'ref' },
    ]),
  };
}

function createMockMap() {
  return {
    resize: vi.fn(),
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
  };
}

describe('AssertedLocationsPartComponent', () => {
  let component: AssertedLocationsPartComponent;
  let fixture: ComponentFixture<AssertedLocationsPartComponent>;
  let dialogService: { confirm: ReturnType<typeof vi.fn> };
  let appRepository: {
    getSettingFor: ReturnType<typeof vi.fn>;
    getTypeThesaurus: ReturnType<typeof vi.fn>;
  };
  let user$: BehaviorSubject<User | null>;

  const identity: PartIdentity = {
    itemId: ITEM_ID,
    typeId: ASSERTED_LOCATIONS_PART_TYPEID,
    partId: PART_ID,
    roleId: null,
  };

  const setData = async (
    part?: AssertedLocationsPart,
    thesauri: ThesauriSet = {},
  ) => {
    fixture.componentRef.setInput('data', {
      value: part,
      thesauri,
    } as EditedObject<AssertedLocationsPart>);
    await fixture.whenStable();
  };

  const locationEditor = (): MockAssertedLocationComponent | undefined =>
    fixture.debugElement.query(By.directive(MockAssertedLocationComponent))
      ?.componentInstance;

  beforeEach(async () => {
    dialogService = { confirm: vi.fn().mockReturnValue(of(true)) };
    appRepository = {
      getSettingFor: vi.fn().mockResolvedValue(undefined),
      getTypeThesaurus: vi.fn().mockReturnValue(undefined),
    };
    const user: User = {
      userName: 'zeus',
      email: 'zeus@olympus.org',
      firstName: 'Zeus',
      lastName: 'Kronides',
      roles: ['admin'],
    } as User;
    user$ = new BehaviorSubject<User | null>(user);

    TestBed.overrideComponent(AssertedLocationsPartComponent, {
      remove: {
        imports: [
          AssertedLocationComponent,
          MapComponent,
          MarkerComponent,
          ControlComponent,
          NavigationControlDirective,
          ScaleControlDirective,
          GeoJSONSourceComponent,
          LayerComponent,
        ],
      },
      add: {
        imports: [
          MockAssertedLocationComponent,
          MockMapComponent,
          MockMarkerComponent,
          MockControlComponent,
          MockNavigationControlDirective,
          MockScaleControlDirective,
          MockGeoJSONSourceComponent,
          MockLayerComponent,
        ],
      },
    });

    await TestBed.configureTestingModule({
      imports: [AssertedLocationsPartComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: AuthJwtService,
          useValue: {
            currentUserValue: user,
            currentUser$: user$.asObservable(),
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

    fixture = TestBed.createComponent(AssertedLocationsPartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('identity', identity);
    await fixture.whenStable();
  });

  it('should create with an empty invalid form', () => {
    expect(component).toBeTruthy();
    expect(component.locations.value).toEqual([]);
    expect(component.form.invalid).toBe(true);
    expect(component.userLevel).toBe(4);
    expect(component.mapLocations()).toEqual([]);
    expect(component.labelsGeoJSON().features).toEqual([]);
  });

  describe('data', () => {
    it('should load locations from data', async () => {
      await setData(createPart([ROME, MILAN]));

      expect(component.locations.value).toEqual([ROME, MILAN]);
      expect(component.form.valid).toBe(true);
      expect(component.form.pristine).toBe(true);
      expect(component.mapLocations()).toEqual([ROME, MILAN]);
    });

    it('should render one row per location', async () => {
      await setData(createPart([ROME, MILAN]));
      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
      expect(rows[0].textContent).toContain('Rome');
      expect(rows[0].textContent).toContain('41.9');
      expect(rows[1].textContent).toContain('Milan');
    });

    it('should reset form when data has no value', async () => {
      await setData(createPart([ROME]));
      await setData(undefined);

      expect(component.locations.value).toEqual([]);
      expect(component.mapLocations()).toEqual([]);
      expect(fixture.nativeElement.querySelector('table')).toBeNull();
    });

    it('should treat missing locations as empty', async () => {
      const part = createPart([]);
      delete (part as Partial<AssertedLocationsPart>).locations;
      await setData(part);
      expect(component.locations.value).toEqual([]);
    });

    it('should load thesauri entries', async () => {
      const thesauri = createThesauri();
      await setData(createPart([ROME]), thesauri);

      expect(component.locTagEntries()).toEqual(
        thesauri['geo-location-tags'].entries,
      );
      expect(component.assTagEntries()).toEqual(
        thesauri['assertion-tags'].entries,
      );
      expect(component.refTypeEntries()).toEqual(
        thesauri['doc-reference-types'].entries,
      );
      expect(component.refTagEntries()).toEqual(
        thesauri['doc-reference-tags'].entries,
      );
    });

    it('should clear thesauri entries when missing', async () => {
      await setData(createPart([ROME]), createThesauri());
      await setData(createPart([ROME]), {});

      expect(component.locTagEntries()).toBeUndefined();
      expect(component.assTagEntries()).toBeUndefined();
      expect(component.refTypeEntries()).toBeUndefined();
      expect(component.refTagEntries()).toBeUndefined();
    });

    it('should load lookup provider options from settings', async () => {
      const options: LookupProviderOptions = {
        scopes: { default: {} },
      } as unknown as LookupProviderOptions;
      appRepository.getSettingFor.mockResolvedValue({
        lookupProviderOptions: options,
      });
      await setData(createPart([ROME]));

      expect(appRepository.getSettingFor).toHaveBeenCalledWith(
        ASSERTED_LOCATIONS_PART_TYPEID,
        undefined,
      );
      expect(component.lookupProviderOptions()).toBe(options);
    });

    it('should request settings for the identity role', async () => {
      fixture.componentRef.setInput('identity', {
        ...identity,
        roleId: 'birth',
      });
      await setData(createPart([ROME]));
      expect(appRepository.getSettingFor).toHaveBeenLastCalledWith(
        ASSERTED_LOCATIONS_PART_TYPEID,
        'birth',
      );
    });

    it('should not fail when settings cannot be loaded', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      appRepository.getSettingFor.mockRejectedValue(new Error('offline'));
      await setData(createPart([ROME]));
      await fixture.whenStable();

      expect(component.lookupProviderOptions()).toBeUndefined();
      expect(component.locations.value).toEqual([ROME]);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe('labelsGeoJSON', () => {
    it('should build a feature per location', async () => {
      const unlabeled = createLocation('', 1, 2);
      await setData(createPart([ROME, unlabeled]));

      const features = component.labelsGeoJSON().features;
      expect(features.length).toBe(2);
      expect(features[0].geometry).toEqual({
        type: 'Point',
        coordinates: [12.5, 41.9],
      });
      expect(features[0].properties).toEqual({ label: 'Rome' });
      expect(features[1].properties).toEqual({ label: '' });
    });
  });

  describe('locations CRUD', () => {
    it('should open editor with a new location on add', async () => {
      component.addLocation();
      await fixture.whenStable();

      expect(component.editedIndex()).toBe(-1);
      expect(component.edited()).toEqual({
        value: { label: '', latitude: 0, longitude: 0 },
      });
      expect(locationEditor()).toBeTruthy();
      expect(locationEditor()!.location()).toEqual(component.edited());
    });

    it('should pass thesauri and options to the location editor', async () => {
      const thesauri = createThesauri();
      await setData(createPart([ROME]), thesauri);
      component.addLocation();
      await fixture.whenStable();

      const editor = locationEditor()!;
      expect(editor.locTagEntries()).toEqual(
        thesauri['geo-location-tags'].entries,
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
    });

    it('should edit a copy of the location', async () => {
      await setData(createPart([ROME, MILAN]));
      component.editLocation(MILAN, 1);

      expect(component.editedIndex()).toBe(1);
      expect(component.edited()).toEqual(MILAN);
      expect(component.edited()).not.toBe(MILAN);
    });

    it('should open editor when clicking edit button', async () => {
      await setData(createPart([ROME, MILAN]));
      const buttons = fixture.nativeElement.querySelectorAll(
        'tbody tr:nth-child(2) button',
      );
      (buttons[0] as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(component.editedIndex()).toBe(1);
      expect(locationEditor()).toBeTruthy();
      const row = fixture.nativeElement.querySelector('tbody tr:nth-child(2)');
      expect(row.classList.contains('selected')).toBe(true);
    });

    it('should close editor', async () => {
      component.addLocation();
      await fixture.whenStable();

      locationEditor()!.editorClose.emit();
      await fixture.whenStable();

      expect(component.edited()).toBeUndefined();
      expect(component.editedIndex()).toBe(-1);
      expect(locationEditor()).toBeUndefined();
    });

    it('should append a new location on save', async () => {
      await setData(createPart([ROME]));
      component.addLocation();
      await fixture.whenStable();

      locationEditor()!.location.set(MILAN);
      await fixture.whenStable();

      expect(component.locations.value).toEqual([ROME, MILAN]);
      expect(component.locations.dirty).toBe(true);
      expect(component.edited()).toBeUndefined();
      expect(component.mapLocations()).toEqual([ROME, MILAN]);
    });

    it('should replace an existing location on save', async () => {
      await setData(createPart([ROME, MILAN]));
      component.editLocation(MILAN, 1);
      component.saveLocation(NAPLES);

      expect(component.locations.value).toEqual([ROME, NAPLES]);
      expect(component.editedIndex()).toBe(-1);
    });

    it('should delete a location when confirmed', async () => {
      await setData(createPart([ROME, MILAN]));
      component.deleteLocation(0);

      expect(dialogService.confirm).toHaveBeenCalled();
      expect(component.locations.value).toEqual([MILAN]);
      expect(component.locations.dirty).toBe(true);
    });

    it('should not delete a location when not confirmed', async () => {
      dialogService.confirm.mockReturnValue(of(false));
      await setData(createPart([ROME, MILAN]));
      component.deleteLocation(0);
      expect(component.locations.value).toEqual([ROME, MILAN]);
    });

    it('should close editor when deleting the edited location', async () => {
      await setData(createPart([ROME, MILAN]));
      component.editLocation(MILAN, 1);
      component.deleteLocation(1);

      expect(component.edited()).toBeUndefined();
      expect(component.editedIndex()).toBe(-1);
      expect(component.locations.value).toEqual([ROME]);
    });

    it('should keep editor open when deleting another location', async () => {
      await setData(createPart([ROME, MILAN]));
      component.editLocation(MILAN, 1);
      component.deleteLocation(0);

      expect(component.edited()).toEqual(MILAN);
      expect(component.locations.value).toEqual([MILAN]);
    });

    it('should move a location up', async () => {
      await setData(createPart([ROME, MILAN, NAPLES]));
      component.moveLocationUp(2);
      expect(component.locations.value).toEqual([ROME, NAPLES, MILAN]);
      expect(component.locations.dirty).toBe(true);
    });

    it('should not move the first location up', async () => {
      await setData(createPart([ROME, MILAN]));
      component.moveLocationUp(0);
      expect(component.locations.value).toEqual([ROME, MILAN]);
      expect(component.locations.dirty).toBe(false);
    });

    it('should move a location down', async () => {
      await setData(createPart([ROME, MILAN, NAPLES]));
      component.moveLocationDown(0);
      expect(component.locations.value).toEqual([MILAN, ROME, NAPLES]);
    });

    it('should not move the last location down', async () => {
      await setData(createPart([ROME, MILAN]));
      component.moveLocationDown(1);
      expect(component.locations.value).toEqual([ROME, MILAN]);
      expect(component.locations.dirty).toBe(false);
    });

    it('should disable move buttons at list boundaries', async () => {
      await setData(createPart([ROME, MILAN]));
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

  describe('overview map', () => {
    it('should do nothing before the map is loaded', async () => {
      await setData(createPart([ROME, MILAN]));
      expect(() => component.fitMapToLocations()).not.toThrow();
      expect(() => component.flyToLocation(ROME)).not.toThrow();
      expect(component.mapReady()).toBe(false);
    });

    it('should set map ready and resize on load', () => {
      const map = createMockMap();
      component.onOverviewMapLoad(map as unknown as MaplibreMap);
      expect(component.mapReady()).toBe(true);
      expect(map.resize).toHaveBeenCalled();
    });

    it('should handle map load from the map component', async () => {
      const map = createMockMap();
      const mgl = fixture.debugElement.query(By.directive(MockMapComponent))
        .componentInstance as MockMapComponent;
      mgl.mapLoad.emit(map);
      expect(component.mapReady()).toBe(true);
    });

    it('should fit map to locations after load', async () => {
      await setData(createPart([ROME, MILAN]));
      vi.useFakeTimers();
      try {
        const map = createMockMap();
        component.onOverviewMapLoad(map as unknown as MaplibreMap);
        expect(map.fitBounds).not.toHaveBeenCalled();
        vi.runAllTimers();
        expect(map.fitBounds).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should not fit map on load when there are no locations', () => {
      vi.useFakeTimers();
      try {
        const map = createMockMap();
        component.onOverviewMapLoad(map as unknown as MaplibreMap);
        vi.runAllTimers();
        expect(map.fitBounds).not.toHaveBeenCalled();
        expect(map.flyTo).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('should fly to a single location', async () => {
      await setData(createPart([ROME]));
      const map = createMockMap();
      component.onOverviewMapLoad(map as unknown as MaplibreMap);
      component.fitMapToLocations();
      expect(map.flyTo).toHaveBeenCalledWith({
        center: [12.5, 41.9],
        zoom: 10,
      });
      expect(map.fitBounds).not.toHaveBeenCalled();
    });

    it('should fit bounds for multiple locations', async () => {
      await setData(createPart([ROME, MILAN, NAPLES]));
      const map = createMockMap();
      component.onOverviewMapLoad(map as unknown as MaplibreMap);
      component.fitMapToLocations();

      expect(map.fitBounds).toHaveBeenCalledTimes(1);
      const [bounds, options] = map.fitBounds.mock.calls[0];
      expect(options).toEqual({ padding: 50, maxZoom: 14 });
      expect(bounds.getWest()).toBeCloseTo(9.19);
      expect(bounds.getEast()).toBeCloseTo(14.27);
      expect(bounds.getSouth()).toBeCloseTo(40.85);
      expect(bounds.getNorth()).toBeCloseTo(45.46);
    });

    it('should fit map when data is set after map load', async () => {
      vi.useFakeTimers();
      try {
        const map = createMockMap();
        component.onOverviewMapLoad(map as unknown as MaplibreMap);
        fixture.componentRef.setInput('data', {
          value: createPart([ROME]),
          thesauri: {},
        });
        fixture.detectChanges();
        vi.runAllTimers();
        expect(map.flyTo).toHaveBeenCalledWith({
          center: [12.5, 41.9],
          zoom: 10,
        });
      } finally {
        vi.useRealTimers();
      }
    });

    it('should fly to a location', () => {
      const map = createMockMap();
      component.onOverviewMapLoad(map as unknown as MaplibreMap);
      component.flyToLocation(MILAN);
      expect(map.flyTo).toHaveBeenCalledWith({
        center: [9.19, 45.46],
        zoom: 14,
      });
    });

    it('should disable fit button without locations', async () => {
      const fitButton = (): HTMLButtonElement =>
        fixture.nativeElement.querySelector(
          'button[mattooltip="Fit map to locations"]',
        );
      expect(fitButton().disabled).toBe(true);
      await setData(createPart([ROME]));
      expect(fitButton().disabled).toBe(false);
    });

    it('should render a marker per location', async () => {
      await setData(createPart([ROME, MILAN]));
      const markers = fixture.debugElement.queryAll(
        By.directive(MockMarkerComponent),
      );
      expect(markers.length).toBe(2);
      expect(
        (markers[1].componentInstance as MockMarkerComponent).lngLat(),
      ).toEqual([9.19, 45.46]);
    });
  });

  describe('save', () => {
    it('should not save when invalid', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      let emitted = false;
      component.data.subscribe(() => (emitted = true));
      component.save();
      expect(emitted).toBe(false);
      warn.mockRestore();
    });

    it('should save the edited part preserving its metadata', async () => {
      const part = createPart([ROME]);
      await setData(part);
      component.saveLocation(MILAN);

      let saved: EditedObject<AssertedLocationsPart> | undefined;
      component.data.subscribe((d) => (saved = d));
      component.save();

      expect(saved).toBeTruthy();
      expect(saved!.value!.id).toBe(PART_ID);
      expect(saved!.value!.itemId).toBe(ITEM_ID);
      expect(saved!.value!.typeId).toBe(ASSERTED_LOCATIONS_PART_TYPEID);
      expect(saved!.value!.locations).toEqual([ROME, MILAN]);
      expect(component.form.pristine).toBe(true);
    });

    it('should create a new part when saving without data', async () => {
      component.saveLocation(ROME);

      let saved: EditedObject<AssertedLocationsPart> | undefined;
      component.data.subscribe((d) => (saved = d));
      component.save();

      expect(saved!.value!.itemId).toBe(ITEM_ID);
      expect(saved!.value!.typeId).toBe(ASSERTED_LOCATIONS_PART_TYPEID);
      expect(saved!.value!.locations).toEqual([ROME]);
    });

    it('should emit dirty changes', async () => {
      const dirty: boolean[] = [];
      component.dirtyChange.subscribe((d) => dirty.push(d));
      component.saveLocation(ROME);
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
