import {Seq} from 'wdk-client/IterableUtils';
import {pruneDescendantNodes} from 'wdk-client/TreeUtils';
import {getTree} from 'wdk-client/OntologyUtils';
import {getRecordClassName, isQualifying} from 'wdk-client/CategoryUtils';

let isSearchMenuScope = isQualifying({ targetType: 'search', scope: 'menu' });

/**
 * Gets Category ontology and returns a tree, where each immediate child node
 * is a recordClass. Optionally, indicate record classes to include or exclude
 * via the `options` object. If `options.include` is defined, `options.exclude`
 * will be ignored.
 *
 * This is used by bubbles, query grid, and menus.
 *
 * @param {Ontology} ontology
 * @param {RecordClass[]} recordClasses
 * @returns RecordClassTree
 */
export function getSearchMenuCategoryTree(ontology, recordClasses) {
  let recordClassMap = new Map(recordClasses.map( rc => [ rc.name, rc ] ));
  // get searches scoped for menu
  let categoryTree = getTree(ontology, isSearchMenuScope);
  return groupByRecordClass(categoryTree, recordClassMap);
}

/**
 *
 * @param categoryTree
 * @param recordClassMap
 * @param options?
 * @returns {RecordClassTree[]}
 */
function groupByRecordClass(categoryTree, recordClassMap) {
  let recordClassCategories = Seq.from(recordClassMap.keys())
    .map(name => recordClassMap.get(name))
    .map(getRecordClassTree(categoryTree))
    .filter(isDefined)
    .toArray();
  return { children: recordClassCategories };
}

function isDefined(maybe) {
  return maybe !== undefined;
}

function getRecordClassTree(categoryTree) {
  return function(recordClass) {
    let tree = pruneDescendantNodes(isRecordClassTreeNode(recordClass), categoryTree);
    if (tree.children.length === 0) return;
    return {
      properties: {
        label: [recordClass.name],
        'EuPathDB alternative term': [recordClass.displayNamePlural]
      },
      // Flatten search tree for record class if retained in not null and does
      // not include record class.
      children: tree.children
    };
  }
}

function isRecordClassTreeNode(recordClass) {
  return function(node) {
    return node.children.length !== 0 || getRecordClassName(node) === recordClass.name;
  }
}
