import { negate } from 'lodash'

import { stripHTML } from 'wdk-client/Utils/DomUtils';
import { Node, pruneDescendantNodes } from 'wdk-client/Utils/TreeUtils'
import { TreeBoxVocabNode } from 'wdk-client/Utils/WdkModel';

export function pruneNodesWithOneExtendingChild(organismTree: Node<TreeBoxVocabNode>) {
  return pruneDescendantNodes(
    negate(isNodeWithOneExtendingChild),
    organismTree
  );
}

export function isNodeWithOneExtendingChild(node: Node<TreeBoxVocabNode>) {
  return (
    node.children.length === 1 &&
    stripHTML(node.children[0].data.display).startsWith(stripHTML(node.data.display))
  );
}