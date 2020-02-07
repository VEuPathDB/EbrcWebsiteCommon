import { capitalize, keyBy, add, isEqual } from 'lodash';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { SiteSearchResponse, SiteSearchDocumentType, SiteSearchDocument } from 'ebrc-client/SiteSearch/Types';
import { makeClassNameHelper, safeHtml } from 'wdk-client/Utils/ComponentUtils';
import { PaginationMenu } from 'wdk-client/Components/Mesa';
import { TreeBoxVocabNode } from 'wdk-client/Utils/WdkModel';
import { CheckboxTree, CheckboxList, LoadingOverlay } from 'wdk-client/Components';
import { getLeaves, pruneDescendantNodes } from 'wdk-client/Utils/TreeUtils';

import './SiteSearch.scss';

interface Props {
  loading: boolean;
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

  return (
    <div className={cx()}>
      {props.loading && <div className={cx('--Loading')}><div>Loading...</div></div>}
      <h1>{Title(props)}</h1>
      {props.response && <Results {...props as ResultProps} />}
    </div>
  )
}

function Results(props: ResultProps) {
  if (props.response.searchResults.totalCount === 0) {
    return (
      <div style={{ fontSize: '1.5em', textAlign: 'center' }}>Nothing matched your search. Try something else.</div>
    )
  }
  return (
    <div className={cx('--Results')}>
      <Pagination {...props} />
      <div className={cx('--CountsContainer')}>
        <SearchCounts {...props}/>
      </div>
      <div className={cx('--ResultTypeWidgetContainer')}>
        <StrategyLinkout {...props}/>
        <ResultTypeWidget {...props} />
      </div>
      <div className={cx('--ResultContainer')}>
        <SearchResult {...props} />
      </div>
      <Pagination {...props}/>
    </div>
  )
}

function Title(props: Props) {
  const { response, documentType, searchString } = props;

  if (!searchString) {
    return <React.Fragment>No results</React.Fragment>
  }

  if (!documentType) {
    return <React.Fragment>All results matching <strong>{searchString}</strong></React.Fragment>
  }

  if (response == null) return null;

  const docType = response.documentTypes.find(d => d.id === documentType);
  const display = docType?.displayNamePlural ?? capitalize(documentType);

  return <React.Fragment>{display} matching <strong>{searchString}</strong></React.Fragment>
}

function ResultInfo(props: ResultProps) {
  const { numRecords, offset, response } = props;
  const { searchResults: result } = response;
  const firstRec = offset + 1;
  const lastRec = Math.min(result.totalCount, offset + numRecords);
  return (
    <div className={cx('--ResultInfo')}>
      {firstRec} - {lastRec} of {result.totalCount.toLocaleString()}
    </div>
  )
}

function SearchCounts(props: ResultProps) {
  const { response, documentType, organismTree, filterOrganisms, onOrganismsChange, onDocumentTypeChange } = props;
  const { categories, documentTypes, organismCounts } = response || {};
  const [ onlyShowMatches, setOnlyShowMatches ] = useState(true);
  const docTypesById = useMemo(() => keyBy(documentTypes, 'id'), [ documentTypes ]);
  const finalOrganismTree = useMemo(() => (
    onlyShowMatches
      ? pruneDescendantNodes(
          node => node.children.length > 0 || organismCounts[node.data.term] > 0,
          organismTree
        )
      : organismTree
    ), [ organismTree, organismCounts, onlyShowMatches ]);
  const showOrganismFilter = documentType == null
    ? documentTypes.filter(d => d.count > 0).some(d => d.hasOrganismField)
    : docTypesById[documentType]?.hasOrganismField;
  const totalOrgsCount = Object.values(organismCounts).reduce(add, 0);

  return (
    <div className={cx('--Counts')}>
      <div className={(cx('--CountsTitle'))}>
        <label className={cx('--OnlyMatchesToggle')}>
          <input type="checkbox" checked={onlyShowMatches} onChange={() => setOnlyShowMatches(!onlyShowMatches)}/> Show matches only
        </label>
      </div>
      <div className={cx('--FilterTitleContainer', 'categories')}>
        <h3>Filter Results</h3>
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
                    <td><button className="link" type="button" onClick={() => onDocumentTypeChange(id)}>{docType.displayNamePlural}</button></td>
                    <td>{docType.count ? docType.count.toLocaleString() : null}</td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {totalOrgsCount > 0 && showOrganismFilter && organismTree && filterOrganisms && (
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
  const initialExpandedNodes = useMemo(() => organismTree.children.length === 1 ? organismTree.children.map(node => node.data.term) : [], [ organismTree ]);
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

  useEffect(() => {
    setExpansion(initialExpandedNodes);
  }, [ initialExpandedNodes ]);

  useEffect(() => {
    setSelection(filterOrganisms);
  }, [ filterOrganisms ]);

  return (
    <React.Fragment>
      <div className={cx('--FilterTitleContainer', 'organism')}>
        <h3>Filter Organisms</h3>
        <div className={cx('--FilterButtons', showButtons ? 'visible' : 'hidden')}>
          {showApplyCancelButtons && (
            <React.Fragment>
              <button type="button" className={cx('--GreenButton')} onClick={() => onOrganismsChange(selection)}>Apply</button>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <button type="button" className={cx('--RedButton')} onClick={() => setSelection(filterOrganisms)}>Cancel</button>
            </React.Fragment>
          )}
          {showResetButton && (
            <React.Fragment>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <button type="button" onClick={() => (onOrganismsChange([]),  setSelection([]))}>Clear filter</button>
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
        linksPosition={CheckboxTree.LinkPlacement.Top}
      />
    </React.Fragment>
  )
}

function SearchResult(props: ResultProps) {
  const { response } = props;
  const documentTypesById = useMemo(() => keyBy(response?.documentTypes, 'id'), [ response]);
  if (response.searchResults.totalCount == 0) {
    return (
      <div>Nothing matched your search. Try something else.</div>
    )
  }

  const { searchResults: result } = response;
  return (
    <React.Fragment>
      <DirectHit {...props}/>
      <div className={cx('--ResultList')}>
        {result.documents.map((document, index) => (
          <Hit key={index} document={document} documentType={documentTypesById[document.documentType]} />
        ))}
      </div>
    </React.Fragment>
  );
}

interface HitProps {
  document: SiteSearchDocument;
  documentType: SiteSearchDocumentType;
  classNameModifier?: string;
}

function Hit(props: HitProps) {
  const { classNameModifier, document, documentType } = props;
  const { link, summary } = resultDetails(document, documentType);
  return (
    <div className={cx('--Result', classNameModifier)}>
      <div className={cx('--ResultLink', classNameModifier)}>
        {link.isRoute ? <Link to={link.url}>{documentType.displayName} - {link.text}</Link> : <a href={link.url}>{link.text}</a>}
      </div>
      <div className={cx('--ResultSummary', classNameModifier)}>{summary}</div>
    </div>
  )
}

function DirectHit(props: ResultProps) {
  const { response, searchString } = props;
  // quote chars to "remove" when comparing
  const quotes = [``, `'`, `"`];
  const firstHit = response?.searchResults?.documents[0];
  const firstHitDocType = response?.documentTypes.find(d => d.id === firstHit?.documentType);
  const firstHitIsExact = firstHit != null && quotes.some(q => searchString.toLowerCase() === (q + firstHit.wdkPrimaryKeyString + q).toLowerCase());

  if (!response || !firstHit || !firstHitDocType || !firstHitIsExact) return null;

  return (
    <Hit classNameModifier="exact" document={firstHit} documentType={firstHitDocType}/>
  );
}

function StrategyLinkout(props: ResultProps) {
  const { response, documentType, filters = [], filterOrganisms = [], searchString } = props;
  const docType = response.documentTypes.find(d => d.id === documentType);
  if (docType == null || !docType.isWdkRecordType) return null;

  const paramFields = docType.wdkRecordTypeData.searchFields.flatMap(f =>
    filters.length === 0 || filters.includes(f.name) ? [ f.term ] : []);
  const paramOrganisms = filterOrganisms.length > 0 ? filterOrganisms : Object.keys(response.organismCounts);
  const strategyUrl = `/search/${docType.id}/${docType.wdkRecordTypeData.searchName}?autoRun&param.solr_text_fields=${encodeURIComponent(JSON.stringify(paramFields))}&param.solr_search_organism=${encodeURIComponent(JSON.stringify(paramOrganisms))}&param.text_expression=${encodeURIComponent(searchString)}&param.timestamp=${Date.now()}`;
  return (
    <div className={cx('--LinkOut')}>
      <Link to={strategyUrl} onClick={(event) => {
        if (documentType !== 'gene') {
          event.preventDefault();
          alert('coming soon');
        }
      }}>
        <div>View as a Search Strategy</div>
        <div><small>to download or data mine</small></div>
      </Link>
    </div>
  )

}

function ResultTypeWidget(props: ResultProps) {
  const { response, documentType, onFiltersChange } = props;
  const docType = response.documentTypes.find(d => d.id === documentType);
  const allFields = useMemo(() => docType?.isWdkRecordType ? docType.wdkRecordTypeData.searchFields.map(f => f.name) : [], [ docType ]);
  const filters = props.filters?.length === 0 ? allFields : props.filters || [];
  const [ selection, setSelection ] = useState(filters);
  
  useEffect(() => {
    setSelection(filters);
  }, [ filters ])
    

  if (docType == null || !docType.isWdkRecordType) return null;

  const isDisabled = selection.length === 0 || isEqual(filters, selection);
  
  return (
    <div className={cx('--ResultTypeWidget')}>
      <h2>Search Options</h2>
      <div className={cx('--FilterTitleContainer', 'widget')}>
        <h3>Fields to search</h3>
      </div>
      <CheckboxList
        items={docType.wdkRecordTypeData.searchFields.map(field => ({
          display: field.displayName,
          value: field.name
        }))}
        value={selection}
        onChange={setSelection}
      />
      <div className={cx('--FilterButtons')}>
        <button type="button" disabled={isDisabled} className={cx('--GreenButton')} onClick={() => onFiltersChange(selection)}>Update results</button>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <button type="button" disabled={isDisabled} className={cx('--RedButton')} onClick={() => setSelection(filters)}>Cancel</button>
      </div>
    </div>
  );
}

function Pagination(props: ResultProps) {
  const { numRecords, offset, response, onPageOffsetChange } = props;
  const { searchResults } = response;
  const totalPages = Math.ceil(searchResults.totalCount / numRecords);
  const currentPage = Math.ceil((offset + 1) / numRecords)
  return (
    <div className={`MesaComponent ${cx('--Pagination')}`}>
    <ResultInfo {...props as ResultProps}/>
    <PaginationMenu
      totalRows={searchResults.totalCount}
      totalPages={totalPages}
      currentPage={currentPage}
      rowsPerPage={numRecords}
      onPageChange={(newPage: number) => {
        onPageOffsetChange((newPage -1) * numRecords)
      }}
    />
  </div>
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
    text: document.primaryKey.join(' - ')
  }
}

function makeGenericSummary(document: SiteSearchDocument, documentType: SiteSearchDocumentType) {
  const foundInFields = documentType.isWdkRecordType && documentType.wdkRecordTypeData.searchFields
    .filter(field => Object.keys(document.foundInFields).includes(field.name))
    .map(field => field.displayName);
  const summaryFields = documentType.summaryFields
    .flatMap(summaryField => {
      const value = formatSummaryFieldValue(document.summaryFieldData[summaryField.name]);
      return value == null ? [] : [ { ...summaryField, value } ]
    });
  return (
    <React.Fragment>
      {summaryFields.map(({ name, displayName, value }) => (
        <div key={name}><strong>{displayName}:</strong> {safeHtml(value, null, 'span')}</div>
      ))}
      {foundInFields && foundInFields.length > 0 && <div className={cx('--FieldsHit')}><strong><em>Fields matched: </em></strong> {foundInFields.join('; ')}</div>}
    </React.Fragment>
  );
}

function formatSummaryFieldValue(value?: string | string[]) {
  return Array.isArray(value) ? value.join('; ') : value;
}
