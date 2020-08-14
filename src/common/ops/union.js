import { isLeaf } from '../node/index.js';

function pairwiseUnion(agg, node) {}

export default function union(trees, visit, prefix = []) {
  if (!trees.length) return;

  let cKey = '';
  const cPos = new Array(trees.length).fill(0);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let keyExists = false;
    let keyIsLeaf = false;

    // From each tree, get the node that matches the current position
    const nodes = cPos.map((pos, i) => {
      const { key, end } = trees[i][pos];
      if (key === cKey || (key <= cKey && end >= cKey)) {
        keyExists = true;
        const node = trees[i][pos];
        if (isLeaf(node)) keyIsLeaf = true;
        return node;
      }
    });

    if (keyExists) {
      // Descend into child nodes if the visitor returns true.
      union(
        nodes.map(({ children } = {}) => children || []),
        visit,
        prefix.concat(cKey),
      );
    }

    if (cKey === '\uffff') return;

    // From all trees, find the earliest unvisited key to visit.
    cKey = cPos.reduce((min, pos, i) => {
      if (pos + 1 >= trees[i].length) return min;
      const { key } = trees[i][pos + 1];
      return key < min ? key : min;
    }, '\uffff');

    // Advance pos for those trees that have this cKey (this is a separate)
    // step as the same key might exist in multiple trees, and we have to
    // advance all of them.

    trees.forEach((node, i) => {
      if (node.key === cKey) cPos[i]++;
    });
  }
}
