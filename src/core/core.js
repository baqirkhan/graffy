import { unwrap } from '@graffy/common';

function resolve(handlers, firstPayload, options) {
  if (!handlers || !handlers.length) throw Error('resolve.no_provider');

  function run(i, payload) {
    if (i >= handlers.length) {
      throw Error('resolve.no_providers_for ' + JSON.stringify(payload));
    }

    const { path, handle } = handlers[i];

    if (!unwrap(payload, path)) return run(i + 1, payload);

    let nextCalled = false;
    return handle(payload, options, (nextPayload) => {
      if (nextCalled) {
        throw Error('resolve.duplicate_next_call: ' + handlers[i].name);
      }
      if (typeof nextPayload === 'undefined') {
        throw Error('resolve.next_without_payload: ' + handlers[i].name);
      }
      nextCalled = true;
      return run(i + 1, nextPayload);
    });
  }

  return run(0, firstPayload);
}

export default function makeStore() {
  const handlers = {};

  return {
    /**
      Register a provider
      @param {'read'|'write'} type
      @param {string[]} path
      @param {function} handle
    */
    on(type, path, handle) {
      handlers[type] = handlers[type] || [];
      handlers[type].push({ path, handle });
    },

    /**
      Perform a read or write operation.
    */
    call(type, payload, options = {}) {
      return resolve(handlers[type], payload, options);
    },
  };
}
