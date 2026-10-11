# Configuring MapLibre in an Angular workspace

Applies to `maplibre-gl` 6.x with `@maplibre/ngx-maplibre-gl` 22.x, in an app built with `@angular/build:application` (esbuild + Vite dev server). Verified with `maplibre-gl` 6.14.0 and `@maplibre/ngx-maplibre-gl` 22.2.0.

## Why any setup is needed

`maplibre-gl` v6 is ESM-only and loads its web worker from a separate file at runtime. It locates that file relative to `import.meta.url`, which after bundling points to an Angular chunk rather than to `maplibre-gl.mjs`. So the worker file must be served as a static asset and MapLibre must be told its URL. Without this, the worker request fails and the map never loads.

## Steps

1. Install both packages in the app workspace:

   ```sh
   pnpm add maplibre-gl @maplibre/ngx-maplibre-gl
   ```

   In a library that uses maps, list both under `peerDependencies` instead.

2. In `angular.json`, under the app's `build.options.assets`, copy the worker files:

   ```json
   {
     "glob": "maplibre-gl-{worker,shared}.mjs",
     "input": "node_modules/maplibre-gl/dist",
     "output": "assets/maplibre-gl"
   }
   ```

   Up to 6.11.x the worker imports `maplibre-gl-shared.mjs` from the same folder, so both files must sit together. In 6.14.0 the worker is self-contained and the shared file is an empty stub. Copying both works for every 6.x version.

   If `allowedCommonJsDependencies` still lists `maplibre-gl` from v5, remove it.

3. In `app.config.ts`, provide the worker URL. The path is relative to the base href, and must match the `output` folder of step 2:

   ```ts
   import { provideMaplibreWorker } from '@maplibre/ngx-maplibre-gl/config';

   export const appConfig: ApplicationConfig = {
     providers: [
       // ...
       provideMaplibreWorker('assets/maplibre-gl/maplibre-gl-worker.mjs'),
     ],
   };
   ```

   Do not also call `setWorkerUrl` from `maplibre-gl` in `main.ts`. It works, but it pulls the whole of `maplibre-gl` into the initial bundle, and ngx-maplibre-gl still logs its "MAPLIBRE_WORKER_URL is not provided" warning. If a workspace has that call from an earlier setup, delete it.

4. In the global stylesheet (`styles.scss`), import the MapLibre CSS:

   ```scss
   @import "maplibre-gl/dist/maplibre-gl.css";
   ```

5. In each component using a map, import the standalone pieces you need from `@maplibre/ngx-maplibre-gl` (`MapComponent`, `MarkerComponent`, `ControlComponent`, ...), and give the `mgl-map` host element an explicit height in CSS.

## After upgrading maplibre-gl

The main library is bundled into the app, while the worker is a separate file at a fixed URL. They must come from the same `maplibre-gl` version: a mismatched pair breaks the map (tiles never render; the console may show `can't deserialize unregistered class ...`, or nothing at all).

After any `maplibre-gl` version change:

1. Stop `ng serve`.
2. Delete `.angular/cache`.
3. Start `ng serve` again and hard-reload the browser tab (Ctrl+F5).

For deployed apps, make sure the web server does not serve `assets/maplibre-gl/*.mjs` from a long-lived cache, because the file name carries no hash.

## Checks when the map does not load

- In the browser's Network tab, `assets/maplibre-gl/maplibre-gl-worker.mjs` must return 200 with a JavaScript content type (`text/javascript` or `application/javascript`). A 404 means step 2 or the URL of step 3 is wrong. `application/octet-stream` means the web server has no MIME mapping for `.mjs`: add one (in nginx, `types { application/javascript mjs; }` next to the `include mime.types;` line).
- The license comment at the top of the served worker file shows its version. It must equal the installed `maplibre-gl` version.
- These console warnings come from the OpenFreeMap "liberty" style, not from the setup, and are harmless:
  `layers[highway-shield-non-us].filter[1]: Expected value to be of type number, but found null instead.`
