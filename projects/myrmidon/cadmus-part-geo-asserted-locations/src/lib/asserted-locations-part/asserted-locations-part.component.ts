import { Component, computed, signal } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { take } from 'rxjs/operators';
import { TitleCasePipe } from '@angular/common';
import type { FeatureCollection } from 'geojson';
import { Map as MaplibreMap, LngLatBounds, LngLatLike } from 'maplibre-gl';

import { deepCopy, EnvService, NgxToolsValidators } from '@myrmidon/ngx-tools';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import { AuthJwtService } from '@myrmidon/auth-jwt-login';

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
 * Asserted locations part editor.
 * Thesauri: geo-location-tags, assertion-tags, doc-reference-types,
 * doc-reference-tags.
 */
@Component({
  selector: 'cadmus-asserted-locations-part',
  templateUrl: './asserted-locations-part.component.html',
  styleUrls: ['./asserted-locations-part.component.css'],
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
    AssertedLocationComponent,
    MatCardActions,
    CloseSaveButtonsComponent,
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
  public readonly edited = signal<AssertedLocation | undefined>(undefined);
  public readonly editedIndex = signal<number>(-1);

  public readonly selectedLocation = signal<AssertedLocation | undefined>(
    undefined,
  );

  // geo-location-tags
  public readonly locTagEntries = signal<ThesaurusEntry[] | undefined>(
    undefined,
  );
  // assertion-tags
  public readonly assTagEntries = signal<ThesaurusEntry[] | undefined>(
    undefined,
  );
  // doc-reference-types
  public readonly refTypeEntries = signal<ThesaurusEntry[] | undefined>(
    undefined,
  );
  // doc-reference-tags
  public readonly refTagEntries = signal<ThesaurusEntry[] | undefined>(
    undefined,
  );

  // lookup options depending on role
  public readonly lookupProviderOptions = signal<
    LookupProviderOptions | undefined
  >(undefined);

  public locations: FormControl<AssertedLocation[]>;

  // overview map
  public readonly mapStyle = DEFAULT_MAP_STYLE;
  public readonly mapReady = signal(false);
  public readonly mapLocations = signal<AssertedLocation[]>([]);
  public readonly mapCenter = signal<LngLatLike>([0, 20]);
  public readonly mapZoom = signal<[number]>([2]);
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

  constructor(
    authService: AuthJwtService,
    formBuilder: FormBuilder,
    private _dialogService: DialogService,
    env: EnvService,
  ) {
    super(authService, formBuilder);
    // form
    this.locations = formBuilder.control([], {
      // at least 1 entry
      validators: NgxToolsValidators.strictMinLengthValidator(1),
      nonNullable: true,
    });
    // keep overview map in sync with form control
    this.locations.valueChanges.subscribe((locs) => {
      this.mapLocations.set([...locs]);
    });
  }

  protected buildForm(formBuilder: FormBuilder): FormGroup | UntypedFormGroup {
    return formBuilder.group({
      entries: this.locations,
    });
  }

  private updateThesauri(thesauri: ThesauriSet): void {
    let key = 'geo-location-tags';
    if (this.hasThesaurus(key)) {
      this.locTagEntries.set(thesauri[key].entries);
    } else {
      this.locTagEntries.set(undefined);
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

  private updateForm(part?: AssertedLocationsPart | null): void {
    if (!part) {
      this.form.reset();
      this.mapLocations.set([]);
      return;
    }
    this.locations.setValue(part.locations || []);
    this.form.markAsPristine();
    // fit overview map to locations
    if (this._overviewMap && part.locations?.length) {
      setTimeout(() => this.fitMapToLocations());
    }
  }

  protected override onDataSet(
    data?: EditedObject<AssertedLocationsPart>,
  ): void {
    // thesauri
    if (data?.thesauri) {
      this.updateThesauri(data.thesauri);
    }
    // settings
    this._appRepository
      ?.getSettingFor<AssertedLocationsPartSettings>(
        ASSERTED_LOCATIONS_PART_TYPEID,
        this.identity()?.roleId || undefined,
      )
      .then((settings) => {
        const options = settings?.lookupProviderOptions;
        this.lookupProviderOptions.set(options || undefined);
      });
    // form
    this.updateForm(data?.value);
  }

  protected getValue(): AssertedLocationsPart {
    let part = this.getEditedPart(
      ASSERTED_LOCATIONS_PART_TYPEID,
    ) as AssertedLocationsPart;
    part.locations = this.locations.value || [];
    return part;
  }

  //#region Overview map
  public onOverviewMapLoad(map: MaplibreMap): void {
    this._overviewMap = map;
    this.mapReady.set(true);
    map.resize();
    if (this.locations.value.length) {
      setTimeout(() => this.fitMapToLocations());
    }
  }

  public fitMapToLocations(): void {
    if (!this._overviewMap || !this.locations.value.length) {
      return;
    }
    // single location: fly to it
    if (this.locations.value.length === 1) {
      const loc = this.locations.value[0];
      this._overviewMap.flyTo({
        center: [loc.value.longitude, loc.value.latitude],
        zoom: 10,
      });
      return;
    }
    // multiple locations: fit bounds
    const bounds = new LngLatBounds();
    for (const loc of this.locations.value) {
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
  public addAssertedLocation(): void {
    const entry: AssertedLocation = {
      value: { label: 'location', latitude: 0, longitude: 0 },
    };
    this.editAssertedLocation(entry, -1);
  }

  public editAssertedLocation(entry: AssertedLocation, index: number): void {
    this.editedIndex.set(index);
    this.edited.set(deepCopy(entry));
  }

  public closeAssertedLocation(): void {
    this.editedIndex.set(-1);
    this.edited.set(undefined);
  }

  public saveAssertedLocation(entry: AssertedLocation): void {
    const locations = [...this.locations.value];
    if (this.editedIndex() === -1) {
      locations.push(entry);
    } else {
      locations.splice(this.editedIndex(), 1, entry);
    }
    this.locations.setValue(locations);
    this.locations.markAsDirty();
    this.locations.updateValueAndValidity();
    this.closeAssertedLocation();
  }

  public deleteAssertedLocation(index: number): void {
    this._dialogService
      .confirm('Confirmation', 'Delete location?')
      .pipe(take(1))
      .subscribe((yes) => {
        if (yes) {
          if (this.editedIndex() === index) {
            this.closeAssertedLocation();
          }
          const locations = [...this.locations.value];
          locations.splice(index, 1);
          this.locations.setValue(locations);
          this.locations.markAsDirty();
          this.locations.updateValueAndValidity();
        }
      });
  }

  public moveAssertedLocationUp(index: number): void {
    if (index < 1) {
      return;
    }
    const location = this.locations.value[index];
    const locations = [...this.locations.value];
    locations.splice(index, 1);
    locations.splice(index - 1, 0, location);
    this.locations.setValue(locations);
    this.locations.markAsDirty();
    this.locations.updateValueAndValidity();
  }

  public moveAssertedLocationDown(index: number): void {
    if (index + 1 >= this.locations.value.length) {
      return;
    }
    const location = this.locations.value[index];
    const locations = [...this.locations.value];
    locations.splice(index, 1);
    locations.splice(index + 1, 0, location);
    this.locations.setValue(locations);
    this.locations.markAsDirty();
    this.locations.updateValueAndValidity();
  }
  //#endregion
}
