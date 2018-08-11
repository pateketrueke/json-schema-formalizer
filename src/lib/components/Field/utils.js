import ErrorType from './Error.svelte';
import LoaderType from './Loader.svelte';

const VALUES = {
  object: () => ({}),
  array: () => [],
  string: () => '',
  integer: () => 0.0,
  number: () => 0,
};

const INDEX = {};

export function getId(forName, isLabel) {
  if (!INDEX[forName]) {
    INDEX[forName] = 0;
  }

  if (isLabel) {
    INDEX[forName] += 1;
  }

  const offset = INDEX[forName];

  return `${forName}-field-${offset}`;
}

export function defaultValue(schema, refs) {
  if (schema.$ref) {
    return refs[schema.$ref] ? defaultValue(refs[schema.$ref], refs) : null;
  }

  if (schema.properties) {
    return Object.keys(schema.properties).reduce((prev, cur) => {
      prev[cur] = defaultValue(schema.properties[cur], refs);

      return prev;
    }, {});
  }

  return VALUES[schema.type || 'object']();
}

export default {
  ErrorType,
  LoaderType,
  defaultValue,
};
