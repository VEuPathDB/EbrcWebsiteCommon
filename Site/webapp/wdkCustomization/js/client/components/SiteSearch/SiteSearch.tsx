import { capitalize, keyBy, add, isEmpty, isEqual, xor, intersection } from 'lodash';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { CheckboxTree, CheckboxList, CollapsibleSection, LoadingOverlay } from 'wdk-client/Components';
import { PaginationMenu, AnchoredTooltip } from 'wdk-client/Components/Mesa';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';
import { makeClassNameHelper, safeHtml } from 'wdk-client/Utils/ComponentUtils';
import { getLeaves, pruneDescendantNodes } from 'wdk-client/Utils/TreeUtils';
import { TreeBoxVocabNode } from 'wdk-client/Utils/WdkModel';
import { useProjectUrls, ProjectUrls, useOrganismToProject, OrganismToProject } from 'ebrc-client/hooks/projectUrls';
import { SiteSearchResponse, SiteSearchDocumentType, SiteSearchDocument } from 'ebrc-client/SiteSearch/Types';

import './SiteSearch.scss';

interface Props {
  loading: boolean;
  searchString: string;
  response: SiteSearchResponse;
  offset: number;
  numRecords: number;
  documentType?: string;
  filters?: string[];
  filterOrganisms?: string[];
  organismTree: TreeBoxVocabNode;
  onSearch: (searchString: string) => void;
  onPageOffsetChange: (offset: number) => void;
  onDocumentTypeChange: (documentType?: string) => void;
  onFiltersChange: (filters: string[]) => void;
  onOrganismsChange: (organisms: string[]) => void;
}

const cx = makeClassNameHelper('SiteSearch');

const cancelIcon = <i className="fa fa-times"/>;

function FilterTitleSegment(props: Props) {
  const filters = [ !isEmpty(props.filters) && 'fields', !isEmpty(props.filterOrganisms) && 'organisms' ].filter(Boolean).join(' and ');
  return filters.length > 0 ? <em>(filtered by {filters})</em> : null;
}

export default function SiteSearch(props: Props) {

  return (
    <div className={cx()}>
      {props.loading && <LoadingOverlay>Loading results...</LoadingOverlay>}
      <div className={cx('--TitleLine')}>
        <h1>{Title(props)}</h1>
        <StrategyLinkout {...props}/>
      </div>
      <Results {...props} />
    </div>
  )
}

function Results(props: Props) {
  if (props.response.searchResults.totalCount === 0) {
    const docType = props.documentType ? props.response.documentTypes.find(d => d.id === props.documentType) : undefined;
    const preface = docType ? `No ${docType.displayNamePlural}` : `Nothing`;
    return (
      <div style={{ fontSize: '1.5em', textAlign: 'center' }}>
        {preface} matched <strong>{props.searchString}</strong> <FilterTitleSegment {...props}/>
      </div>
    )
  }
  return (
    <div className={cx('--Results')}>
      <Pagination {...props} />
      <div className={cx('--CountsContainer')}>
        <SearchCounts {...props}/>
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
    return <React.Fragment>All results matching <strong>{searchString}</strong> <FilterTitleSegment {...props} /></React.Fragment>
  }

  if (response == null) return null;

  const docType = response.documentTypes.find(d => d.id === documentType);
  const display = docType?.displayNamePlural ?? capitalize(documentType);

  return <React.Fragment>{display} matching <strong>{searchString}</strong> <FilterTitleSegment {...props} /></React.Fragment>
}

function ResultInfo(props: Props) {
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

function SearchCounts(props: Props) {
  const { response, documentType, organismTree, filterOrganisms, onOrganismsChange, onDocumentTypeChange, searchString } = props;
  const { categories, documentTypes, organismCounts } = response || {};
  const [ onlyShowMatches, setOnlyShowMatches ] = useState(true);
  const [ resultFilterLastAutoAppliedTo, setResultFilterLastAutoAppliedTo ] = useState<string | undefined>(undefined);
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

  useEffect(() => {
    const documentTypesWithNonzeroCounts = documentTypes.filter(({ count }) => count !== 0);
    if (
      documentType == null &&
      documentTypesWithNonzeroCounts.length === 1 &&
      resultFilterLastAutoAppliedTo !== searchString
    ) {
      onDocumentTypeChange(documentTypesWithNonzeroCounts[0].id);
      setResultFilterLastAutoAppliedTo(searchString);
    }
  }, [ documentTypes ]);

  return (
    <div className={cx('--Counts')}>
      <div className={(cx('--CountsTitle'))}>
        <label className={cx('--OnlyMatchesToggle')}>
          <input type="checkbox" checked={onlyShowMatches} onChange={() => setOnlyShowMatches(!onlyShowMatches)}/> Hide zero counts
        </label>
      </div>
      <div className={cx('--FilterTitleContainer', 'categories')}>
        <h3>Filter results</h3>
      </div>
      <table className={cx('--SearchCounts')}>
        <tbody>
          {categories.map(category => (
            (onlyShowMatches && category.documentTypes.every(docType => docTypesById[docType]?.count === 0)) ||
            (documentType != null && documentType !== '' && !category.documentTypes.includes(documentType))
          ) ? null : (
            <React.Fragment key={category.name}>
              <tr>
                <th>{category.name}</th>
                <th>
                  {documentType && (
                    <div className={cx('--FilterButtons', documentType == null ? 'hidden' : 'visible')}>
                      <div><button type="button" className="link" onClick={() => onDocumentTypeChange()}>Clear filter</button></div>
                    </div>
                  )}
                </th>
              </tr>
              {category.documentTypes.map(id => {
                if (documentType != null && documentType !== '' && id !== documentType) return null;
                const docType = docTypesById[id];
                if (docType == null || (onlyShowMatches && docType.count === 0)) return null;
                return (
                  <tr key={docType.id}>
                    <td>
                      {docType.id === documentType
                        ? docType.displayNamePlural
                        : <button className="link" type="button" onClick={() => onDocumentTypeChange(id)}>{docType.displayNamePlural}</button>}
                    </td>
                    <td>{docType.count ? docType.count.toLocaleString() : null}</td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <WdkRecordFields {...props} onlyShowMatches={onlyShowMatches} />
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

function OrgansimFilter(props: Required<Pick<Props, 'organismTree' | 'filterOrganisms' | 'onOrganismsChange' | 'response'>>) {
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
        <h3>Filter organisms</h3>
        <div className={cx('--FilterButtons', showButtons ? 'visible' : 'hidden')}>
          {showApplyCancelButtons ? (
            <React.Fragment>
              <button type="button" className={cx('--GreenButton') + ' btn'} onClick={() => onOrganismsChange(selection)}>Apply</button>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <button type="button" className={cx('--RedButton') + ' btn'} onClick={() => setSelection(filterOrganisms)}>{cancelIcon}</button>
            </React.Fragment>
          ) : showResetButton ? (
            <React.Fragment>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <button type="button" className="link" onClick={() => (onOrganismsChange([]))}>Clear filter</button>
            </React.Fragment>
          ) : null}
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

function SearchResult(props: Props) {
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
          <Hit
            key={index}
            document={document}
            documentType={documentTypesById[document.documentType]}
          />
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
  const subTitleField = documentType.summaryFields.find(f => f.isSubtitle);
  const subTitle = subTitleField && document.summaryFieldData[subTitleField.name];
  return (
    <div className={cx('--Result', classNameModifier)}>
      <div className={cx('--ResultLink', classNameModifier)}>
        {link.isRoute ?
          <Link to={link.url} target={link.target}>{documentType.displayName} - {link.text}</Link> :
          <a href={link.url} target={link.target}>{documentType.displayName} - {link.text}</a>}
        {subTitle && <div className={cx('--ResultSubTitle')}>{formatSummaryFieldValue(subTitle)}</div>}
      </div>
      {summary && <div className={cx('--ResultSummary', classNameModifier)}>{summary}</div>}
      <FieldsHit {...props}/>
    </div>
  )
}

function DirectHit(props: Props) {
  const { response, searchString } = props;
  // quote chars to "remove" when comparing
  const quotes = [``, `'`, `"`];
  const firstHit = response?.searchResults?.documents[0];
  const firstHitDocType = response?.documentTypes.find(d => d.id === firstHit?.documentType);
  const firstHitIsExact = firstHit != null && quotes.some(q => searchString.toLowerCase() === (q + firstHit.wdkPrimaryKeyString + q).toLowerCase());

  if (!response || !firstHit || !firstHitDocType || !firstHitIsExact) return null;

  return (
    <Hit
      classNameModifier="exact"
      document={firstHit}
      documentType={firstHitDocType}
    />
  );
}

function FieldsHit(props: HitProps) {
  const { document, documentType } = props;
  const [ expandHighlights, updateExpandHightlights ] = useState(false);
  const foundInFields = documentType.searchFields
    .filter(field => field.name in document.foundInFields);
  if (!foundInFields || foundInFields.length === 0) return null;
  const headerContent = expandHighlights
    ? <strong>Fields matched</strong>
    : <div>
        <strong>Fields matched:</strong>&nbsp;
        <em>{foundInFields.map(f => f.displayName).join('; ')}</em>
      </div>
  return (
    <CollapsibleSection
      className={cx('--FieldsHit')}
      isCollapsed={!expandHighlights}
      onCollapsedChange={isCollapsed => updateExpandHightlights(!isCollapsed)}
      headerContent={headerContent}
    >
      <ul>
        {foundInFields.map(f => (
          <li key={f.name} className={cx('--FieldHighlight')}>
            <strong>{f.displayName}: </strong>
            {document.foundInFields[f.name].flatMap((value, index, array) =>
              [ safeHtml(value, { key: index }), index < array.length - 1 && '...' ]
              )}
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  )
}

function StrategyLinkout(props: Props) {
  const { response, documentType, filters = [], filterOrganisms = [], searchString } = props;
  const docType = response.documentTypes.find(d => d.id === documentType);
  const organismParam = useWdkService(async wdkService => {
    if (docType == null || !docType.isWdkRecordType) return;
    const question = await wdkService.getQuestionAndParameters(docType.wdkSearchName);
    return question.parameters.find(param => param.name === 'text_search_organism');
  }, [ docType ]);
  if (docType == null) return <StrategyLinkoutLink tooltipContent="To export, select a result type (like Genes) on the left."/>
    if (
      !docType.isWdkRecordType ||
      organismParam == null ||
      organismParam.type !== 'multi-pick-vocabulary' 
    ) return <StrategyLinkoutLink tooltipContent={`This feature is not available for ${docType.displayNamePlural}`}/>
  const paramFields = docType.searchFields.flatMap(f =>
    filters.length === 0 || filters.includes(f.name) ? [ f.term ] : []);
  const paramSelection = filterOrganisms.length > 0 ? filterOrganisms : Object.keys(response.organismCounts); 
  const searchOrganismList = organismParam.displayType === 'treeBox'
    ? getLeaves(organismParam.vocabulary, node => node.children).map(n => n.data.term)
    : organismParam.vocabulary.map(([ term ]) => term);
  const paramOrganisms = intersection(paramSelection, searchOrganismList);
  const strategyUrl = `/search/${docType.id}/${docType.wdkSearchName}?autoRun` +
    `&param.document_type=${encodeURIComponent(docType.id)}` +
    `&param.text_fields=${encodeURIComponent(JSON.stringify(paramFields))}` +
    `&param.text_search_organism=${encodeURIComponent(JSON.stringify(paramOrganisms))}` +
    `&param.text_expression=${encodeURIComponent(searchString)}` +
    `&param.timestamp=${Date.now()}`;

  return <StrategyLinkoutLink strategyUrl={strategyUrl} tooltipContent="Download or data mine using the search strategy system." />;
}

function StrategyLinkoutLink(props: { strategyUrl?: string, tooltipContent: string }) {
  const { strategyUrl, tooltipContent } = props;
  const history = useHistory();
  const disabled = strategyUrl == null;
  return (
    <div className={cx('--LinkOut')}>
      <AnchoredTooltip content={tooltipContent}>
        <button disabled={disabled} className="btn" type="button" onClick={() => {
          if (strategyUrl) history.push(strategyUrl);
        }}>
          <div className={cx('--LinkOutText')}>
            <div>Export as a Search Strategy</div>
            <div><small>to download or data mine</small></div>
          </div>
          <div className={cx('--LinkOutArrow')}>
            <i className="fa fa-caret-right"/>
          </div>
        </button>
      </AnchoredTooltip>
    </div>
  );

}

function WdkRecordFields(props: Props & { onlyShowMatches: boolean }) {
  const { response, documentType, onFiltersChange, onlyShowMatches, filters = [] } = props;
  const docType = response.documentTypes.find(d => d.id === documentType);
  const allFields = useMemo(() => docType?.isWdkRecordType ? docType.searchFields.map(f => f.name) : [], [ docType ]);
  const [ selection, setSelection ] = useState(filters);

  useEffect(() => {
    setSelection(filters);
  }, [ filters ])

  if (docType == null || docType.searchFields.length === 0) return (
    <React.Fragment>
      <div className={cx('--FilterTitleContainer', 'widget')}>
        <h3>Filter fields</h3>
      </div>
      <div>
        <em style={{ color: '#666666' }}>{docType == null ? 'Select a result filter above' : 'None available'}</em>
      </div>
    </React.Fragment>
  );

  const showApplyCancel = xor(filters, selection).length > 0;
  const showClear = selection.length > 0 && xor(filters, allFields).length > 0;

  return (
    <React.Fragment>
      <div className={cx('--FilterTitleContainer', 'widget')}>
        <h3>Filter {docType.displayName} fields</h3>
        <div className={cx('--FilterButtons')}>
          {showApplyCancel ? (
            <React.Fragment>
              <button type="button" className={cx('--GreenButton') + ' btn'} onClick={() => onFiltersChange(selection)}>Apply</button>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <button type="button" className={cx('--RedButton') + ' btn'} onClick={() => setSelection(filters)}>{cancelIcon}</button>
            </React.Fragment>
          ) : showClear ? (
            <button type="button" className="link" onClick={() => onFiltersChange([])}>Clear filter</button>
          ) : null}
        </div>
      </div>
      <CheckboxList
        items={docType.searchFields
          .filter(field => onlyShowMatches ? response.fieldCounts && response.fieldCounts[field.name] > 0 : true)
          .map(field => ({
            display: (
              <div className={cx('--ResultTypeWidgetItem')}>
                <div>{field.displayName}</div>
                {response.fieldCounts && response.fieldCounts[field.name] > 0 &&
                  <div>{(response.fieldCounts[field.name]).toLocaleString()}</div>
                }
              </div>
            ),
            value: field.name
          }))
        }
        value={selection}
        onChange={setSelection}
        linksPosition={CheckboxList.LinksPosition.Top}
      />
    </React.Fragment>
  );
}

function Pagination(props: Props) {
  const { numRecords, offset, response, onPageOffsetChange } = props;
  const { searchResults } = response;
  const totalPages = Math.ceil(searchResults.totalCount / numRecords);
  const currentPage = Math.ceil((offset + 1) / numRecords)
  return (
    <div className={`MesaComponent ${cx('--Pagination')}`}>
    <ResultInfo {...props as Props}/>
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
    target?: string;
  };
  summary: React.ReactNode;
}

// For now, all entries will have a link and a summary
function resultDetails(document: SiteSearchDocument, documentType: SiteSearchDocumentType): ResultEntryDetails {

  const projectUrls = useProjectUrls();
  const organismToProject = useOrganismToProject();
  const projectId = useWdkService(async wdkService => (await wdkService.getConfig()).projectId, []);

  // wdk records
  if (documentType.isWdkRecordType) {
    return {
      link: makeRecordLink(document, projectUrls, organismToProject, projectId),
      summary: makeGenericSummary(document, documentType)
    }
  }

  // searches
  if (documentType.id === 'search') {
    const [ searchName, recordName ] = document.primaryKey;
    return {
      link: {
        isRoute: true,
        url: `/search/${recordName}/${searchName}`,
        text: document.hyperlinkName || document.primaryKey.join(' - ')
      },
      summary: makeGenericSummary(document, documentType)
    }
  }

  // mapveu
  if (documentType.id === 'popbio-sample') {
    return {
      link: {
        isRoute: false,
        url: `/popbio-map/web/?sampleID=${document.primaryKey[0]}`,
        text: document.hyperlinkName || document.primaryKey.join(' - '),
        target: '_blank'
      },
      summary: makeGenericSummary(document, documentType)
    }
  }

  // static content
  if (
    documentType.id === 'news' ||
    documentType.id === 'general' ||
    documentType.id === 'tutorial'
  ) {
    // Handle the special case of tutorials that are offered as home page cards
    const url = documentType.id === 'tutorial' && document.primaryKey.length === 1 && document.primaryKey[0].startsWith('#')
      ? `/${document.primaryKey[0]}`
      : `/static-content/${document.primaryKey.join('/')}.html`;

    return {
      link: {
        isRoute: true,
        url,
        text: document.hyperlinkName || document.primaryKey.join(' - ')
      },
      summary: makeGenericSummary(document, documentType)
    };
  }

  return {
    link: {
      isRoute: true,
      url: '',
      text: document.hyperlinkName || document.primaryKey.join('/')
    },
    summary: makeGenericSummary(document, documentType)
  }
}

function makeRecordLink(document: SiteSearchDocument, projectUrls?: ProjectUrls, organismToProject?: OrganismToProject, projectId?: string): ResultEntryDetails['link'] {
  const text = document.hyperlinkName || document.primaryKey.join(' - ');
  const route = `/record/${document.documentType}/${document.primaryKey.join('/')}`;

  // use standard link if not in portal, or if no organism present
  if (projectId !== 'EuPathDB' || document.organism == null) {
    return {
      isRoute: true,
      url: route,
      text
    }
  }

  // stub url. these are nullish while loading
  if (projectId == null || projectUrls == null || organismToProject == null) {
    return {
      isRoute: false,
      url: '',
      text
    };
  }

  const documentProject = organismToProject[document.organism];
  const baseUrl = projectUrls[documentProject];

  // if baseUrl is not found, return standard link. we _could_ throw instead...
  return {
    isRoute: !baseUrl,
    url: baseUrl ? new URL('app/' + route, baseUrl).toString() : route,
    text: document.hyperlinkName || document.primaryKey.join(' - ')
  }
}

function makeGenericSummary(document: SiteSearchDocument, documentType: SiteSearchDocumentType) {
  const summaryFields = documentType.summaryFields
    .flatMap(summaryField => {
      if (summaryField.isSubtitle) return [];
      const value = formatSummaryFieldValue(document.summaryFieldData[summaryField.name]);
      return value == null ? [] : [ { ...summaryField, value } ]
    });

  if (summaryFields.length === 0) return null;
  
  return (
    <React.Fragment>
      {summaryFields.map(({ name, displayName, value }) => (
        <div key={name} className={cx('--SummaryField')}><strong>{displayName}:</strong> {safeHtml(value, null, 'span')}</div>
      ))}
    </React.Fragment>
  );
}

function formatSummaryFieldValue(value?: string | string[]) {
  return Array.isArray(value) ? value.join('; ') : value;
}
