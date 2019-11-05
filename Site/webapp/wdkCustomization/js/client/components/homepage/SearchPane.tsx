import React, { useState, useMemo } from 'react';

import { noop } from 'lodash';

import { CategoriesCheckboxTree, Link, Tooltip, Icon, Loading, IconAlt } from 'wdk-client/Components';
import { LinksPosition } from 'wdk-client/Components/CheckboxTree/CheckboxTree';
import { CategoryTreeNode, getDisplayName, getTargetType, getRecordClassUrlSegment, getTooltipContent } from 'wdk-client/Utils/CategoryUtils';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import { combineClassNames } from './Utils';

import './SearchPane.scss';

const cx = makeClassNameHelper('ebrc-SearchPane');

type Props = {
  containerClassName?: string,
  searchTree?: CategoryTreeNode
};

export const SearchPane = (props: Props) => {
  const [ expandedBranches, setExpandedBranches ] = useState<string[]>([]);
  const [ searchTerm, setSearchTerm ] = useState('');

  return (
    <nav className={combineClassNames(cx(), props.containerClassName)}>
      <h6>
        SPECIALIZED SEARCHES
      </h6> 
      <SearchCheckboxTree 
        searchTree={props.searchTree} 
        searchTerm={searchTerm}
        expandedBranches={expandedBranches}
        setSearchTerm={setSearchTerm}
        setExpandedBranches={setExpandedBranches}
      />
    </nav>
  );
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
        selectedLeaves={noSelectedLeaves}
        onChange={noop}
        tree={props.searchTree}
        expandedBranches={props.expandedBranches}
        searchTerm={props.searchTerm}
        isSelectable={false}
        searchBoxPlaceholder="Find a search..."
        leafType="search"
        renderNode={renderNode}
        renderNoResults={renderNoResults}
        onUiChange={props.setExpandedBranches}
        onSearchTermChange={props.setSearchTerm}
        showSearchBox   
        linksPosition={LinksPosition.Top}
      />;
}

const renderNode = (node: any) => {
  const displayName = getDisplayName(node);
  const displayElement = getTargetType(node) === 'search'
    ? <Link to={`/search/${getRecordClassUrlSegment(node)}/${node.wdkReference.urlSegment}`}>
        <IconAlt fa="search" />
        {displayName}
      </Link>
    : <span>{displayName}</span>

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
