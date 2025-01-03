import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

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

export const RouterModuleForChild = RouterModule.forChild([
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
]);

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Cadmus
    RouterModuleForChild,
  ],
  exports: [],
})
export class CadmusPartGeoPgModule {}
