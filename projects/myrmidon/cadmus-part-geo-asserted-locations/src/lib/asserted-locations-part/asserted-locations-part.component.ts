import { Component, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { debounceTime, take } from 'rxjs/operators';
import { TitleCasePipe } from '@angular/common';

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

import { LeafletModule } from '@bluehalo/ngx-leaflet';
import {
  latLng,
  latLngBounds,
  marker,
  tileLayer,
  Map,
  icon,
  layerGroup,
  Layer,
  Marker,
} from 'leaflet';

import { AssertedLocationComponent } from '../asserted-location/asserted-location.component';
import {
  AssertedLocation,
  AssertedLocationsPart,
  ASSERTED_LOCATIONS_PART_TYPEID,
} from '../asserted-locations-part';

const OSM_ATTR =
  '&copy; <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

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
    LeafletModule,
    MatCardActions,
    CloseSaveButtonsComponent,
  ],
})
export class AssertedLocationsPartComponent
  extends ModelEditorComponentBase<AssertedLocationsPart>
  implements OnInit
{
  private _updating?: boolean;
  private _map?: Map;

  public readonly edited = signal<AssertedLocation | undefined>(undefined);
  public readonly editedIndex = signal<number>(-1);

  public readonly leafletLayers = signal<Layer[]>([]);
  public readonly selectedLocation = signal<AssertedLocation | undefined>(
    undefined
  );

  public readonly leafletOptions = signal<any>({
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: OSM_ATTR,
      }),
    ],
    zoom: 5,
    center: latLng(46.879966, -121.726909),
  });

  public readonly layersControl = signal<any>({
    baseLayers: {
      'Open Street Map': tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 18, attribution: OSM_ATTR }
      ),
    },
    overlays: {
      Markers: layerGroup([]),
    },
  });
  // TODO use this to provide an additional layer (satellite imagery) from mapbox
  public readonly mapToken = signal<string | undefined>(undefined);

  // geo-location-tags
  public readonly locTagEntries = signal<ThesaurusEntry[] | undefined>(
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

  public locations: FormControl<AssertedLocation[]>;

  constructor(
    authService: AuthJwtService,
    formBuilder: FormBuilder,
    private _dialogService: DialogService,
    env: EnvService
  ) {
    super(authService, formBuilder);
    this.mapToken.set(env.get('mapbox_token'));
    // form
    this.locations = formBuilder.control([], {
      // at least 1 entry
      validators: NgxToolsValidators.strictMinLengthValidator(1),
      nonNullable: true,
    });
  }

  public override ngOnInit(): void {
    super.ngOnInit();
    // update markers when locations are updated
    this.locations.valueChanges
      .pipe(debounceTime(200))
      .subscribe((locations) => {
        if (!this._updating) {
          this.updateMarkers(locations);
        }
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
      return;
    }
    this._updating = true;
    this.locations.setValue(part.locations || []);
    this.form.markAsPristine();
    this._updating = false;
  }

  protected override onDataSet(
    data?: EditedObject<AssertedLocationsPart>
  ): void {
    // thesauri
    if (data?.thesauri) {
      this.updateThesauri(data.thesauri);
    }

    // form
    this.updateForm(data?.value);
  }

  protected getValue(): AssertedLocationsPart {
    let part = this.getEditedPart(
      ASSERTED_LOCATIONS_PART_TYPEID
    ) as AssertedLocationsPart;
    part.locations = this.locations.value || [];
    return part;
  }

  public addAssertedLocation(): void {
    const entry: AssertedLocation = {
      point: { lat: 0, lon: 0 },
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

  private isMarker(layer: any): boolean {
    return typeof layer.getLatLng === 'function';
  }

  public fitMapToMarkers() {
    if (!this._map || !this.leafletLayers().length) return;

    const latlngs = this.leafletLayers()
      .filter((layer: Layer) => this.isMarker(layer))
      .map((marker) => (marker as Marker).getLatLng());
    const bounds = latLngBounds(latlngs);
    this._map.fitBounds(bounds);
  }

  private createMarker(
    latlng: [number, number],
    label?: string,
    permanent = true
  ) {
    const newMarker = marker(latlng, {
      icon: icon({
        iconSize: [25, 41],
        iconAnchor: [13, 41],
        iconUrl: 'img/marker-icon.png',
        shadowUrl: 'img/marker-shadow.png',
      }),
    }).setLatLng(latlng);
    if (label) {
      newMarker.bindTooltip(label, {
        permanent: permanent,
        direction: 'top',
        offset: [0, -35],
      });
    }
    newMarker.on('click', () => this.handleMarkerClick(latlng));
    return newMarker;
  }

  private handleMarkerClick(latlng: [number, number]) {
    // find location with latlng and select it
    const location = this.locations.value.find(
      (l) => l.point.lat === latlng[0] && l.point.lon === latlng[1]
    );
    if (location) {
      this.selectedLocation.set(location);
    }
  }

  public ngAfterViewInit() {
    this.fitMapToMarkers();
  }

  public onMapReady(map: Map) {
    this._map = map;
  }

  public flyToLocation(lat: number, lng: number, zoom = 10) {
    if (!this._map) return;

    this._map.flyTo(latLng(lat, lng), zoom);
  }

  private updateMarkers(locations: AssertedLocation[]): void {
    // add markers from locations
    this.leafletLayers.set(
      locations.map((l) => {
        const m = this.createMarker([l.point.lat, l.point.lon]);
        return m;
      })
    );

    // if there is a single marker, center the map on it;
    // else fit it to the markers bounds
    if (this.leafletLayers().length === 1) {
      const marker = this.leafletLayers()[0];
      if (this.isMarker(marker)) {
        const latLng = (marker as Marker).getLatLng();
        this.flyToLocation(latLng.lat, latLng.lng);
      }
    } else {
      this.fitMapToMarkers();
    }
  }
}
