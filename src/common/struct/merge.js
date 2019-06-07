import { isBranch, isRange } from './nodeTypes';
import { keyAfter, keyBefore } from './keyOps';
import getIndex from './getIndex';

export default function merge(current, changes) {
  let index = 0;
  for (const change of changes) {
    index = isRange(change)
      ? insertRange(current, change, index)
      : insertNode(current, change, index);
  }
}

function insertRange(current, change, start = 0) {
  const { key, end } = change;
  let keyIx = getIndex(current, key, start);
  let endIx = getIndex(current, end, keyIx);
  if (isRange(current[keyIx - 1]) && current[keyIx - 1].end >= key) keyIx--;
  if (current[endIx] && current[endIx].key === end) endIx++;

  // If current contains nodes that are newer than this range, keep them.
  // We do this by merging them back into insertions first.
  const insertions = [change];
  for (let i = keyIx; i < endIx; i++) {
    const node = current[i];
    if (isRange(node)) {
      insertions.push(...mergeRanges(insertions.pop(), node));
    } else {
      insertNode(insertions, node, insertions.length - 1);
    }
  }

  current.splice(keyIx, endIx - keyIx, ...insertions);
  return keyIx + insertions.length;
}

function mergeRanges(base, node) {
  assertClock(node, base.clock);
  if (node.clock < base.clock) [node, base] = [base, node];
  return [
    base.key < node.key && { ...base, end: keyBefore(node.key) },
    node,
    base.end > node.end && { ...base, key: keyAfter(node.end) },
  ].filter(Boolean);
}

function insertNode(current, change, start = 0) {
  const key = change.key;
  const index = getIndex(current, key, start);
  const node = current[index];
  const prev = current[index - 1];

  if (node && node.key === key) {
    // There is an existing node with the same key.
    return isRange(node)
      ? insertNodeIntoRange(current, index, change)
      : updateNode(current, index, change);
  } else if (isRange(prev) && prev.end >= key) {
    // There is no existing child with the exact same key, but the change
    // falls within an existing range.
    return insertNodeIntoRange(current, index - 1, change);
  } else {
    // This change does not overlap with any existing knowledge. Insert it
    current.splice(index, 0, change);
    return index + 1;
  }
}

function insertNodeIntoRange(current, index, change) {
  const key = change.key;
  const range = current[index];
  const newChange = getNewer(change, range.clock);
  if (!newChange) return;

  const insertions = [
    range.key < key && { ...range, end: keyBefore(key) },
    newChange,
    range.end > key && { ...range, key: keyAfter(key) },
  ].filter(Boolean);
  current.splice(index, 1, ...insertions);

  return index + insertions.length;
}

function updateNode(current, index, change) {
  const node = current[index];
  if (isBranch(change) && isBranch(node)) {
    // Both are branches: Recursively merge children.
    merge(node.children, change.children);
  } else if (isBranch(node)) {
    // Current node is a branch but the change is a leaf; if the branch
    // has newer children, ignore the change and keep only those children;
    // Otherwise, discard the branch and keep the change.
    const newNode = getNewer(node, change.clock);
    current[index] = newNode || change;
  } else {
    // Current node is a leaf. Replace with the change if it is newer.
    const newChange = getNewer(change, node.clock);
    if (newChange) current[index] = newChange;
  }
  return index + 1;
}

function getNewer(node, clock) {
  if (isBranch(node)) {
    const children = node.children.filter(child => getNewer(child, clock));
    return children.length && { ...node, children };
  } else {
    assertClock(node, clock);
    return node.clock > clock ? node : null;
  }
}

function assertClock(node, clock) {
  if (node.clock === clock) {
    throw Error('merge.clock_collision ' + [node.key, clock].join(' '));
  }
}
