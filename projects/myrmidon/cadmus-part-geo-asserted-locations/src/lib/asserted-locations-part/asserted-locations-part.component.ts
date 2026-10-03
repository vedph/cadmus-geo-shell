import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { take } from 'rxjs/operators';
import { TitleCasePipe } from '@angular/common';
import type { FeatureCollection } from 'geojson';
import { Map as MaplibreMap, LngLatBounds, LngLatLike } from 'maplibre-gl';

import { NgxToolsSignalValidators } from '@myrmidon/ngx-tools';
import { DialogService } from '@myrmidon/ngx-mat-tools';

import {
  CloseSaveButtonsComponent,
  ModelEditorComponentBase,
  HelpLinkComponent,
  copyFormValue,
} from '@myrmidon/cadmus-ui';
import { EditedObject } from '@myrmidon/cadmus-core';

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

import {
  MapComponent,
  MarkerComponent,
  ControlComponent,
  NavigationControlDirective,
  ScaleControlDirective,
  GeoJSONSourceComponent,
  LayerComponent,
} from '@maplibre/ngx-maplibre-gl';

import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';

import { AssertedLocationComponent } from '../asserted-location/asserted-location.component';
import {
  AssertedLocation,
  AssertedLocationsPart,
  ASSERTED_LOCATIONS_PART_TYPEID,
} from '../asserted-locations-part';

const DEFAULT_MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

interface AssertedLocationsPartSettings {
  lookupProviderOptions?: LookupProviderOptions;
}

/**
 * The editable shape behind the form.
 */
interface AssertedLocationsPartControls {
  locations: AssertedLocation[];
}

/**
 * Bound part -> editable draft.
 */
function toDraft(
  part?: AssertedLocationsPart | null,
): AssertedLocationsPartControls {
  return { locations: copyFormValue(part?.locations) || [] };
}

/**
 * Asserted locations part editor.
 * Thesauri: geo-location-tags, assertion-tags, doc-reference-types,
 * doc-reference-tags.
 */
@Component({
  selector: 'cadmus-asserted-locations-part',
  templateUrl: './asserted-locations-part.component.html',
  styleUrls: ['./asserted-locations-part.component.css'],
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
    AssertedLocationComponent,
    MatCardActions,
    CloseSaveButtonsComponent,
    HelpLinkComponent,
    // MapLibre
    MapComponent,
    MarkerComponent,
    ControlComponent,
    NavigationControlDirective,
    ScaleControlDirective,
    GeoJSONSourceComponent,
    LayerComponent,
  ],
})
export class AssertedLocationsPartComponent extends ModelEditorComponentBase<AssertedLocationsPart> {
  private readonly _dialogService = inject(DialogService);

  public readonly edited = signal<AssertedLocation | undefined>(undefined);
  public readonly editedIndex = signal<number>(-1);

  public readonly selectedLocation = signal<AssertedLocation | undefined>(
    undefined,
  );

  // geo-location-tags
  public readonly locTagEntries = computed(
    () => this.data()?.thesauri?.['geo-location-tags']?.entries,
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
    NgxToolsSignalValidators.strictMinLength(p.locations, 1);
  });

  // overview map
  public readonly mapStyle = DEFAULT_MAP_STYLE;
  public readonly mapReady = signal(false);
  public readonly mapLocations = computed(() =>
    this.form.locations().value(),
  );
  public readonly mapCenter = signal<LngLatLike>([0, 20]);
  public readonly mapZoom = signal<number>(4);
  private _overviewMap?: MaplibreMap;

  public readonly labelsGeoJSON = computed<FeatureCollection>(() => {
    const locs = this.mapLocations();
    return {
      type: 'FeatureCollection',
      features: locs.map((loc) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [loc.value.longitude, loc.value.latitude],
        },
        properties: {
          label: loc.value.label || '',
        },
      })),
    };
  });

  constructor() {
    super();
    this.initSettings<AssertedLocationsPartSettings>(
      ASSERTED_LOCATIONS_PART_TYPEID,
      (settings) =>
        this.lookupProviderOptions.set(
          settings?.lookupProviderOptions || undefined,
        ),
    );
  }

  protected override onDataSet(
    data?: EditedObject<AssertedLocationsPart>,
  ): void {
    // fit overview map to locations
    if (this._overviewMap && data?.value?.locations?.length) {
      setTimeout(() => this.fitMapToLocations());
    }
  }

  protected getValue(): AssertedLocationsPart {
    const part = this.getEditedPart(
      ASSERTED_LOCATIONS_PART_TYPEID,
    ) as AssertedLocationsPart;
    part.locations = copyFormValue(this._draft().locations);
    return part;
  }

  //#region Overview map
  public onOverviewMapLoad(map: MaplibreMap): void {
    this._overviewMap = map;
    this.mapReady.set(true);
    map.resize();
    if (this._draft().locations.length) {
      setTimeout(() => this.fitMapToLocations());
    }
  }

  public fitMapToLocations(): void {
    const locations = this._draft().locations;
    if (!this._overviewMap || !locations.length) {
      return;
    }
    // single location: fly to it
    if (locations.length === 1) {
      const loc = locations[0];
      this._overviewMap.flyTo({
        center: [loc.value.longitude, loc.value.latitude],
        zoom: 10,
      });
      return;
    }
    // multiple locations: fit bounds
    const bounds = new LngLatBounds();
    for (const loc of locations) {
      bounds.extend([loc.value.longitude, loc.value.latitude]);
    }
    this._overviewMap.fitBounds(bounds, {
      padding: 50,
      maxZoom: 14,
    });
  }

  public flyToLocation(location: AssertedLocation): void {
    if (!this._overviewMap) {
      return;
    }
    this._overviewMap.flyTo({
      center: [location.value.longitude, location.value.latitude],
      zoom: 14,
    });
  }
  //#endregion

  //#region Locations CRUD
  private setLocations(locations: AssertedLocation[]): void {
    this.form.locations().value.set(locations);
    this.form.locations().markAsDirty();
  }

  public addLocation(): void {
    const entry: AssertedLocation = {
      value: { label: '', latitude: 0, longitude: 0 },
    };
    this.editLocation(entry, -1);
  }

  public editLocation(entry: AssertedLocation, index: number): void {
    this.editedIndex.set(index);
    this.edited.set(copyFormValue(entry));
  }

  public closeLocation(): void {
    this.editedIndex.set(-1);
    this.edited.set(undefined);
  }

  public saveLocation(entry: AssertedLocation): void {
    const locations = [...this._draft().locations];
    if (this.editedIndex() === -1) {
      locations.push(copyFormValue(entry));
    } else {
      locations.splice(this.editedIndex(), 1, copyFormValue(entry));
    }
    this.setLocations(locations);
    this.closeLocation();
  }

  public deleteLocation(index: number): void {
    this._dialogService
      .confirm('Confirmation', 'Delete location?')
      .pipe(take(1))
      .subscribe((yes) => {
        if (yes) {
          if (this.editedIndex() === index) {
            this.closeLocation();
          }
          this.setLocations(
            this._draft().locations.filter((_, i) => i !== index),
          );
        }
      });
  }

  public moveLocationUp(index: number): void {
    if (index < 1) {
      return;
    }
    const locations = [...this._draft().locations];
    const location = locations.splice(index, 1)[0];
    locations.splice(index - 1, 0, location);
    this.setLocations(locations);
  }

  public moveLocationDown(index: number): void {
    const locations = [...this._draft().locations];
    if (index + 1 >= locations.length) {
      return;
    }
    const location = locations.splice(index, 1)[0];
    locations.splice(index + 1, 0, location);
    this.setLocations(locations);
  }
  //#endregion
}
