import { stripHTML } from 'wdk-client/Utils/DomUtils';
import { Node } from 'wdk-client/Utils/TreeUtils'
import { TreeBoxVocabNode } from 'wdk-client/Utils/WdkModel';

export function isNodeWithOneExtendingChild(node: Node<TreeBoxVocabNode>) {
  return (
    node.children.length === 1 &&
    stripHTML(node.children[0].data.display).startsWith(stripHTML(node.data.display))
  );
}
