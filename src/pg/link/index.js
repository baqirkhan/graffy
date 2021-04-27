import {
  wrap,
  unwrap,
  wrapObject,
  unwrapObject,
  mergeObject,
  decodeArgs,
  encodeArgs,
  makePath,
} from '@graffy/common';

function makeRef(template, object) {
  function replacePlaceholders(key) {
    if (typeof key === 'string' && key[0] === '$' && key[1] === '$') {
      return unwrapObject(object, key.slice(2));
    }
    if (Array.isArray(key)) {
      return key.map(replacePlaceholders);
    }
    if (typeof key === 'object' && key) {
      const result = {};
      for (const prop in key) result[prop] = replacePlaceholders(key[prop]);
      return result;
    }
    return key;
  }

  return makePath(template).map(replacePlaceholders);
}

function isRangeKey(key) {
  return (
    typeof key === 'object' &&
    ('$all' in key ||
      '$first' in key ||
      '$last' in key ||
      '$before' in key ||
      '$after' in key ||
      '$until' in key ||
      '$since' in key)
  );
}

export function linkResult(objects, query, { links: linkSpecs }) {
  const refQueries = [];

  for (let linkProp in linkSpecs) {
    const linkPath = makePath(linkProp);
    const linkedQuery = unwrap(query, linkPath);
    if (!linkedQuery) continue;

    for (const object of objects) {
      const ref = makeRef(linkSpecs[linkProp]);
      if (isRangeKey(ref[ref.length - 1])) {
        const {
          $all,
          $first,
          $last,
          $before,
          $after,
          $until,
          $since,
          ...refArg
        } = ref.pop();
        const refQuery = linkedQuery.map((node) => {
          const queryArg = decodeArgs(node);
          if (!isRangeKey(arg)) {
            throw Error('pg_link.expected_range:' + linkProp);
          }
          const arg = { ...refArg, ...queryArg };
          mergeObject(
            object,
            wrapObject({ $ref: ref.concat([arg]) }, linkPath),
          );
          return { ...node, ...encodeArgs(arg) };
        });
        refQueries.push(wrap(refQuery, ref));
      } else {
        mergeObject(object, wrapObject({ $ref: ref }, linkPath));
        refQueries.push(wrap(linkedQuery, ref));
      }
    }
  }

  return refQueries;
}

export function linkChange(object, { links: linkSpecs }) {
  for (let linkProp in linkSpecs) {
    const { target, prop, back } = linkSpecs[linkProp];
    if (back) continue;
    const targetPath = makePath(target);
    const linkPath = makePath(linkProp);
    const idPath = makePath(prop);
    const link = unwrapObject(object, linkPath);
    if (link) {
      // Remove the link from the object; we don't write it.
      mergeObject(object, wrapObject(null, linkPath));

      // If the prop of this link is alread present, do nothing more.
      if (unwrapObject(object, idPath) !== undefined) continue;

      if (!link.$ref) {
        throw Error(
          `pg_write.missing_ref: ${linkPath.join('.')} ${JSON.stringify(link)}`,
        );
      }

      const ref = makePath(link.$ref);
      if (
        ref.length !== targetPath.length + 1 ||
        targetPath.some((tkey, i) => ref[i] !== tkey)
      ) {
        throw Error(
          `pg_write.incompatible_ref: ${linkPath.join('.')} ${
            link.$ref
          } ${targetPath.join('.')}`,
        );
      }

      const value = ref[ref.length - 1];
      mergeObject(object, wrapObject(value, idPath));
    }
  }

  return object;
}
