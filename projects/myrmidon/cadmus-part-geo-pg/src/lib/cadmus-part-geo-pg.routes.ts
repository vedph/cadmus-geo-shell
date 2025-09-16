import { Routes } from '@angular/router';

// cadmus
import { PendingChangesGuard } from '@myrmidon/cadmus-core';

// parts
import {
  ASSERTED_LOCATIONS_PART_TYPEID,
  AssertedLocationsPartFeatureComponent,
} from '@myrmidon/cadmus-part-geo-asserted-locations';
import {
  AssertedToponymsPartFeatureComponent,
  ASSERTED_TOPONYMS_PART_TYPEID,
} from '@myrmidon/cadmus-part-geo-asserted-toponyms';

export const CADMUS_PART_GEO_PG_ROUTES: Routes = [
  {
    path: `${ASSERTED_LOCATIONS_PART_TYPEID}/:pid`,
    pathMatch: 'full',
    component: AssertedLocationsPartFeatureComponent,
    canDeactivate: [PendingChangesGuard],
  },
  {
    path: `${ASSERTED_TOPONYMS_PART_TYPEID}/:pid`,
    pathMatch: 'full',
    component: AssertedToponymsPartFeatureComponent,
    canDeactivate: [PendingChangesGuard],
  },
];
