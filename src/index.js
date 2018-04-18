import fs from 'fs';
import _ from 'lodash';
import deepmerge from 'deepmerge';
import { prettyPrint } from 'html';
import $RefParser from 'json-schema-ref-parser';

const plugins = {};

let traverseObjects = false;
let traverseDepth = 3;
let bundledSchema = {};
let OMIT_PROPERTIES = [];

const resolveRef = value => {
  if (!value.$ref) {
    return value;
  }

  const pathParts = value.$ref.substring(2).split('/');
  const pathLength = pathParts.length;
  const currentParts = [pathParts.shift()];

  let foundSchema;

  while (currentParts.length <= pathLength) {
    foundSchema = _.get(bundledSchema, currentParts.join('.'));

    if (foundSchema.$ref) {
      foundSchema = resolveRef(foundSchema);
      foundSchema = foundSchema[0] || foundSchema;
      return _.get(foundSchema, pathParts.join('.'));
    }

    currentParts.push(pathParts.shift());
  }

  return foundSchema;
};

export const resolveSchema = definition => {
  if (!definition) {
    return definition;
  }

  if (definition.$ref) {
    const resolved = resolveRef(definition);
    return resolveSchema(resolved);
  }

  if (definition.allOf) {
    const allOf = _.map(definition.allOf, def => {
      const resolved = resolveSchema(def);
      return {
        ...resolved,
        properties: _.mapValues(resolved.properties, resolveSchema)
      };
    });

    definition = deepmerge.all([...allOf, definition]);
  }

  if (definition.anyOf) {
    definition.anyOf = _.map(definition.anyOf, def => {
      if (def.$ref) {
        const resolved = resolveRef(def);
        return resolveSchema(resolved);
      }

      return def;
    });
  }

  return definition;
};

const tupleArray = properties =>
  _.map(properties, (value, key) =>
    Object.assign({}, value, resolveRef(value), {
      name: key
    })
  );

export const listItem = ({ name, type, description, values, ...rest }) => {
  values = _.map(values, value => (_.isObject(value) ? value.title : value));
  values = _.isEmpty(values) ? '' : `<code>${values}</code>`;

  let subProps;

  if (type === 'object') {
    // eslint-disable-next-line no-use-before-define
    subProps = propertyList(tupleArray(rest.properties));
  }

  return `
    <li>
      <b>${name}</b>
      <i>{${type}}</i>
      ${description || ''}
      ${values}
      ${subProps || ''}
    </li>
  `;
};

export const propertyList = items => `
  <ul>
    ${_.map(items, listItem).join('')}
  </ul>
`;

export const layout = ({ title, description, required, optional, plugins }) => `
  ${title ? `<h1>${title}</h1>` : ''}
  ${description ? `<p>${description}</p>` : ''}
  ${required || optional ? `<h2>Structure</h2>` : ''}
  ${
    required
      ? `<h4>Required</h4>
    ${required}`
      : ''
  }
  ${
    optional
      ? `<h4>Optional</h4>
    ${optional}`
      : ''
  }
  ${plugins ? plugins.map(plugin => plugin).join('') : ''}
`;

function escapeRegExp(string) {
  if (typeof string !== 'string') {
    return string;
  }

  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export const findMatchingDefinitions = (schema, identifier) => {
  if (!_.isObject(schema)) {
    return [];
  }

  const id = schema.$id || schema.id;

  const idRegex = new RegExp(escapeRegExp(id), 'i');

  if (typeof id === 'string' && identifier.match(idRegex)) {
    return [schema];
  }

  let found = _.map(schema, schemaDef =>
    findMatchingDefinitions(schemaDef, identifier)
  );

  found = _.union(...found);
  found = _.filter(found, _.isObject);

  return found;
};

const resolveWhole = (definition, levels = traverseDepth) => {
  if (levels === 0) {
    return definition;
  }

  if (!_.isObject(definition)) {
    return definition;
  }

  definition = resolveSchema(definition);

  _.map(definition, (schemaDef, key) => {
    if (!traverseObjects) {
      return definition;
    }

    definition[key] = resolveWhole(schemaDef, levels - 1);
  });

  return definition;
};

const getRootDefinition = identifier => {
  const definitions = findMatchingDefinitions(bundledSchema, identifier);

  return resolveSchema(definitions[0]);
};

export function schema(key) {
  const id = key.args ? key.args[0] : key;
  const rootDefinition = getRootDefinition(id);

  if (!rootDefinition) {
    return '<div />';
  }

  const requiredProperties = rootDefinition.required || [];

  let properties = tupleArray(rootDefinition.properties);
  properties = _.filter(
    properties,
    property =>
      !Object.keys(plugins).includes(property.name) &&
      !OMIT_PROPERTIES.includes(property.name)
  );

  const required = properties.filter(
    prop => requiredProperties.indexOf(prop.name) > -1
  );
  const optional = properties.filter(
    prop => requiredProperties.indexOf(prop.name) === -1
  );

  const html = layout({
    title: rootDefinition.title || rootDefinition.id || rootDefinition.$id,
    description: rootDefinition.description,
    required: propertyList(required),
    optional: propertyList(optional),
    plugins: _.map(plugins, (render, name) =>
      render(resolveWhole(_.get(rootDefinition, `properties.${name}`)))
    )
  });

  return prettyPrint(html, { indent_size: 2 }); // eslint-disable-line camelcase
}

export default {
  hooks: {
    init() {
      const config = this.options.pluginsConfig['json-schema'];

      traverseObjects = config.traverseObjects;

      if (config.traverseDepth) {
        traverseDepth = config.traverseDepth;
      }

      if (config.plugins) {
        _.map(config.plugins, (render, propertyName) => {
          const plugin = fs.readFileSync(render, 'utf8');
          // eslint-disable-next-line no-eval
          plugins[propertyName] = eval(plugin);
        });
      }

      if (config.omitProperties) {
        OMIT_PROPERTIES = [...OMIT_PROPERTIES, ...config.omitProperties];
      }

      if (config.bundled && typeof config.schema === 'object') {
        bundledSchema = config.schema;
        return true;
      } else if (config.bundled) {
        bundledSchema = JSON.parse(fs.readFileSync(config.schema, 'utf8'));
        return true;
      }

      console.log('Bundling Schema...');
      return $RefParser
        .bundle(config.schema)
        .then(schema => {
          bundledSchema = schema;
        })
        .catch(err => {
          throw err;
        });
    }
  },
  blocks: {
    schema
  }
};
