import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';

import { EditPartFeatureBase, PartEditorService } from '@myrmidon/cadmus-state';
import { ItemService, ThesaurusService } from '@myrmidon/cadmus-api';
import { CurrentItemBarComponent } from '@myrmidon/cadmus-ui-pg';

import { AssertedLocationsPartComponent } from '../asserted-locations-part/asserted-locations-part.component';

@Component({
  selector: 'cadmus-asserted-locations-part-feature',
  templateUrl: './asserted-locations-part-feature.component.html',
  styleUrls: ['./asserted-locations-part-feature.component.css'],
  imports: [CurrentItemBarComponent, AssertedLocationsPartComponent],
})
export class AssertedLocationsPartFeatureComponent
  extends EditPartFeatureBase
  implements OnInit
{
  constructor(
    router: Router,
    route: ActivatedRoute,
    snackbar: MatSnackBar,
    itemService: ItemService,
    thesaurusService: ThesaurusService,
    editorService: PartEditorService
  ) {
    super(
      router,
      route,
      snackbar,
      itemService,
      thesaurusService,
      editorService
    );
  }

  protected override getReqThesauriIds(): string[] {
    return [
      'geo-location-tags',
      'assertion-tags',
      'doc-reference-types',
      'doc-reference-tags',
    ];
  }
}
