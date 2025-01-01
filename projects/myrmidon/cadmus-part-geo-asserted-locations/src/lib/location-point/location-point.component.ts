import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs';

import { LocationPoint } from '../asserted-locations-part';
import { GeoLocationService } from '../services/geo-location.service';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIconButton, MatIconAnchor } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';

/**
 * A geographic point defined by latitude and longitude.
 * Set the point via point and observe its changes via pointChange.
 * When hasLocator is true, user can use geolocation to get his position;
 * in this case, you can customize the geolocation service options via
 * positionOptions. If the geolocation service is not available, even
 * setting hasLocator to true will have no effect.
 */
@Component({
  selector: 'cadmus-location-point',
  templateUrl: './location-point.component.html',
  styleUrls: ['./location-point.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatIconButton,
    MatTooltip,
    MatIcon,
    MatIconAnchor,
    DecimalPipe,
  ],
})
export class LocationPointComponent implements OnInit, OnDestroy {
  private _sub?: Subscription;
  private _changeFrozen?: boolean;
  private _point: LocationPoint | undefined | null;

  @Input()
  public get point(): LocationPoint | undefined | null {
    return this._point;
  }
  public set point(value: LocationPoint | undefined | null) {
    if (this._point === value) {
      return;
    }
    this._point = value;
    this.updateForm(value);
  }

  @Input()
  public hasLocator?: boolean;

  @Input()
  public positionOptions: PositionOptions;

  @Output()
  public pointChange: EventEmitter<LocationPoint>;

  public locating?: boolean;
  public location?: GeolocationPosition;

  // form
  public lat: FormControl<number>;
  public lon: FormControl<number>;
  public form: FormGroup;

  constructor(
    formBuilder: FormBuilder,
    private _geoService: GeoLocationService
  ) {
    this.lat = formBuilder.control(0, {
      validators: Validators.required,
      nonNullable: true,
    });
    this.lon = formBuilder.control(0, {
      validators: Validators.required,
      nonNullable: true,
    });
    this.form = formBuilder.group({
      lat: this.lat,
      lon: this.lon,
    });
    this.positionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10 * 1000,
    };
    // event
    this.pointChange = new EventEmitter<LocationPoint>();
  }

  ngOnInit(): void {
    // disable locator if not available
    if (this.hasLocator && !this._geoService.isAvailable()) {
      this.hasLocator = false;
    }
    // emit on change
    this._sub = this.form.valueChanges
      .pipe(debounceTime(300))
      .subscribe((v) => {
        if (!this._changeFrozen) {
          this.fireChange();
        }
      });
  }

  ngOnDestroy(): void {
    this._sub?.unsubscribe();
  }

  private fireChange(): void {
    this.pointChange.emit({
      lat: this.lat.value,
      lon: this.lon.value,
    });
  }

  private updateForm(point: LocationPoint | undefined | null): void {
    this._changeFrozen = true;

    if (!point) {
      this.form.reset();
      this._changeFrozen = false;
      return;
    }

    this.lat.setValue(point.lat);
    this.lat.markAsDirty();
    this.lat.updateValueAndValidity();
    this.lon.setValue(point.lon);
    this.lon.markAsDirty();
    this.lon.updateValueAndValidity();

    this.form.markAsPristine();
    this._changeFrozen = false;
  }

  public async setCurrentPosition() {
    if (this.locating) {
      return;
    }

    this.locating = true;
    this.location = undefined;

    try {
      this.location = await this._geoService.getCurrentPosition(
        this.positionOptions
      );
      this._changeFrozen = true;
      this.lat.setValue(this.location.coords.latitude);
      this.lon.setValue(this.location.coords.longitude);
      this._changeFrozen = false;
      this.locating = false;
      this.fireChange();
    } catch (err) {
      console.error(err ? JSON.stringify(err) : 'Error locating position');
      this.locating = false;
    }
  }
}
