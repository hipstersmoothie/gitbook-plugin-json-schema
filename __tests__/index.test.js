import path from 'path';
import plugin, {
  listItem,
  propertyList,
  layout,
  schema,
  resolveSchema,
  findMatchingDefinitions
} from '../src';

import testSchema from './helpers/testSchema';
import complexSchema from './helpers/complexTestSchema';
import bundleTest from './helpers/bundleTestSchema';
import assetInput from './helpers/resolveTest/asset_input';
import anyOfTest from './helpers/anyOfTest';

test('listItem', () => {
  expect(listItem({ name: 'testItem', type: 'something' })).toMatchSnapshot();
  expect(
    listItem({
      name: 'testItem',
      type: 'something',
      values: ['one', { title: 'two' }, 'three']
    })
  ).toMatchSnapshot();
});

test('propertyList', () => {
  expect(
    propertyList([
      { name: 'testItem', type: 'something' },
      {
        name: 'testItem',
        type: 'something',
        values: ['one', { title: 'two' }, 'three']
      }
    ])
  ).toMatchSnapshot();
});

test('layout', () => {
  expect(
    layout({
      title: 'title',
      description: 'description',
      required: 'required',
      optional: 'optional'
    })
  ).toMatchSnapshot();

  expect(
    layout({
      title: 'title',
      description: 'description',
      required: 'required',
      optional: 'optional',
      plugins: ['roles', 'modifiers']
    })
  ).toMatchSnapshot();

  expect(
    layout({
      required: 'required',
      optional: 'optional'
    })
  ).toMatchSnapshot();

  expect(
    layout({
      title: 'title',
      description: 'description'
    })
  ).toMatchSnapshot();
});

test('resolveSchema', () => {
  expect(resolveSchema(null)).toBeNull();
});

test('findMatchingDefinitions', () => {
  expect(findMatchingDefinitions(testSchema, 'card')).toMatchSnapshot();
  expect(findMatchingDefinitions(testSchema, 'address')).toMatchSnapshot();
  expect(findMatchingDefinitions(testSchema, 'geo')).toMatchSnapshot();

  expect(findMatchingDefinitions(complexSchema, 'asset_text')[0].id).toBe(
    'asset_text'
  );

  expect(
    findMatchingDefinitions(complexSchema, 'asset_landingTable')[0].id
  ).toBe('asset_landingTable');
  expect(findMatchingDefinitions(complexSchema, 'modifier_compact')[0].id).toBe(
    'modifier_compact'
  );
});

test('schema - easy', () => {
  plugin.hooks.init.bind({
    options: {
      pluginsConfig: {
        'json-schema': {
          bundled: true,
          schema: {
            id: 'foo',
            properties: {
              bar: {
                type: 'string'
              }
            }
          }
        }
      }
    }
  })();

  expect(schema('foobar')).toMatchSnapshot();
});

test('schema - no match', () => {
  plugin.hooks.init.bind({
    options: {
      pluginsConfig: {
        'json-schema': {
          bundled: true,
          schema: complexSchema
        }
      }
    }
  })();

  expect(schema('foobar')).toMatchSnapshot();
});

test('schema - config object', () => {
  plugin.hooks.init.bind({
    options: {
      pluginsConfig: {
        'json-schema': {
          traverseObjects: true,
          bundled: true,
          schema: complexSchema
        }
      }
    }
  })();

  expect(schema('asset_text')).toMatchSnapshot();
});

test('schema - config path', () => {
  plugin.hooks.init.bind({
    options: {
      pluginsConfig: {
        'json-schema': {
          traverseObjects: true,
          bundled: true,
          schema: path.resolve(__dirname, './helpers/complexTestSchema.json')
        }
      }
    }
  })();

  expect(schema({ args: ['asset_input'] })).toMatchSnapshot();
});

test('schema - links bundled', done => {
  plugin.hooks.init
    .bind({
      options: {
        pluginsConfig: {
          'json-schema': {
            traverseObjects: true,
            schema: bundleTest
          }
        }
      }
    })()
    .then(() => {
      expect(schema('card')).toMatchSnapshot();
      done();
    });
});

test('schema - not bundled', done => {
  plugin.hooks.init
    .bind({
      options: {
        pluginsConfig: {
          'json-schema': {
            traverseObjects: true,
            schema: assetInput
          }
        }
      }
    })()
    .then(() => {
      expect(schema('field')).toMatchSnapshot();
      done();
    });
});

test('schema - not bundled - deep', done => {
  plugin.hooks.init
    .bind({
      options: {
        pluginsConfig: {
          'json-schema': {
            traverseObjects: true,
            schema: assetInput
          }
        }
      }
    })()
    .then(() => {
      expect(schema('asset_input')).toMatchSnapshot();
      done();
    });
});

test('schema - error', () => {
  expect(
    plugin.hooks.init.bind({
      options: {
        pluginsConfig: {
          'json-schema': {
            schema: null
          }
        }
      }
    })()
  ).rejects.toMatchObject({
    message: 'Expected a file path, URL, or object. Got null'
  });
});

test('omitProperties', () => {
  plugin.hooks.init.bind({
    options: {
      pluginsConfig: {
        'json-schema': {
          traverseObjects: true,
          bundled: true,
          schema: complexSchema,
          omitProperties: [
            'template',
            'templateData',
            'templateOutput',
            '_serviceParams',
            '_comment'
          ]
        }
      }
    }
  })();

  expect(schema('asset_text')).toMatchSnapshot();
  expect(schema('asset_text')).not.toMatch('_serviceParams');
});

test('resolveSchema - anyOf', () => {
  plugin.hooks.init.bind({
    options: {
      pluginsConfig: {
        'json-schema': {
          bundled: true,
          schema: anyOfTest
        }
      }
    }
  })();

  expect(resolveSchema(anyOfTest)).toMatchSnapshot();
});

test('plugins', () => {
  plugin.hooks.init.bind({
    options: {
      pluginsConfig: {
        'json-schema': {
          traverseObjects: true,
          bundled: true,
          schema: complexSchema,
          plugins: {
            'metaData.properties.role': path.resolve(
              '__tests__/helpers/examplePlugin.js'
            )
          }
        }
      }
    }
  })();

  expect(schema('asset_labeledText')).toMatchSnapshot();
});
