import { Part } from '@myrmidon/cadmus-core';
import { Assertion } from '@myrmidon/cadmus-refs-assertion';
import { ProperName } from '@myrmidon/cadmus-refs-proper-name';

/**
 * A toponym with an optional assertion.
 */
export interface AssertedToponym {
  tag?: string;
  eid?: string;
  name: ProperName;
  assertion?: Assertion;
}

/**
 * The asserted toponyms part model.
 */
export interface AssertedToponymsPart extends Part {
  toponyms: AssertedToponym[];
}

/**
 * The type ID used to identify the AssertedToponymsPart type.
 */
export const ASSERTED_TOPONYMS_PART_TYPEID = 'it.vedph.geo.asserted-toponyms';

/**
 * JSON schema for the AssertedToponyms part.
 * You can use the JSON schema tool at https://jsonschema.net/.
 */
export const ASSERTED_TOPONYMS_PART_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id:
    'www.vedph.it/cadmus/parts/geo/' + ASSERTED_TOPONYMS_PART_TYPEID + '.json',
  type: 'object',
  title: 'AssertedToponymsPart',
  required: [
    'id',
    'itemId',
    'typeId',
    'timeCreated',
    'creatorId',
    'timeModified',
    'userId',
    'toponyms',
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
      type: 'string',
    },
    eid: {
      type: 'string',
    },
    name: {
      type: 'object',
      required: ['language', 'pieces'],
      properties: {
        language: {
          type: 'string',
        },
        tag: {
          type: 'string',
        },
        pieces: {
          type: 'array',
          items: {
            type: 'object',
            required: ['type', 'value'],
            properties: {
              type: {
                type: 'string',
              },
              value: {
                type: 'string',
              },
            },
          },
        },
      },
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
