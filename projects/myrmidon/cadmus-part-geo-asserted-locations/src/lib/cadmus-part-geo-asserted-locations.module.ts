import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// material
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

// leaflet
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

// bricks
import { AssertionComponent } from '@myrmidon/cadmus-refs-assertion';
import { FlagsPickerComponent } from '@myrmidon/cadmus-ui-flags-picker';

// cadmus
import { CadmusCoreModule } from '@myrmidon/cadmus-core';
import { CadmusStateModule } from '@myrmidon/cadmus-state';
import { CadmusUiModule } from '@myrmidon/cadmus-ui';
import { CadmusUiPgModule } from '@myrmidon/cadmus-ui-pg';

import { AssertedLocationsPartComponent } from './asserted-locations-part/asserted-locations-part.component';
import { AssertedLocationComponent } from './asserted-location/asserted-location.component';
import { LocationPointComponent } from './location-point/location-point.component';
import { AssertedLocationsPartFeatureComponent } from './asserted-locations-part-feature/asserted-locations-part-feature.component';

@NgModule({ declarations: [
        AssertedLocationsPartComponent,
        AssertedLocationComponent,
        LocationPointComponent,
        AssertedLocationsPartFeatureComponent,
    ],
    exports: [
        AssertedLocationsPartComponent,
        AssertedLocationComponent,
        LocationPointComponent,
        AssertedLocationsPartFeatureComponent,
    ], imports: [CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        // material
        MatButtonModule,
        MatCardModule,
        MatCheckboxModule,
        MatDialogModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatProgressBarModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTabsModule,
        MatTooltipModule,
        // leaflet
        LeafletModule,
        // cadmus
        AssertionComponent,
        FlagsPickerComponent,
        CadmusCoreModule,
        CadmusStateModule,
        CadmusUiModule,
        CadmusUiPgModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class CadmusPartGeoAssertedLocationsModule {}
