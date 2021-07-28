import { isBranch, isRange } from '../../node';
import { decodeArgs } from '../index.js';

export default function decodeQuery(query) {
  return decodeChildren(query);
}

function decodeChildren(query) {
  const isPage = query.some((node) => isRange(node) || node.key[0] === '\0');
  if (isPage) {
    return decodeGraphPage(query);
  } else {
    return decodeGraphBranch(query);
  }
}

function decodeGraphPage(query) {
  const result = [];
  for (const node of query) {
    const args = decodeArgs(node);
    const child = isBranch(node) ? decodeChildren(node.children) : {};
    child.$key = args;
    // Object.defineProperty(child, '$key', { value: args });
    result.push(child);
  }

  return result.length === 1 ? result[0] : result;
}

function decodeGraphBranch(query) {
  const result = {};
  for (const node of query) {
    const child = isBranch(node) ? decodeChildren(node.children) : true;
    const { key } = node;
    result[key] = child;
  }
  return result;
}
