# Cadmus Geography Shell

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.0.4.

- [models](https://github.com/vedph/cadmus-geo)
- [API](https://github.com/vedph/cadmus-geo-api)

This shell is used to develop Cadmus frontend geography libraries.

- [Cadmus Geography Shell](#cadmus-geography-shell)
  - [Docker](#docker)
  - [Requirements](#requirements)
  - [History](#history)
    - [2.0.0](#200)
    - [1.0.0](#100)
    - [0.0.2](#002)

## Docker

Quick Docker image build:

1. `npm run build-lib`;
2. update version in `env.js` and `ng build`;
3. `docker build . -t vedph2020/cadmus-geo-shell:1.0.0 -t vedph2020/cadmus-geo-shell:latest` (replace with the current version).

## Requirements

This requires Leaflet via [ngx-leaflet](https://github.com/bluehalo/ngx-leaflet).

(1) install packages:

```bash
npm install leaflet @asymmetrik/ngx-leaflet
npm install --save-dev @types/leaflet
```

(2) in `angular.json` under `styles` add the leaflet CSS stylesheet:

```json
"styles": [
  "./node_modules/leaflet/dist/leaflet.css"
]
```

(3) manually copy images from `node_modules/leaflet/dist/images` to `src/assets/images`.

(4) import the corresponding module in your root component or module:

```ts
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

...
imports: [
  LeafletModule
]
...
```

## History

- 2024-03-22: ⚠️ replaced MapboxGL with Leaflet, updating `@myrmidon/cadmus-part-geo-asserted-locations` version. This is a breaking change for clients, which should replace the mapping library.
- 2024-03-21: updated Angular and packages, replacing `ngx-monaco-editor` with [ngx-monaco-editor-v2](https://github.com/miki995/ngx-monaco-editor-v2). This changes affects only the shell UI, not the libraries.

### 2.0.0

- 2023-11-09: ⚠️ upgraded to Angular 17.
- 2023-11-07:
  - updated Angular and packages.
  - removed ELF.
  - opted in thesauri import.

### 1.0.0

- 2023-06-17:
  - updated Angular and packages.
  - moved to PostgreSQL.
- 2023-05-24: updated Angular and packages. No changes required for introducing AssertedCompositeId here, so libraries versions stay the same.
- 2023-05-12: updated to Angular 16.
- 2023-02-11:
  - updated packages.
  - fixes to asserted toponyms.
- 2023-01-17:
  - layout of location part.
  - fixes to toponym editor.
  - updated packages.

### 0.0.2

- 2023-01-12:
  - added tag to location and toponym.
  - updated Angular and packages.
