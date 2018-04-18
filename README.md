# Gitbook Plugin: JSON-Schema

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=for-the-badge)](https://github.com/prettier/prettier)
[![Build Status](https://img.shields.io/circleci/project/github/hipstersmoothie/gitbook-plugin-json-schema/master.svg?style=for-the-badge)](https://circleci.com/gh/hipstersmoothie/gitbook-plugin-json-schema/tree/master)
[![Code Coverage](https://img.shields.io/codecov/c/github/hipstersmoothie/gitbook-plugin-json-schema/master.svg?style=for-the-badge)](https://codecov.io/gh/hipstersmoothie/gitbook-plugin-json-schema)
[![NPM Version](https://img.shields.io/npm/v/gitbook-plugin-json-schema.svg?style=for-the-badge)](https://www.npmjs.com/package/gitbook-plugin-json-schema) ![Dependancy Status](https://img.shields.io/david/hipstersmoothie/gitbook-plugin-json-schema.svg?style=for-the-badge) ![Dev Dependancy Status](https://img.shields.io/david/dev/hipstersmoothie/gitbook-plugin-json-schema.svg?style=for-the-badge)
[![NPM Downloads](https://img.shields.io/npm/dt/gitbook-plugin-json-schema.svg?style=for-the-badge)](https://www.npmjs.com/package/gitbook-plugin-json-schema)

This plugin for [Gitbook](https://github.com/GitbookIO/gitbook) takes a [JSON-Schema](http://json-schema.org/) and exposes a [block](https://toolchain.gitbook.com/plugins/blocks.html) that matches [ids](http://json-schema.org/latest/json-schema-core.html#id-keyword) to autogenerates docs.

## Usage

Simply provide an id that exists somewhere in your schema.

```md
{% schema "card" %}
{% endschema %}
```

The plugin will generate docs that describe the required and optional properties.

![Card Docs Example Image](https://raw.githubusercontent.com/hipstersmoothie/gitbook-plugin-json-schema/master/images/cardDocs.png)

## Configuration

### Schema

The basic configuration requires only a path to your schema definition or the schema itself.

```json
{
  "plugins": ["json-schema"],
  "pluginsConfig": {
    "json-schema": {
      "schema": "http://json-schema.org/example/card.json"
    }
  }
}
```

### Bundled

To properly parse a schema and generate the docs, this plugin requires the entire schema to be bundled into one file with only internal $ref pointers. When this plugin is in the `init` phase it will try to bundle the schema by default. If this schema is large it can take quite awhile to bundle it.

To speed up development you might want to pre-bundle your schema with [JSON-Schema-Ref-Parser](https://github.com/BigstickCarpet/json-schema-ref-parser). If you do this you should also state so in your config:

```json
{
  "pluginsConfig": {
    "json-schema": {
      "bundled": true,
      "schema": "./schema/merged_schema.json"
    }
  }
}
```

### Omit Properties

Globally omit properties that are included in all of your schema.

```json
{
  "pluginsConfig": {
    "json-schema": {
      "omitProperties": [
        "names",
        "of",
        "properties",
        "to",
        "exclude",
        "_comment"
      ],
      ...
    }
  }
}
```

### Traverse Objects

Set to true if you want properties that are objects to display their own property list.

```json
{
  "pluginsConfig": {
    "json-schema": {
      "traverseObjects": true,
      ...
    }
  }
}
```

### Plugins

Transform some property in your schema into a more complex UI component. To do this you can map the property key (or path to the key) to a render function. Top level property keys are omitted from the required and optional lists.

**_Note: The plugin code must be ES5._**

```json
{
  "pluginsConfig": {
    "json-schema": {
      "plugins": {
        "modifiers": "./path/to/es5/plugin/modifierTable.js",
        "metaData.properties.role": "./path/to/es5/plugin/roleTable.js"
      },
      ...
    }
  }
}
```

Example Plugin

```js
const roleRow = schema => `
    <tr>
      <td>${schema.const}</td>
      <td>${schema.description}</td>
    </tr>
  `;

const roleTable = ({ oneOf }) => {
  if (!oneOf) return '';

  return `
    <h4>Role</h4>
    <table>
      <thead>
        <tr>
          <td>Role</td>
          <td>Description</td>
        </tr>
      </thead>
      <tbody>
        ${oneOf.map(roleRow).join('')}
      </tbody>
    </table>
  `;
};

export default roleTable;
```

Which generates:

![Plugin Example](https://raw.githubusercontent.com/hipstersmoothie/gitbook-plugin-json-schema/master/images/pluginExample.png)

# Releasing

Run the `release` script with new version number (e.g 1.1.0)

```
npm run release -- 1.1.0
```

Mark each commit as either patch, minor or major. A tag is then created for the release, release notes are generated, and a release is published to github.

# Contributing / Bug Reporting

I built this to work with simple schemas and a very complex specific schema, so there might be patterns that aren't covered by the plugin. For these cases please file an [Issue](https://github.com/hipstersmoothie/gitbook-plugin-json-schema/issues) or a [Pull Request](https://github.com/hipstersmoothie/gitbook-plugin-json-schema/pulls).
