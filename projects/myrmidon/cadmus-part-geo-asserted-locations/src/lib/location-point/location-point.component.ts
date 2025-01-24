import {
  Component,
  effect,
  input,
  model,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';

import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIconButton, MatIconAnchor } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

import { LocationPoint } from '../asserted-locations-part';
import { GeoLocationService } from '../services/geo-location.service';

/**
 * An editor for a geographic point defined by latitude and longitude.
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
  private _dropNextInput?: boolean;
  private _updatingForm?: boolean;

  public hasService = true;

  /**
   * The point to edit.
   */
  public readonly point = model<LocationPoint>();

  /**
   * When true, the user can use geolocation to get his position.
   */
  public readonly hasLocator = input<boolean>();

  /**
   * The geolocation service options.
   */
  public readonly positionOptions = input<PositionOptions>({
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 10 * 1000,
  });

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

    // when point is set, update form
    effect(() => {
      const point = this.point();
      console.log('point input', point);
      if (this._dropNextInput) {
        console.log('dropped input');
        this._dropNextInput = false;
        return;
      }
      this.updateForm(point);
    });
  }

  public ngOnInit(): void {
    // disable locator if not available
    if (!this._geoService.isAvailable()) {
      this.hasService = false;
    }

    // when form changes, update point
    this._sub = this.form.valueChanges.subscribe(() => {
      if (this._updatingForm) {
        return;
      }
      const point = this.getPoint();
      console.log('form changed', point);
      this._dropNextInput = true;
      this.point.set(point);
    });
  }

  public ngOnDestroy(): void {
    this._sub?.unsubscribe();
  }

  private getPoint(): LocationPoint {
    return {
      lat: this.lat.value,
      lon: this.lon.value,
    };
  }

  private updateForm(point: LocationPoint | undefined | null): void {
    this._updatingForm = true;
    console.log('updateForm', point);
    if (!point) {
      this.form.reset();
      this._updatingForm = false;
      return;
    }

    this.lat.setValue(point.lat);
    this.lon.setValue(point.lon);
    this.form.markAsPristine();

    this._updatingForm = false;
  }

  public async setCurrentPosition() {
    if (this.locating) {
      return;
    }

    this.locating = true;
    this.location = undefined;

    try {
      this.location = await this._geoService.getCurrentPosition(
        this.positionOptions()
      );
      this.lat.setValue(this.location.coords.latitude);
      this.lon.setValue(this.location.coords.longitude);
      this.locating = false;
      this.point.set(this.getPoint());
    } catch (err) {
      console.error(err ? JSON.stringify(err) : 'Error locating position');
      this.locating = false;
    }
  }
}
