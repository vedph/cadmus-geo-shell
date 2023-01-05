# CadmusPartGeoAssertedLocations

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.0.0.

## Requirements

This editor uses [NGX MapBoxGL](https://github.com/Wykks/ngx-mapbox-gl).

The app using this part editor must:

- install packages:

```bash
npm install ngx-mapbox-gl mapbox-gl
npm install @types/mapbox-gl --save-dev
```

- import global styles in styles.css:

```css
@import '~mapbox-gl/dist/mapbox-gl.css';
```

- import `NgxMapboxGLModule`.
- add a MapBoxGL token to `env.js` with name `mapbox_token`.
