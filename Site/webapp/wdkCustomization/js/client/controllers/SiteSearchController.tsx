import { castArray, isArray, isEmpty, memoize } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import QueryString from 'querystring';
import SiteSearch from 'ebrc-client/components/SiteSearch/SiteSearch';
import { getLeaves } from 'wdk-client/Utils/TreeUtils';
import { useOrganismTree } from 'ebrc-client/hooks/organisms';
import { LoadingOverlay, Error as ErrorPage } from 'wdk-client/Components';
import { usePromise } from 'wdk-client/Hooks/PromiseHook';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';
import { SiteSearchResponse, SiteSerachRequest, siteSearchResponse } from 'ebrc-client/SiteSearch/Types';
import { siteSearchServiceUrl } from 'ebrc-client/config';
import { decode, arrayOf, string } from 'wdk-client/Utils/Json';
import { useSessionBackedState } from 'wdk-client/Hooks/SessionBackedState';
import { useSetDocumentTitle } from 'wdk-client/Utils/ComponentUtils';

const parseStoredOrganismValue = memoize((value: string) => {
  const parsedValue = arrayOf(string)(value);
  return parsedValue.status === 'err' ? [] : parsedValue.value;
});

// TODO Get projectId and apply to request
export default function SiteSearchController() {
  const [ params, updateParams ] = useQueryParams('searchString', 'offset', 'documentType', 'organisms', 'filters');
  const [ fieldFiltersByFieldId, updateFieldFiltersByFieldId ] = useState<Record<string, string[] | undefined>>({});
  const searchString = useMemo(() => isArray(params.searchString) ? params.searchString[0] : params.searchString || '', [params.searchString]);
  const offset = useMemo(() => Number(isArray(params.offset) ? params.offset[0] : params.offset) || 0, [ params.offset]);
  const documentType = useMemo(() => isArray(params.documentType) ? params.documentType[0] : params.documentType, [ params.documentType ]);
  const organisms = useMemo(() => castArray(params.organisms || []), [ params.organisms ]);
  const filters = useMemo(() => castArray(params.filters || []), [ params.filters ]);
  const numRecords = 20;

  useSetDocumentTitle(`Search${searchString ? (` - ${searchString}`) : ''}`)

  const setSearchString = useCallback((searchString: string) => {
    updateParams({ searchString, documentType, organisms });
  }, [ updateParams, documentType, organisms ]);

  const setOffset = useCallback((offset: number) => {
    updateParams({ searchString, documentType, organisms, filters, offset: String(offset) })
  }, [ updateParams, searchString, documentType, organisms, filters ]);

  const setDocumentType = useCallback((newDocumentType?: string) => {
    if (documentType === newDocumentType) return;
    updateParams({ searchString, documentType: newDocumentType, organisms })
  }, [ updateParams, searchString, organisms ]);

  const setOrganisms = useCallback((organisms: string[]) => {
    updateParams({ searchString, documentType, organisms, filters });
  }, [ updateParams, searchString, documentType, filters ]);

  const setFilters = useCallback((filters: string[]) => {
    if (documentType == null || documentType == '') return;
    updateParams({ searchString, documentType, organisms, filters });
    updateFieldFiltersByFieldId({
      ...fieldFiltersByFieldId,
      [documentType]: filters
    })
  }, [ updateParams, searchString, documentType, organisms ]);

  // initialize field filters based on state, if present
  // only do this when the documentType changes
  useEffect(() => {
    if (filters == null || documentType == null || documentType == '') return;
    const storedFilters = fieldFiltersByFieldId[documentType];
    if (storedFilters == null || storedFilters.length === 0) return;
    setFilters(storedFilters);
  }, [ documentType ]);

  // Organism Tree, set selectedOrganims
  const organismTree = useOrganismTree();

  const allOrganisms = useMemo(
    () => organismTree && getLeaves(organismTree, node => node.children).map(node => node.data.term),
    [ organismTree ]
  );

  const { value, loading } = useSiteSearchResponse(
    { searchString, allOrganisms, organisms, documentType, filters },
    { offset, numRecords }
  );

  if (!siteSearchServiceUrl) {
    return (
      <div>
        <h1>Oops... Search is unavailable!</h1>
        <div>
          This site is not configured to use search. Contact an administrator for more details.
        </div>
      </div>
    )
  }

  if (value && value.type === 'error') {
    return (
      <ErrorPage message={value.error.message}/>
    )
  }

  return (
    <React.Fragment>
      {loading && <LoadingOverlay>Loading results</LoadingOverlay>}
      <SiteSearch
        searchString={searchString}
        documentType={documentType}
        onDocumentTypeChange={setDocumentType}
        filters={filters}
        onFiltersChange={setFilters}
        filterOrganisms={organisms}
        onOrganismsChange={setOrganisms}
        response={value}
        offset={offset}
        numRecords={numRecords}
        organismTree={organismTree}
        onSearch={setSearchString}
        onPageOffsetChange={setOffset}
      />
    </React.Fragment>
  )
}

type Value =
  | { type: 'error', error: Error }
  | { type: 'success' } & SiteSearchResponse;

type SearchSettings = {
  searchString: string;
  organisms?: string[];
  allOrganisms?: string[];
  documentType?: string;
  filters?: string[];
}

type ResultSettings = {
  offset: number;
  numRecords: number;
}

function useSiteSearchResponse(
  { searchString, allOrganisms, organisms, documentType, filters }: SearchSettings,
  { numRecords, offset }: ResultSettings
) {

  const projectId = useWdkService(async wdkService => {
    const { projectId } = await wdkService.getConfig();
    return projectId;
  });

  return usePromise(async (): Promise<Value|undefined> => {
    if (!siteSearchServiceUrl || searchString === '' || organisms == null || allOrganisms == null || projectId == null) return undefined;

    try {
      const requestBody: SiteSerachRequest = {
        searchText: searchString,
        pagination: {
          offset,
          numRecords
        },
        restrictToProject: projectId,
        restrictMetadataToOrganisms: allOrganisms,
        restrictSearchToOrganisms: organisms,
        documentTypeFilter: documentType == null ? undefined : {
          documentType,
          foundOnlyInFields: filters
        }
      };  
      const response = await fetch(`${siteSearchServiceUrl}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const validatedResonse = decode(siteSearchResponse, await response.text());
      return {
        type: 'success',
        ...validatedResonse
      }
    }

    catch(error) {
      return { type: 'error', error };
    }
  
  }, [ searchString, offset, numRecords, organisms, allOrganisms, documentType, filters, projectId ]);
}

type Params<T extends string> = {
  [Key in T]?: string | string[];
}

function useQueryParams<T extends string>(...paramNames: T[]) {
  const history = useHistory();
  const location = useLocation();
  const queryParams = useMemo(() => QueryString.parse(location.search.slice(1)), [ location.search ]);
  const params = useMemo(() => Object.fromEntries(paramNames.map(paramName => [ paramName, queryParams[paramName]])) as Params<T>, [ queryParams ]);
  const updateParams = useCallback((newParams: Params<T>) => {
    // remove empty items
    newParams = Object.fromEntries(Object.entries(newParams).filter(([key, value]) => !isEmpty(value))) as Params<T>;
    history.push(`${location.pathname}?${QueryString.stringify(newParams)}`);
  }, [ history, location ]);
  return [ params, updateParams ] as const;
}
