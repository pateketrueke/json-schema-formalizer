export function showError(field, target) {
  const selector = `[data-field="${field}"]`;
  const el = target.querySelector(selector);

  if (el) {
    el.classList.add('invalid');
  }
}

export function throttle(fn, ms) {
  let t;
  return function $fn(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms || 100);
  };
}

export function randId() {
  return `_${Math.random().toString(36).substr(2)}`;
}

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
    if (prop !== 'definitions') {
      copy[prop] = reduceRefs(schema[prop], refs);
    }
  });

  return copy;
}

export function isScalar(value) {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

export function loader(components, selector) {
  return [].slice.call(document.querySelectorAll(selector)).map(node => {
    let target;
    let data;

    try {
      data = JSON.parse(node.dataset.resource || node.innerText);
    } catch (e) {
      data = {};
    }

    if (node.tagName === 'SCRIPT') {
      target = document.createElement('div');
      target.className = data.className || 'formator';

      node.parentNode.insertBefore(target, node);
      node.parentNode.removeChild(node);
    } else {
      target = node;
    }

    // assume resource listing by default
    if (!data.model && Array.isArray(data.result)) {
      data = {
        result: data.result,
        schema: {
          type: 'array',
          items: { type: 'string' },
        },
        uiSchema: {
          'ui:template': [['a', { href: `${document.location.href}/{}` }, '{}']],
          'ui:title': data.description || 'Resources',
          'ui:append': false,
        },
      };
    }

    const Component = data.action === 'index'
      ? components.Table
      : components.Form;

    const instance = new Component({
      target,
      props: {
        ...data,
      },
    });

    let result;
    let debug;

    if (node.dataset.debug) {
      const el = document.querySelector(node.dataset.debug);

      if (el) {
        debug = el;
      }
    }

    instance.$on('change', e => {
      if (debug) {
        debug.innerText = JSON.stringify(e.detail, null, 2);
      }

      result = e.detail;
    });

    // expose getter as only public API method
    target.get = () => result;

    return instance;
  });
}

export function clean(value) {
  if (!value || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(clean);
  }

  const copy = {};

  Object.keys(value).forEach(key => {
    if (value[key] !== null) {
      copy[key] = clean(value[key]);
    }
  });

  return copy;
}

export const API = {
  call(action, data = {}) {
    const path = action.path.replace(/:(\w+)/g, (_, key) => data[key]);

    return fetch(path, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      method: action.verb,
      body: action.verb !== 'GET'
        ? JSON.stringify({ payload: data })
        : undefined,
    }).then(resp => resp.json());
  },
};
