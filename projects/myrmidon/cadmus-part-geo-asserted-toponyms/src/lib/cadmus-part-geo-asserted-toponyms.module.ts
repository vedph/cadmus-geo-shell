import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
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

// bricks
import { AssertionComponent } from '@myrmidon/cadmus-refs-assertion';
import { CadmusProperNamePipe, ProperNameComponent } from '@myrmidon/cadmus-refs-proper-name';
import { FlagsPickerComponent } from '@myrmidon/cadmus-ui-flags-picker';

// cadmus
import { CadmusCoreModule } from '@myrmidon/cadmus-core';
import { CadmusStateModule } from '@myrmidon/cadmus-state';
import { CadmusUiModule } from '@myrmidon/cadmus-ui';
import { CadmusUiPgModule } from '@myrmidon/cadmus-ui-pg';

import { AssertedToponymComponent } from './asserted-toponym/asserted-toponym.component';
import { AssertedToponymsPartComponent } from './asserted-toponyms-part/asserted-toponyms-part.component';
import { AssertedToponymsPartFeatureComponent } from './asserted-toponyms-part-feature/asserted-toponyms-part-feature.component';

@NgModule({
  declarations: [
    AssertedToponymComponent,
    AssertedToponymsPartComponent,
    AssertedToponymsPartFeatureComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
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
    // cadmus
    AssertionComponent,
    ProperNameComponent,
    CadmusProperNamePipe,
    FlagsPickerComponent,
    CadmusCoreModule,
    CadmusStateModule,
    CadmusUiModule,
    CadmusUiPgModule,
  ],
  exports: [
    AssertedToponymComponent,
    AssertedToponymsPartComponent,
    AssertedToponymsPartFeatureComponent,
  ],
})
export class CadmusPartGeoAssertedToponymsModule {}
