import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  UntypedFormGroup,
} from '@angular/forms';
import { debounceTime, take } from 'rxjs/operators';

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

import { EnvService, NgToolsValidators } from '@myrmidon/ng-tools';
import { DialogService } from '@myrmidon/ng-mat-tools';
import { AuthJwtService } from '@myrmidon/auth-jwt-login';
import { EditedObject, ModelEditorComponentBase } from '@myrmidon/cadmus-ui';

import { ThesauriSet, ThesaurusEntry } from '@myrmidon/cadmus-core';
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
  standalone: false,
})
export class AssertedLocationsPartComponent
  extends ModelEditorComponentBase<AssertedLocationsPart>
  implements OnInit
{
  private _editedIndex: number;
  private _updating?: boolean;
  private _map?: Map;

  public edited: AssertedLocation | undefined;

  public leafletLayers: Layer[] = [];
  public selectedLocation?: AssertedLocation;

  public leafletOptions = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: OSM_ATTR,
      }),
    ],
    zoom: 5,
    center: latLng(46.879966, -121.726909),
  };

  public layersControl = {
    baseLayers: {
      'Open Street Map': tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 18, attribution: OSM_ATTR }
      ),
    },
    overlays: {
      Markers: layerGroup([]),
    },
  };

  // geo-location-tags
  public locTagEntries?: ThesaurusEntry[];

  // assertion-tags
  public assTagEntries?: ThesaurusEntry[];

  // doc-reference-types
  public refTypeEntries?: ThesaurusEntry[];

  // doc-reference-tags
  public refTagEntries?: ThesaurusEntry[];

  public locations: FormControl<AssertedLocation[]>;
  // TODO use this to provide an additional layer (satellite imagery) from mapbox
  public mapToken?: string;

  constructor(
    authService: AuthJwtService,
    formBuilder: FormBuilder,
    private _dialogService: DialogService,
    env: EnvService
  ) {
    super(authService, formBuilder);
    this._editedIndex = -1;
    this.mapToken = env.get('mapbox_token');
    // form
    this.locations = formBuilder.control([], {
      // at least 1 entry
      validators: NgToolsValidators.strictMinLengthValidator(1),
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
      this.locTagEntries = thesauri[key].entries;
    } else {
      this.locTagEntries = undefined;
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
    this._editedIndex = index;
    this.edited = entry;
  }

  public closeAssertedLocation(): void {
    this._editedIndex = -1;
    this.edited = undefined;
  }

  public saveAssertedLocation(entry: AssertedLocation): void {
    const entries = [...this.locations.value];
    if (this._editedIndex === -1) {
      entries.push(entry);
    } else {
      entries.splice(this._editedIndex, 1, entry);
    }
    this.locations.setValue(entries);
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
          if (this._editedIndex === index) {
            this.closeAssertedLocation();
          }
          const entries = [...this.locations.value];
          entries.splice(index, 1);
          this.locations.setValue(entries);
          this.locations.markAsDirty();
          this.locations.updateValueAndValidity();
        }
      });
  }

  public moveAssertedLocationUp(index: number): void {
    if (index < 1) {
      return;
    }
    const entry = this.locations.value[index];
    const entries = [...this.locations.value];
    entries.splice(index, 1);
    entries.splice(index - 1, 0, entry);
    this.locations.setValue(entries);
    this.locations.markAsDirty();
    this.locations.updateValueAndValidity();
  }

  public moveAssertedLocationDown(index: number): void {
    if (index + 1 >= this.locations.value.length) {
      return;
    }
    const entry = this.locations.value[index];
    const entries = [...this.locations.value];
    entries.splice(index, 1);
    entries.splice(index + 1, 0, entry);
    this.locations.setValue(entries);
    this.locations.markAsDirty();
    this.locations.updateValueAndValidity();
  }

  private isMarker(layer: any): boolean {
    return typeof layer.getLatLng === 'function';
  }

  public fitMapToMarkers() {
    if (!this._map || !this.leafletLayers.length) return;

    const latlngs = this.leafletLayers
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
        iconUrl: 'assets/img/marker-icon.png',
        shadowUrl: 'assets/img/marker-shadow.png',
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
      this.selectedLocation = location;
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
    this.leafletLayers = locations.map((l) => {
      const m = this.createMarker([l.point.lat, l.point.lon]);
      return m;
    });

    // if there is a single marker, center the map on it;
    // else fit it to the markers bounds
    if (this.leafletLayers.length === 1) {
      const marker = this.leafletLayers[0];
      if (this.isMarker(marker)) {
        const latLng = (marker as Marker).getLatLng();
        this.flyToLocation(latLng.lat, latLng.lng);
      }
    } else {
      this.fitMapToMarkers();
    }
  }
}
