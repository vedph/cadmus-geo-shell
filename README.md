# Cadmus Geography Shell

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.0.4.

- [models](https://github.com/vedph/cadmus-geo)
- [API](https://github.com/vedph/cadmus-geo-api)

This shell is used to develop Cadmus frontend geography libraries.

- [Cadmus Geography Shell](#cadmus-geography-shell)
  - [Docker](#docker)
  - [Requirements](#requirements)
  - [History](#history)
    - [0.0.2](#002)

## Docker

Quick Docker image build:

1. `npm run build-lib`
2. update version in `env.js` and `ng build`
3. `docker build . -t vedph2020/cadmus-geo-shell:0.0.2 -t vedph2020/cadmus-geo-shell:latest` (replace with the current version).

## Requirements

The asserted locations part uses MapBoxGL, so it has its own [specific requirements](projects/myrmidon/cadmus-part-geo-asserted-locations/README.md).

## History

- 2023-01-17:
  - layout of location part.
  - fixes to toponym editor.
  - updated packages.

### 0.0.2

- 2023-01-12:
  - added tag to location and toponym.
  - updated Angular and packages.
