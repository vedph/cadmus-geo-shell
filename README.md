# Cadmus Geography Shell

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.0.4.

- [models](https://github.com/vedph/cadmus-geo)
- [API](https://github.com/vedph/cadmus-geo-api)

This shell is used to develop Cadmus frontend geography libraries.

## Docker

Quick Docker image build:

1. `npm run build-lib`
2. update version in `env.js` and `ng build`
3. `docker build . -t vedph2020/cadmus-geo-shell:0.0.1 -t vedph2020/cadmus-geo-shell:latest` (replace with the current version).
