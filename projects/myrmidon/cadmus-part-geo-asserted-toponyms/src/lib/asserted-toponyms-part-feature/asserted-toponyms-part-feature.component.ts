import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EditPartFeatureBase, PartEditorService } from '@myrmidon/cadmus-state';
import { ItemService, ThesaurusService } from '@myrmidon/cadmus-api';

@Component({
  selector: 'cadmus-asserted-toponyms-part-feature',
  templateUrl: './asserted-toponyms-part-feature.component.html',
  styleUrls: ['./asserted-toponyms-part-feature.component.css'],
  standalone: false,
})
export class AssertedToponymsPartFeatureComponent
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
      'geo-toponym-tags',
      'geo-name-tags',
      'geo-name-languages',
      'geo-name-piece-types',
      'assertion-tags',
      'doc-reference-types',
      'doc-reference-tags',
    ];
  }
}
