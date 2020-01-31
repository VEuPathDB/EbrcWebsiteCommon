import { keyBy, add, isEqual } from 'lodash';
import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { SiteSearchResponse, SiteSearchDocumentType, SiteSearchDocument } from 'ebrc-client/SiteSearch/Types';
import { makeClassNameHelper, safeHtml } from 'wdk-client/Utils/ComponentUtils';
import { PaginationMenu } from 'wdk-client/Components/Mesa';
import { TreeBoxVocabNode } from 'wdk-client/Utils/WdkModel';
import { CheckboxTree, CheckboxList, Link } from 'wdk-client/Components';
import { getLeaves, pruneDescendantNodes } from 'wdk-client/Utils/TreeUtils';

import './SiteSearch.scss';

interface Props {
  searchString: string;
  response?: SiteSearchResponse;
  offset: number;
  numRecords: number;
  documentType?: string;
  filters?: string[];
  filterOrganisms?: string[];
  organismTree?: TreeBoxVocabNode;
  onSearch: (searchString: string) => void;
  onPageOffsetChange: (offset: number) => void;
  onDocumentTypeChange: (documentType?: string) => void;
  onFiltersChange: (filters: string[]) => void;
  onOrganismsChange: (organisms: string[]) => void;
}

type ResultPropKeys =
  | 'response'
  | 'organismTree';

type ResultProps = Omit<Props, ResultPropKeys> &  Required<Pick<Props, ResultPropKeys>>;

const cx = makeClassNameHelper('SiteSearch');

export default function SiteSearch(props: Props) {
  const { searchString, onSearch, onPageOffsetChange } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cx()}>
      <h1>Search</h1>
      <div className={cx('--SearchContainer')}>
        <div className={cx('--SearchBox')}>
          <input
            type="input"
            ref={inputRef}
            key={searchString}
            defaultValue={searchString}
            placeholder="Search the site"
            onBlur={() => {/* setShowSuggestions(false) */}}
            onFocus={() => {/* setShowSuggestions(true) */}}
            onKeyPress={e => {
              switch(e.key) {
                case 'Esc':
                case 'Escape':
                  // setShowSuggestions(false);
                  break;
                case 'Down':
                case 'ArrowDown':
                  // setShowSuggestions(true);
                  break;
                case 'Enter':
                  onSearch(e.currentTarget.value);
                  break;
                default:
                  return;
              }
            }}
          />
          <button type="button" onClick={() => { inputRef.current && onSearch(inputRef.current.value)}}>
            <i className="fa fa-search"/>
          </button>
        </div>
      </div>
      <div className={cx('--CountsContainer')}>
        { props.response && <SearchCounts {...props as ResultProps}/> }
      </div>
      <div className={cx('--ResultContainer')}>
        <SearchResult {...props} />
      </div>
      <div className={cx('--ResultTypeWidgetContainer')}>
        { props.response && <ResultTypeWidget {...props as ResultProps} /> }
      </div>
    </div>
  )
}

function SearchCounts(props: ResultProps) {
  const { response, documentType, organismTree, filterOrganisms, onOrganismsChange, onDocumentTypeChange } = props;
  const { categories, documentTypes, organismCounts } = response || {};
  const [ onlyShowMatches, setOnlyShowMatches ] = useState(false);
  const docTypesById = useMemo(() => keyBy(documentTypes, 'id'), [ documentTypes ]);
  const finalOrganismTree = useMemo(() => (
    onlyShowMatches
      ? pruneDescendantNodes(
          node => node.children.length > 0 || organismCounts[node.data.term] > 0,
          organismTree
        )
      : organismTree
    ), [ organismTree, organismCounts, onlyShowMatches ]);
  const showOrganismFilter = documentType == null || docTypesById[documentType]?.hasOrganismField;
  
  return (
    <div className={cx('--Counts')}>
      <div className={(cx('--CountsTitle'))}>
        <h2>Filter Results</h2>
        <label className={cx('--OnlyMatchesToggle')}>
          <input type="checkbox" checked={onlyShowMatches} onChange={() => setOnlyShowMatches(!onlyShowMatches)}/> Only show matches
        </label>
      </div>
      <div className={cx('--FilterTitleContainer', 'categories')}>
        <h3>Categories</h3>
        <div className={cx('--FilterButtons', documentType == null ? 'hidden' : 'visible')}>
          <div><button type="button" onClick={() => onDocumentTypeChange()}>Clear filter</button></div>
        </div>
      </div>
      <table className={cx('--SearchCounts')}>
        <tbody>
          {categories.map(category => (
            (onlyShowMatches && category.documentTypes.every(docType => docTypesById[docType]?.count === 0)) ||
            (documentType != null && documentType !== '' && !category.documentTypes.includes(documentType))
          ) ? null : (
            <React.Fragment key={category.name}>
              <tr><th>{category.name}</th></tr>
              {category.documentTypes.map(id => {
                if (documentType != null && documentType !== '' && id !== documentType) return null;
                const docType = docTypesById[id];
                if (docType == null || (onlyShowMatches && docType.count === 0)) return null;
                return (
                  <tr key={docType.id}>
                    <td><button className="link" type="button" onClick={() => onDocumentTypeChange(id)}>{docType.displayName}</button></td>
                    <td>{docType.count ? docType.count.toLocaleString() : null}</td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {showOrganismFilter && organismTree && filterOrganisms && (
        <OrgansimFilter
          organismTree={finalOrganismTree}
          filterOrganisms={filterOrganisms}
          response={response}
          onOrganismsChange={onOrganismsChange}
        />
      )}
    </div>
  )
}

function OrgansimFilter(props: Required<Pick<ResultProps, 'organismTree' | 'filterOrganisms' | 'onOrganismsChange' | 'response'>>) {
  const { organismTree, filterOrganisms, onOrganismsChange, response } = props;
  const initialExpandedNodes = organismTree.children.length === 1 ? organismTree.children.map(node => node.data.term) : [];
  const [ expansion, setExpansion ] = useState<string[]>(initialExpandedNodes);
  const [ selection, setSelection ] = useState<string[]>(filterOrganisms);
  const pendingFilter = !isEqual(selection, filterOrganisms);
  const renderNode = useCallback((node: TreeBoxVocabNode) => {
    const count = node.children.length === 0
      ? response.organismCounts[node.data.term] ?? 0
      : getLeaves(node, node => node.children)
        .map(node => response.organismCounts[node.data.term] ?? 0)
        .reduce(add, 0);  
    return (
      <div className={cx('--OrganismFilterNode')}>
        <div>{node.data.display}</div>
        <div>{count ? count.toLocaleString() : null}</div>
      </div>
    )
  }, [ response ]);
  const getNodeId = useCallback((node: TreeBoxVocabNode) => node.data.term, []);
  const getNodeChildren = useCallback((node: TreeBoxVocabNode) => node.children, []);
  const showResetButton = filterOrganisms.length > 0;
  const showApplyCancelButtons = pendingFilter;
  const showButtons = showResetButton || showApplyCancelButtons;
  return (
    <React.Fragment>
      <div className={cx('--FilterTitleContainer', 'organism')}>
        <h3>Organisms</h3>
        <div className={cx('--FilterButtons', showButtons ? 'visible' : 'hidden')}>
          {showApplyCancelButtons && (
            <React.Fragment>
              <button type="button" onClick={() => onOrganismsChange(selection)}>Apply</button>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <button type="button" onClick={() => setSelection(filterOrganisms)}>Cancel</button>
            </React.Fragment>
          )}
          {showResetButton && (
            <React.Fragment>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <button type="button" style={{ }} onClick={() => (onOrganismsChange([]),  setSelection([]))}>Clear filter</button>
            </React.Fragment>
          )}
        </div>
      </div>
      <CheckboxTree<TreeBoxVocabNode>
        tree={organismTree}
        getNodeId={getNodeId}
        getNodeChildren={getNodeChildren}
        renderNode={renderNode}
        expandedList={expansion}
        onExpansionChange={setExpansion}
        isSelectable
        selectedList={selection}
        onSelectionChange={setSelection}
      />
    </React.Fragment>
  )
}

function SearchResult(props: Props) {
  const { numRecords, offset, response, searchString, onPageOffsetChange } = props;
  const documentTypesById = useMemo(() => keyBy(response?.documentTypes, 'id'), [ response]);
  if (searchString == '') {
    return (
      <div>Type a search above and press Enter.</div>
    )
  }
  if (response == null) return (
    <div>Wating for results</div>
  )
  if (response.searchResults.totalCount == 0) {
    return (
      <div>Nothing matched your search. Try something else.</div>
    )
  }

  const { searchResults: result } = response;
  const firstRec = offset + 1;
  const lastRec = Math.min(result.totalCount, offset + numRecords);
  const totalPages = Math.ceil(result.totalCount / numRecords);
  const currentPage = Math.ceil((offset + 1) / numRecords)
  return (
    <React.Fragment>
      <div className="MesaComponent">
        <div className={cx('--ResultInfo')}>{firstRec} - {lastRec} of {result.totalCount.toLocaleString()} results for <strong>"{searchString}"</strong></div>
        <PaginationMenu
          totalRows={result.totalCount}
          totalPages={totalPages}
          currentPage={currentPage}
          rowsPerPage={numRecords}
          onPageChange={(newPage: number) => {
            onPageOffsetChange((newPage -1) * numRecords)
          }}
        />
      </div>
      <div className={cx('--ResultList')}>
        {result.documents.map((document, index) => {
          const documentType = documentTypesById[document.documentType];
          const { link, summary } = resultDetails(document, documentType);
          return (
            <div key={index} className={cx('--Result')}>
              <div className={cx('--ResultLink')}>
                {link.isRoute ? <Link to={link.url}>{documentType.displayName} - {link.text}</Link> : <a href={link.url}>{link.text}</a>}
              </div>
              <div className={cx('--ResultSummary')}>{summary}</div>
            </div>
          )
        })}
      </div>
      <div className="MesaComponent">
        <div className={cx('--ResultInfo')}>{firstRec} - {lastRec} of {result.totalCount.toLocaleString()} results for <strong>"{searchString}"</strong></div>
        <PaginationMenu
          totalRows={result.totalCount}
          totalPages={totalPages}
          currentPage={currentPage}
          rowsPerPage={numRecords}
          onPageChange={(newPage: number) => {
            onPageOffsetChange((newPage -1) * numRecords)
          }}
        />
      </div>

    </React.Fragment>
  );
}

function ResultTypeWidget(props: ResultProps) {
  const { response, documentType, filters = [], onFiltersChange } = props;
  const [ selection, setSelection ] = useState(filters);
  
  useEffect(() => {
    setSelection(filters);
  }, [ filters ])
  
  if (documentType == null) return null;

  const docType = response.documentTypes.find(d => d.id === documentType);
  if (docType == null || !docType.isWdkRecordType) return null;

  const showResetButton = filters.length > 0;
  const showApplyCancelButtons = !isEqual(selection, filters);
  const showButtons = showResetButton || showApplyCancelButtons;
  return (
    <React.Fragment>
      <div className={cx('--ResultTypeWidget')}>
        <div className={cx('--FilterTitleContainer', 'widget')}>
          <h2>Filter {docType.displayName} Fields</h2>
          <div className={cx('--FilterButtons', showButtons ? 'visible' : 'hidden')}>
            {showApplyCancelButtons && (
              <React.Fragment>
                <button type="button" onClick={() => onFiltersChange(selection)}>Apply</button>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <button type="button" onClick={() => setSelection(filters)}>Cancel</button>
              </React.Fragment>
            )}
            {showResetButton && (
              <React.Fragment>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <button type="button" style={{ }} onClick={() => onFiltersChange([])}>Clear filter</button>
              </React.Fragment>
            )}
          </div>
        </div>
        <CheckboxList
          items={docType.wdkRecordTypeData.searchFields.map(field => ({
            display: field.displayName,
            value: field.name
          }))}
          value={selection}
          onChange={setSelection}
        />
      </div>
      <div className={cx('--LinkOut')}>
        <button type="button" className="btn" onClick={() => alert('Coming soon')}>
          View as a Search Strategy <i className="fa fa-2 fa-angle-double-right"/>
        </button>
      </div>
    </React.Fragment>
  )

}

interface ResultEntryDetails {
  link: {
    isRoute: boolean;
    url: string;
    text: React.ReactNode;
  };
  summary: React.ReactNode;
}

// For now, all entries will have a link and a summary
function resultDetails(document: SiteSearchDocument, documentType: SiteSearchDocumentType): ResultEntryDetails {
  
  if (documentType.isWdkRecordType) {
    return {
      link: makeRecordLink(document),
      summary: makeGenericSummary(document, documentType)
    }
  }

  if (documentType.id === 'search') {
    const [ searchName, recordName ] = document.primaryKey;
    return {
      link: {
        isRoute: true,
        url: `/search/${recordName}/${searchName}`,
        text: formatSummaryFieldValue(document.summaryFieldData.TEXT__search_displayName)
      },
      summary: makeGenericSummary(document, documentType)
    }
  }

  return {
    link: {
      isRoute: true,
      url: '',
      text: document.primaryKey.join('/')
    },
    summary: makeGenericSummary(document, documentType)
  }
}

function makeRecordLink(document: SiteSearchDocument): ResultEntryDetails['link'] {
  return {
    isRoute: true,
    url: `/record/${document.documentType}/${document.primaryKey.join('/')}`,
    text: document.primaryKey[0]
  }
}

function makeGenericSummary(document: SiteSearchDocument, documentType: SiteSearchDocumentType) {
  const foundInFields = documentType.isWdkRecordType && documentType.wdkRecordTypeData.searchFields
    .filter(field => document.foundInFields.includes(field.name))
    .map(field => field.displayName);
  const summaryFields = documentType.summaryFields
    .flatMap(summaryField => {
      const value = formatSummaryFieldValue(document.summaryFieldData[summaryField.name]);
      return value == null ? [] : [ { ...summaryField, value } ]
    });
  return (
    <React.Fragment>
      {summaryFields.map(({ displayName, value }) => (
        <div><strong>{displayName}:</strong> {safeHtml(value, null, 'span')}</div>
      ))}
      {foundInFields && foundInFields.length > 0 && <div><strong>Found in: </strong> {foundInFields.join('; ')}</div>}
    </React.Fragment>
  );
}

function formatSummaryFieldValue(value?: string | string[]) {
  return Array.isArray(value) ? value.join('; ') : value;
}