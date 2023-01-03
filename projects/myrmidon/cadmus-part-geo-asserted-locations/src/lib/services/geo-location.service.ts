import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GeoLocationService {
  constructor() {}

  public isAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  public getCurrentPosition(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, options)
    );
  }
}
