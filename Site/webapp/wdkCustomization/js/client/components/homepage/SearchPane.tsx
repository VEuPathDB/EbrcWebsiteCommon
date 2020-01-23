import React, { useCallback, useState, useMemo } from 'react';

import { memoize, noop, orderBy } from 'lodash';

import { CategoriesCheckboxTree, Link, Tooltip, Icon, Loading, IconAlt } from 'wdk-client/Components';
import { LinksPosition } from 'wdk-client/Components/CheckboxTree/CheckboxTree';
import { CategoryTreeNode, getDisplayName, getTargetType, getRecordClassUrlSegment, getTooltipContent, getLabel } from 'wdk-client/Utils/CategoryUtils';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';
import { useSessionBackedState } from 'wdk-client/Hooks/SessionBackedState';

import { combineClassNames } from './Utils';

import './SearchPane.scss';
import { decode, arrayOf, string } from 'wdk-client/Utils/Json';
import { mapStructure } from 'wdk-client/Utils/TreeUtils';

const cx = makeClassNameHelper('ebrc-SearchPane');
const EXPANDED_BRANCHES_SESSION_KEY = 'homepage-left-panel-expanded-branch-ids';

type Props = {
  containerClassName?: string,
  searchTree?: CategoryTreeNode
};

export const SearchPane = (props: Props) => {
  const [ searchTerm, setSearchTerm ] = useState('');
  const [ expandedBranches, setExpandedBranches ] = useSessionBackedState(
    [ ],
    EXPANDED_BRANCHES_SESSION_KEY,
    JSON.stringify,
    memoize((s: string) => decode(arrayOf(string), s))
  );

  const [ areControlsExpanded, setAreControlsExpanded ] = useState(false);

  const toggleAreControlsExpanded = useCallback(() => {
    setAreControlsExpanded(!areControlsExpanded);
  }, [ areControlsExpanded ]);

  const alphabetizedSearchTree = useAlphabetizedSearchTree(props.searchTree);

  return (
    <nav className={combineClassNames(cx(), props.containerClassName)}>
      <h2>
        Search the Data
        <button type="button" className="link" onClick={toggleAreControlsExpanded}>
          <IconAlt fa="wrench" className="fa-flip-horizontal" />
        </button>
      </h2> 
      <div className={cx('CheckboxTreeContainer', areControlsExpanded ? 'controls_expanded' : 'controls_collapsed')}>
        <SearchCheckboxTree 
          searchTree={alphabetizedSearchTree} 
          searchTerm={searchTerm}
          expandedBranches={expandedBranches}
          setSearchTerm={setSearchTerm}
          setExpandedBranches={setExpandedBranches}
        />
      </div>
    </nav>
  );
}

function useAlphabetizedSearchTree(searchTree?: CategoryTreeNode) {
  const result = useMemo(() => {
    if (searchTree == null) {
      return undefined;
    }

    return mapStructure(
      (node, mappedChildren: CategoryTreeNode[]) => {
        return {
          ...node,
          children: getLabel(node)?.endsWith('RecordClass')
            ? mappedChildren
            : orderBy(
              [...mappedChildren],
              getDisplayName
            )
        };
      },
      node => node.children,
      searchTree
    );
  }, [ searchTree ]);

  return result;
}

type SearchCheckboxTreeProps = {
  searchTree?: CategoryTreeNode,
  searchTerm: string,
  expandedBranches: string[],
  setSearchTerm: (newSearchTerm: string) => void,
  setExpandedBranches: (newExpandedBranches: string[]) => void
};

export const SearchCheckboxTree = (props: SearchCheckboxTreeProps) => {
  const noSelectedLeaves = useMemo(
    () => [] as string[],
    []
  );

  return !props.searchTree 
    ? <Loading />
    : <CategoriesCheckboxTree
        autoFocusSearchBox
        selectedLeaves={noSelectedLeaves}
        onChange={noop}
        tree={props.searchTree}
        expandedBranches={props.expandedBranches}
        searchTerm={props.searchTerm}
        isSelectable={false}
        searchBoxPlaceholder="Filter the searches below..."
        leafType="search"
        renderNode={renderNode}
        renderNoResults={renderNoResults}
        onUiChange={props.setExpandedBranches}
        onSearchTermChange={props.setSearchTerm}
        showSearchBox   
        linksPosition={LinksPosition.Top}
      />;
}

const renderNode = (node: any, path: number[] | undefined) => {
  const displayName = getDisplayName(node);
  const displayElement = getTargetType(node) === 'search'
    ? <Link to={`/search/${getRecordClassUrlSegment(node)}/${node.wdkReference.urlSegment}`}>
        <IconAlt fa="search" />
        {displayName}
      </Link>
    : <span className={path?.length === 2 ? 'SubcategoryText' : undefined}>{displayName}</span>

  const tooltipContent = getTooltipContent(node);

  return tooltipContent
    ? (
      <Tooltip content={tooltipContent}>
        {displayElement}
      </Tooltip>
    )
    : displayElement;
};

const renderNoResults = (searchTerm: string) =>
  <div>
    <p>
      <Icon type="warning"/> We could not find any searches matching "{searchTerm}".
    </p>
  </div>;
