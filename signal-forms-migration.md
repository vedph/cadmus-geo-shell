# Signal forms migration log

Migration of the workspace libraries from reactive forms to Angular signal forms (`@angular/forms/signals`), following "Migrating a part editor" in the `cadmus-shell-v3` CHANGELOG (v20 of the `@myrmidon/cadmus-*` core packages).

Convention: **verified** means measured (test run, build, mutation check, or browser check) and says how. **Believed** means not measured, and says how it could be checked.

## Workspace

- Added `scripts/build-libs.mjs` (`pnpm build:libs [lib...]`): builds the given libraries and everything downstream, in dependency order derived from the libraries' `package.json` files and imports. Copied from `cadmus-shell-v3`.
- Added `scripts/check-local-libs.js` (`pnpm check-libs`, also run by `build:libs`): fails if a local library is not mapped by `tsconfig.json` paths to `./dist/myrmidon/<lib>`, or if a copy of it exists in `node_modules/@myrmidon`. Adapted from `cadmus-shell-v3` to read the library names from `projects/myrmidon/*/package.json` and to parse `tsconfig.json` with TypeScript (it contains comments).
  - Verified: passes on the current tree; exits 1 with a "real directory" error when an empty `node_modules/@myrmidon/cadmus-part-geo-pg` directory was created (then removed).
- Resolution of the local libraries: verified at the start that none exists in `node_modules/@myrmidon`; they resolve only through `tsconfig.json` paths to `dist/`.
- Libraries' `peerDependencies`: `cadmus-core`, `cadmus-state`, `cadmus-ui`, `cadmus-item-editor` raised to `^20.0.0` (the code now uses the v20 `ModelEditorComponentBase` API), and `@myrmidon/ngx-tools: ^3.0.2` added to the two UI libraries (first version exporting `NgxToolsSignalValidators`; verified present in the installed 3.0.2 typings).

## Facts verified while reading the installed packages

- `ModelEditorComponentBase` (cadmus-ui 20.0.0, read from `fesm2022`): an effect on `data()` calls `form().reset()` and then `onDataSet()`; `save()` marks an invalid form as touched, else calls `updateValue(getValue())` and `form().reset()`; `isDirty` is `computed(() => form().dirty())`, and `dirtyChange` is emitted from an effect (so asynchronously); `initSettings()` loads settings in an effect keyed on `identity()`.
- `CloseSaveButtonsComponent`: plain `type="button"` buttons, emits `saveRequest`.
- Child editors and whether they emit without a user action:
  - `cadmus-refs-assertion` 11.0.5 (`AssertionComponent`): signal forms, 300 ms autosave, guarded by an "is draft in sync" check, so it does not emit merely on receiving a value (read from source).
  - `cadmus-refs-proper-name` 11.0.2 (`ProperNameComponent`): 300 ms debounced emission on language/tag value, comparing `getName()` with the bound name by `JSON.stringify`. So it emits a normalized copy when the bound name has e.g. `tag: null`, and emits `undefined` when the name has no pieces (read from source).
  - `cadmus-geo-location` 1.0.3 (`GeoLocationEditor`): emits `location` only from its save button (read from source).
- Signal forms (Angular 22.2.1, read from `_validation_errors-chunk.mjs`): an array item object gets the identity Symbol only when its array node materializes children, and the tag is written into the item object itself. Observed in tests: the copies held by the part editors' drafts do get tagged.

## `@myrmidon/cadmus-part-geo-asserted-locations`

### `AssertedLocationComponent` (sub-editor, manual save)

- Draft `{ value, hasAssertion, assertion, tag }` in a `linkedSignal` over `location`, with the `previous` echo check; pure `toDraft`/`toLocation`; effect keyed on the draft resets the interaction state when the draft is back in sync with the model.
- No `<form>`: the save button is `type="button" (click)="save()"`. Enter-to-save is kept on the free tag input only, through `(keydown.enter)` + `isImplicitSubmission`, and does nothing when the save button would be disabled (as implicit submission did with a disabled default button).
  - Deliberate difference from the CHANGELOG recipe, which puts the handler on the root element: on the root it would also catch Enter in the embedded geo-location and assertion editors, saving the asserted location with values those editors had not yet emitted. The old reactive version did the same, since their inputs were owned by this component's `<form>`. Believed to be an improvement rather than a regression; check by pressing Enter in the geo-location label input in the app (old: saves the asserted location if the save button was enabled; new: nothing).
- `onAssertionChange` uses `setFieldFromChild` (ignores echoes); `onLocationChange` (the geo editor's explicit save) sets the value and marks it dirty.
- Values are copied with `copyFormValue` on the way in and out.
- `save()` on an invalid form now marks it as touched (previously it just returned).
- Tag error key fixed: `maxlength` → `maxLength`. The "tag too long" message could appear before as well (reactive forms used `maxlength`), so this is a port, not a fix.

### `AssertedLocationsPartComponent` (part editor)

- `_draft = linkedSignal(() => toDraft(this.data()?.value))`, `form = this.createForm(...)` with `NgxToolsSignalValidators.strictMinLength(p.locations, 1)`.
- Thesauri entries are `computed()` over `data()`; settings via `initSettings()` in the constructor.
- `mapLocations` is now `computed()` over the locations field (was a signal set from `valueChanges`).
- `onDataSet()` only schedules the overview map fit, as before.
- Removed constructor parameters (`AuthJwtService`, `FormBuilder`, unused `EnvService`); `DialogService` via `inject()`.
- Template: no `<form>`; `(saveRequest)="save()"` on the close/save buttons.

### Behaviour changes inherited from the v20 base (by design, specs adapted)

- Settings are loaded when the identity is set, not on every data set. Specs that changed the settings mock after the identity was bound now re-set the identity.
- `dirtyChange` is emitted from an effect: the spec awaits `fixture.whenStable()` before asserting it.

### Verification

- `ng test @myrmidon/cadmus-part-geo-asserted-locations`: 90/90 passed.
- Specs ported from `FormControl` access to field state; new specs: no `<form>`; save button is `type="button"`; Enter-to-save and no save on Enter when unchanged; reverting an edit makes the form pristine again; assertion echo leaves the form pristine; saved values carry no Symbol tags; bound objects are not adopted; save through the close/save buttons.
- Mutation check of the echo spec: with `setFieldFromChild` replaced by `set()` + `markAsDirty()`, it failed (1 failed / 89 passed), and passed again once restored. A first version of the spec, using an echo that serialized identically to the bound value, did **not** catch the mutation, because the reset-on-sync effect cleared the dirty state anyway; it now uses a bound `note: null` echoed as `undefined`.
- Draft contents are compared in specs through a JSON round-trip (Symbol tags); the saved part is asserted to carry no Symbols.
- `node scripts/build-libs.mjs cadmus-part-geo-asserted-locations`: built `cadmus-part-geo-asserted-locations` and `cadmus-part-geo-pg`, clean.

## `@myrmidon/cadmus-part-geo-asserted-toponyms`

### `AssertedToponymComponent` (sub-editor, manual save)

- Same pattern as `AssertedLocationComponent`: draft `{ eid, tag, name, assertion }` in a `linkedSignal` with the `previous` echo check, pure `toDraft`/`toToponym`, reset-on-sync effect keyed on the draft.
- The toponym-level `assertion` is not edited here. The old code copied it from the bound toponym when saving. It is now carried through the draft as an unbound field, so `toToponym` stays pure. The behaviour is the same (spec "should preserve the toponym assertion" passes).
- `onNameChange` uses `setFieldFromChild`. This is needed: `ProperNameComponent` emits a normalized copy (e.g. `tag: null` → `undefined`) right after binding.
- Enter-to-save on its own EID and free tag inputs only (see the note on `AssertedLocationComponent`).
- A draft field named `name` compiles under strict template checking, and the `FieldTree` proxy resolves it as a child field before anything else (read in `FIELD_PROXY_HANDLER`). So the overlap with `Function.prototype.name` is harmless.

### `AssertedToponymsPartComponent` (part editor)

- Same pattern as `AssertedLocationsPartComponent`: draft `{ toponyms }`, `strictMinLength(p.toponyms, 1)`, the 7 thesauri as `computed()` signals, settings via `initSettings()`, `ProperNameService`/`DialogService` via `inject()`. No `onDataSet` override is needed.

### Verification

- `ng test @myrmidon/cadmus-part-geo-asserted-toponyms`: 75/75 passed.
- Mutation checks (each run once, then restored to 75/75):
  - `setFieldFromChild` → `set()` + `markAsDirty()` in `onNameChange`: "should stay pristine on a name echo" failed.
  - Reset-on-sync effect disabled: "should become pristine again when the edit is reverted" failed.
- `node scripts/build-libs.mjs cadmus-part-geo-asserted-toponyms`: built it and `cadmus-part-geo-pg`, clean. `ng test @myrmidon/cadmus-part-geo-pg`: 3/3.

## Browser verification (both libraries)

Setup: `.angular/cache` deleted, `ng serve`, headless Chrome 154 driven over CDP, local API at `localhost:5041` with seeded data. Item `096bf20d-…` has a locations part and a toponyms part whose data contain `null`s (`tag`, `assertion`, `eid`, name `tag`/`assertion`). Keys were sent as real CDP `Input.*` events. The part was never saved, so nothing was written to the database.

- **What the browser runs**: after login, all loaded scripts were fetched and searched. The chunk holding the geo editors contains `onEnterKey` and `strictMinLength`, and has no `formGroup`/`strictMinLengthValidator`. So it was the migrated build.
- For both part editors (verified):
  - no `<form>` in the part editor or the sub-editor;
  - after opening the sub-editor and waiting 1.5 s (past the children's 300–600 ms autosave debounces), the sub-editor's save button is disabled (pristine);
  - Enter in an unchanged input does nothing;
  - closing the part without edits shows no pending-changes prompt;
  - typing then Enter saves the sub-editor, with no page reload;
  - closing the part afterwards shows "There are unsaved changes".
- The proper-name echo really happened in the toponyms run: an `NG0956` warning for a collection of size 2 (the name's 2 pieces) appeared right after the sub-editor opened. That is believed to be `ProperNameComponent` rebuilding its pieces after its own normalized emission. Still the sub-editor stayed pristine.
- Locations, nested assertion flow (verified):
  - ticking "assertion" shows the assertion editor, and typing a note there enables the sub-editor's save;
  - Enter inside the nested assertion's note input does not save the asserted location;
  - after saving with the button and reopening, the note is there and the sub-editor is pristine.

## Follow-up (owner's requests after the migration)

The owner bumped all three libraries to 13.0.0. Then:

- **Peer dependencies.** Every package the libraries import is now declared as a peer, with ranges matching the workspace's installed versions:
  - locations: `@angular/forms`, `@angular/router`, `rxjs`, `@maplibre/ngx-maplibre-gl`, `maplibre-gl`, `@types/geojson`, `@myrmidon/cadmus-api`, `@myrmidon/cadmus-refs-lookup`, `@myrmidon/ngx-mat-tools`;
  - toponyms: the same, minus the maplibre packages and `@types/geojson`;
  - pg: `@angular/router`.
  - `@types/geojson` is needed because the published `.d.ts` imports `"geojson"` (verified in `dist/.../types`, for `labelsGeoJSON`). Under pnpm's strict resolution, the copy that `maplibre-gl` depends on is not resolvable from the library.
- **Scripts.** Removed `build-loc`, `build-top`, `build-pg` and `build:lib` from the root `package.json`. No other file referenced them (searched `*.md`, `*.bat`, `*.json`, `Dockerfile`).
- **`NG0956`.** I checked the `track` expression of every `@for` in the libraries:
  - both part lists tracked rows by identity and now track by `$index`. Rows have no id, a saved row is always a new object, and the rows hold only text and buttons;
  - the thesaurus selects already tracked `e.id`, and the map markers already tracked `$index`.
  - Verified in the browser (same flows as above, cache cleared, served bundle checked): the size-1 warnings are gone, and every flow check gave the same result as before.
  - The size-2 warnings remain in this app, because it uses the published `@myrmidon/cadmus-refs-proper-name` 11.0.2. They will go once a release with the fix below is installed.
- **`cadmus-refs-proper-name`** (in `cadmus-bricks-shell-v3`, recorded in its CHANGELOG and README):
  - the pieces table now tracks by `$index`; the language, tag, type and value options by `e.id`.
  - Verified with two new specs that check the DOM elements are reused and no `NG0956` is logged. Each fails when its tracking is reverted to identity (mutation check).
  - The component's effect does rebuild the pieces as new objects after its own tag emission; the spec asserts this as a precondition. A first version of that spec did not wait for the effect, so it passed even when mutated. It was fixed before relying on it.
  - The type and value option lists in `ProperNamePieceComponent` have no dedicated spec. They are believed fixed because they follow the same pattern as the language options, which the spec does cover; check by opening the piece type select while its entries change.
  - Its library was rebuilt; no other library in that workspace imports it (manifests and imports both checked).

## Not changed / for the owner (reported, not fixed)

- `cadmus-refs-proper-name`: the spec `ProperNamePieceComponent > updates typeValues (debounced) when the user changes the type control` fails, also at HEAD without any of these changes (3/3 runs each way). It depends on a synchronous `_noNextValuesUpdate` flag around a debounced `toObservable` pipeline, which is believed to be the cause (see the `toObservable` hazard above).
- `cadmus-bricks-shell-v3` dev server: `/refs/proper-name` (and any page loading it) fails with `Failed to resolve import "@myrmidon/cadmus-refs-citation"` from the prebundled `@myrmidon/taxo-store-picker`. A published npm package imports a local library, which exists only through `tsconfig` paths and is not in `node_modules`, so Vite's prebundle cannot resolve it. That is why the proper-name fix was verified by specs rather than in that demo app.
- `ProperNameComponent` re-runs `updateForm` after its own emissions, which also calls `closePiece()`, `assEdOpen.set(false)` and `form().reset()`. Read from source, not run: typing in the language or tag input while the assertion panel is open would close it about 300 ms later. Check this in the bricks demo once its dev server works.
- Enter-to-save scope differs from the CHANGELOG recipe (own inputs, not root element); see the note on `AssertedLocationComponent`.
