import { Part } from '@myrmidon/cadmus-core';
import { Assertion } from '@myrmidon/cadmus-refs-assertion';

export interface LocationPoint {
  lat: number;
  lon: number;
}

export interface LocationBox {
  a: LocationPoint;
  b: LocationPoint;
}

export interface AssertedLocation {
  tag?: string;
  point: LocationPoint;
  box?: LocationBox;
  altitude?: number;
  geometry?: string;
  assertion?: Assertion;
}

/**
 * The asserted locations part model.
 */
export interface AssertedLocationsPart extends Part {
  locations: AssertedLocation[];
}

/**
 * The type ID used to identify the AssertedLocationsPart type.
 */
export const ASSERTED_LOCATIONS_PART_TYPEID = 'it.vedph.geo.asserted-locations';

/**
 * JSON schema for the AssertedLocations part.
 * You can use the JSON schema tool at https://jsonschema.net/.
 */
export const ASSERTED_LOCATIONS_PART_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id:
    'www.vedph.it/cadmus/parts/geo/' + ASSERTED_LOCATIONS_PART_TYPEID + '.json',
  type: 'object',
  title: 'AssertedLocationsPart',
  required: [
    'id',
    'itemId',
    'typeId',
    'timeCreated',
    'creatorId',
    'timeModified',
    'userId',
    'locations',
  ],
  properties: {
    timeCreated: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d+Z$',
    },
    creatorId: {
      type: 'string',
    },
    timeModified: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d+Z$',
    },
    userId: {
      type: 'string',
    },
    id: {
      type: 'string',
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    },
    itemId: {
      type: 'string',
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    },
    typeId: {
      type: 'string',
      pattern: '^[a-z][-0-9a-z._]*$',
    },
    roleId: {
      type: ['string', 'null'],
      pattern: '^([a-z][-0-9a-z._]*)?$',
    },
    tag: {
      type: 'string'
    },
    point: {
      type: 'object',
      required: ['lat', 'lon'],
      properties: {
        lat: {
          type: 'number',
        },
        lon: {
          type: 'number',
        },
      },
    },
    box: {
      type: 'object',
      required: ['a', 'b'],
      properties: {
        a: {
          type: 'object',
          required: ['lat', 'lon'],
          properties: {
            lat: {
              type: 'number',
            },
            lon: {
              type: 'number',
            },
          },
        },
        b: {
          type: 'object',
          required: ['lat', 'lon'],
          properties: {
            lat: {
              type: 'number',
            },
            lon: {
              type: 'number',
            },
          },
        },
      },
    },
    altitude: {
      type: 'number',
    },
    geometry: {
      type: 'string',
    },
    assertion: {
      type: 'object',
      required: [],
      properties: {
        tag: {
          type: 'string',
        },
        rank: {
          type: 'integer',
        },
        references: {
          type: 'array',
          items: {
            type: 'object',
            required: ['citation'],
            properties: {
              type: {
                type: 'string',
              },
              tag: {
                type: 'string',
              },
              citation: {
                type: 'string',
              },
              note: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
};
