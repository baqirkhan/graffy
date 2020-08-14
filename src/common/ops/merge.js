import union from './union.js';
import { isLeaf, isBranch } from '../node/index.js';

export default function merge(...trees) {
  return union((...nodes) => {
    const newestBranch = nodes.filter(isBranch);
    const newestLeaf = nodes.filter(isLeaf).reduce((newest, node, i) => {
      if (!node) return newest;
      if (!newest) return node;
      return node.meta('version') > newest.meta('version') ? node : newest;
    });
  }, ...trees);
}
