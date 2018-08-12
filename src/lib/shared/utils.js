export function findRef(id, refs) {
  if (refs[id]) {
    return refs[id];
  }

  const [_id, path] = id.split('#/');

  let schema = refs[_id || id];

  if (!schema) {
    throw new Error(`Missing reference '${_id || id}'`);
  }

  const parts = path.split('/');

  while (parts.length) {
    schema = schema[parts.shift()];
  }

  if (schema.$ref) {
    return findRef(schema.$ref, refs);
  }

  return schema;
}

export function reduceRefs(schema, refs) {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map(x => reduceRefs(x, refs));
  }

  if (schema.$ref) {
    return reduceRefs(findRef(schema.$ref, refs), refs);
  }

  const copy = {};

  Object.keys(schema).forEach(prop => {
    copy[prop] = reduceRefs(schema[prop], refs);
  });

  return copy;
}

export const loader = (Component, selector) => [].slice.call(document.querySelectorAll(selector)).map(node => {
  let target;
  let data;

  try {
    data = JSON.parse(node.dataset.resource || node.innerText);
  } catch (e) {
    data = {};
  }

  if (node.tagName === 'SCRIPT') {
    target = document.createElement('div');
    target.className = data.className || 'json-schema-formalizer';

    node.parentNode.insertBefore(target, node);
    node.parentNode.removeChild(node);
  } else {
    target = node;
  }

  const instance = new Component({
    target,
    data,
  });

  return instance;
});

export default {
  reduceRefs,
  findRef,
  loader,
};