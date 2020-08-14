import { encode as encodeValue, decode as decodeValue } from './struct.js';
import { keyStep, keyAfter, keyBefore } from './step.js';

function throwIf(message, condition) {
  if (condition) throw Error('arg_encoding.' + message);
}

export function encode({
  filter,
  first,
  last,
  order,
  after,
  before,
  since,
  until,
  cursor,
  id,
}) {
  if (id) return { key: id };
  const hasRangeArg = before || after || since || until || first || last;

  throwIf('first_and_last', first && last);
  throwIf('after_and_since', after && since);
  throwIf('before_and_until', before && until);
  throwIf('cursor_and_range_arg', cursor && hasRangeArg);
  throwIf('range_arg_and_no_order', !order && hasRangeArg);

  let key, end;
  let prefix = '\0';

  if (cursor) key = encodeValue(cursor);
  if (after) key = keyAfter(encodeValue(after));
  if (before) end = keyBefore(encodeValue(before));
  if (since) key = encodeValue(since);
  if (until) end = encodeValue(until);

  if (filter) prefix += encodeValue(filter) + '.';
  if (order) {
    // This is a query range
    prefix += encodeValue(order) + '.';
    key = key || '';
    end = end || '\uffff';
    if (last) [key, end] = [end, key];
  }

  if (!key) throw Error('');

  const node = {};
  if (typeof key !== 'undefined') node.key = prefix + key;
  if (typeof end !== 'undefined') node.end = prefix + end;
  if (first || last) node.limit = first || -last;

  return node;
}

/*

  Key and End might take one of these forms:

  filter.order.position .. filter.order.position
  filter.order.position

  order.position .. order.position
  order.position

  filter
  id
*/

function decodeParts(key) {
  const parts = key.slice(1).split('.');
  return parts.length === 3
    ? [decodeValue(parts[0]), decodeValue(parts[1]), decodeValue(parts[2])]
    : parts.length === 2
    ? [undefined, decodeValue(parts[0]), decodeValue(parts[1])]
    : [decodeValue(parts[0]), undefined, undefined];
}

export function decode(node) {
  if (typeof node === 'string') return { id: node };
  const { key, end, limit } = node;
  if (key[0] !== '\0') return { id: key };

  const args = {};
  if (limit) args[key < end ? 'first' : 'last'] = limit;

  const [filter, order, cursor] = decodeParts(key);
  if (filter) args.filter = filter;
  if (order) args.order = order;

  if (!end) {
    if (typeof cursor !== 'undefined') args.cursor = cursor;
    return args;
  }

  const [endFilter, endOrder, endCursor] = decodeParts(end);
  throwIf('prefix_mismatch', endFilter !== filter || endOrder !== order);
  const [lower, upper] =
    endCursor > cursor ? [cursor, endCursor] : [endCursor, cursor];

  if (lower !== '') {
    const { key, step } = keyStep(lower);
    args[step === 1 ? 'after' : 'since'] = key;
  }

  if (upper !== '\uffff') {
    const { key, step } = keyStep(upper);
    args[step === -1 ? 'before' : 'until'] = key;
  }

  return args;
}
