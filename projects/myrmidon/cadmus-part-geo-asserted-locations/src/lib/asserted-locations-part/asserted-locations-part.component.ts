import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  UntypedFormGroup,
} from '@angular/forms';
import { debounceTime, take } from 'rxjs/operators';

import {
  LngLat,
  LngLatBounds,
  LngLatLike,
  Map,
  Marker,
  NavigationControl,
} from 'mapbox-gl';

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

/**
 * Asserted locations part editor.
 * Thesauri: assertion-tags, doc-reference-types, doc-reference-tags.
 */
@Component({
  selector: 'cadmus-asserted-locations-part',
  templateUrl: './asserted-locations-part.component.html',
  styleUrls: ['./asserted-locations-part.component.css'],
})
export class AssertedLocationsPartComponent
  extends ModelEditorComponentBase<AssertedLocationsPart>
  implements OnInit
{
  private _editedIndex: number;
  private _rendered?: boolean;
  private _map?: Map;
  private _updating?: boolean;

  public edited: AssertedLocation | undefined;

  // assertion-tags
  public assTagEntries?: ThesaurusEntry[] | undefined;

  // doc-reference-types
  public refTypeEntries: ThesaurusEntry[] | undefined;

  // doc-reference-tags
  public refTagEntries: ThesaurusEntry[] | undefined;

  public locations: FormControl<AssertedLocation[]>;
  public mapToken?: string;
  public markers: Marker[];

  constructor(
    authService: AuthJwtService,
    formBuilder: FormBuilder,
    private _dialogService: DialogService,
    env: EnvService
  ) {
    super(authService, formBuilder);
    this._editedIndex = -1;
    this.mapToken = env.get('mapbox_token');
    this.markers = [];
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
    let key = 'assertion-tags';
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

  public onMapLoad(map: Map): void {
    this._map = map;
    // navigation
    this._map.addControl(new NavigationControl());
    this.updateMarkers(this.locations.value);
  }

  public onMapRender(event: any): void {
    // resize to fit container
    // https://github.com/Wykks/ngx-mapbox-gl/issues/344
    if (!this._rendered) {
      event.target.resize();
      this._rendered = true;
    }
  }

  private getRectBounds(points: LngLat[]): LngLatBounds {
    // min lng,lat and max lng,lat
    const min = new LngLat(180, 90);
    const max = new LngLat(-180, -90);
    points.forEach((pt) => {
      // min
      if (min.lng > pt.lng) {
        min.lng = pt.lng;
      }
      if (min.lat > pt.lat) {
        min.lat = pt.lat;
      }
      // max
      if (max.lng < pt.lng) {
        max.lng = pt.lng;
      }
      if (max.lat < pt.lat) {
        max.lat = pt.lat;
      }
    });
    return new LngLatBounds(min, max);
  }

  private updateMarkers(locations: AssertedLocation[]): void {
    // remove all markers from map
    this.markers.forEach((m) => m.remove());

    // add markers from locations
    this.markers = locations.map((l) => {
      const m = new Marker();
      m.setLngLat({
        lng: l.point.lon,
        lat: l.point.lat,
      });
      m.addTo(this._map!);
      return m;
    });

    // if there is a single marker, center the map on it;
    // else fit it to the markers bounds
    if (this.markers.length === 1) {
      this._map?.setCenter(this.markers[0].getLngLat());
    } else {
      // https://stackoverflow.com/questions/16845614/zoom-to-fit-all-markers-in-mapbox-or-leaflet
      this._map?.fitBounds(
        this.getRectBounds(this.markers.map((m) => m.getLngLat())),
        {
          padding: 20,
        }
      );
    }
  }

  public setMapCenter(point: LngLatLike): void {
    this._map?.setCenter(point);
  }
}
