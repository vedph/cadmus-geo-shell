import { PendingChangesGuard } from '@myrmidon/cadmus-core';
import {
  ASSERTED_LOCATIONS_PART_TYPEID,
  AssertedLocationsPartFeatureComponent,
} from '@myrmidon/cadmus-part-geo-asserted-locations';
import {
  ASSERTED_TOPONYMS_PART_TYPEID,
  AssertedToponymsPartFeatureComponent,
} from '@myrmidon/cadmus-part-geo-asserted-toponyms';

import { CADMUS_PART_GEO_PG_ROUTES } from './cadmus-part-geo-pg.routes';

describe('CADMUS_PART_GEO_PG_ROUTES', () => {
  const cases = [
    {
      typeId: ASSERTED_LOCATIONS_PART_TYPEID,
      component: AssertedLocationsPartFeatureComponent,
    },
    {
      typeId: ASSERTED_TOPONYMS_PART_TYPEID,
      component: AssertedToponymsPartFeatureComponent,
    },
  ];

  it('should define a route per part type', () => {
    expect(CADMUS_PART_GEO_PG_ROUTES.length).toBe(cases.length);
  });

  for (const { typeId, component } of cases) {
    it(`should route ${typeId} to its feature editor`, () => {
      const route = CADMUS_PART_GEO_PG_ROUTES.find(
        (r) => r.component === component,
      );
      expect(route).toBeTruthy();
      // the feature base class extracts the part type ID from the path
      // before the first slash, and the part ID from the :pid parameter
      expect(route!.path).toBe(`${typeId}/:pid`);
      expect(route!.path!.substring(0, route!.path!.indexOf('/'))).toBe(
        typeId,
      );
      expect(route!.pathMatch).toBe('full');
      expect(route!.canDeactivate).toEqual([PendingChangesGuard]);
    });
  }
});
