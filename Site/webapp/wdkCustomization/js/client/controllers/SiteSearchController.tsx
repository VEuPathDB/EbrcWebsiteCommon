import { castArray, isArray } from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import SiteSearch from 'ebrc-client/components/SiteSearch/SiteSearch';
import { getLeaves } from 'wdk-client/Utils/TreeUtils';
import { useOrganismTree } from 'ebrc-client/hooks/organisms';
import { useQueryParams } from 'ebrc-client/hooks/queryParams';
import { LoadingOverlay, Error as ErrorPage } from 'wdk-client/Components';
import { usePromise } from 'wdk-client/Hooks/PromiseHook';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';
import { SiteSearchResponse, SiteSerachRequest, siteSearchResponse } from 'ebrc-client/SiteSearch/Types';
import { siteSearchServiceUrl } from 'ebrc-client/config';
import { decode } from 'wdk-client/Utils/Json';
import { useSetDocumentTitle } from 'wdk-client/Utils/ComponentUtils';
import { SEARCH_TERM_PARAM, OFFSET_PARAM, DOCUMENT_TYPE_PARAM, ORGANISM_PARAM, FILTERS_PARAM } from 'ebrc-client/components/SiteSearch/SiteSearchConstants';

export default function SiteSearchController() {
  const [ params, updateParams ] = useQueryParams(
    SEARCH_TERM_PARAM,
    OFFSET_PARAM,
    DOCUMENT_TYPE_PARAM,
    ORGANISM_PARAM,
    FILTERS_PARAM
  );
  const [ fieldFiltersByFieldId, updateFieldFiltersByFieldId ] = useState<Record<string, string[] | undefined>>({});
  const searchString = useMemo(() => isArray(params.q) ? params.q[0] : params.q || '', [ params.q ]);
  const offset = useMemo(() => Number(isArray(params.offset) ? params.offset[0] : params.offset) || 0, [ params.offset]);
  const documentType = useMemo(() => isArray(params.documentType) ? params.documentType[0] : params.documentType, [ params.documentType ]);
  const organisms = useMemo(() => castArray(params.organisms || []), [ params.organisms ]);
  const filters = useMemo(() => castArray(params.filters || []), [ params.filters ]);
  const numRecords = 20;

  // Organism Tree, set selectedOrganims
  const organismTree = useOrganismTree();

  const allOrganisms = useMemo(
    () => organismTree && getLeaves(organismTree, node => node.children).map(node => node.data.term),
    [ organismTree ]
  );

  const { value, loading } = useSiteSearchResponse(
    { searchString, allOrganisms, organisms: organisms, documentType, filters },
    { offset, numRecords }
  );

  useSetDocumentTitle(`Search${searchString ? (` - ${searchString}`) : ''}`)

  const setSearchString = useCallback((searchString: string) => {
    updateParams({
      [SEARCH_TERM_PARAM]: searchString,
      [DOCUMENT_TYPE_PARAM]: documentType,
      [ORGANISM_PARAM]: organisms
    });
  }, [ updateParams, documentType, organisms ]);

  const setOffset = useCallback((offset: number) => {
    updateParams({
      [SEARCH_TERM_PARAM]: searchString,
      [DOCUMENT_TYPE_PARAM]: documentType,
      [ORGANISM_PARAM]: organisms,
      [FILTERS_PARAM]: filters,
      [OFFSET_PARAM]: String(offset)
    })
  }, [ updateParams, searchString, documentType, organisms, filters ]);

  const setDocumentType = useCallback((newDocumentType?: string) => {
    const nextDocumentType = newDocumentType === documentType ? undefined : newDocumentType;
    updateParams({
      [SEARCH_TERM_PARAM]: searchString,
      [DOCUMENT_TYPE_PARAM]: nextDocumentType,
      [ORGANISM_PARAM]: organisms,
      [FILTERS_PARAM]: nextDocumentType ? fieldFiltersByFieldId[nextDocumentType] : undefined
    })
  }, [ updateParams, searchString, organisms ]);

  const setOrganisms = useCallback((organisms: string[]) => {
    updateParams({
      [SEARCH_TERM_PARAM]: searchString,
      [DOCUMENT_TYPE_PARAM]: documentType,
      [ORGANISM_PARAM]: organisms,
      [FILTERS_PARAM]: filters
    });
  }, [ updateParams, searchString, documentType, filters ]);

  const setFilters = useCallback((filters: string[]) => {
    if (documentType == null || documentType == '') return;
    updateParams({
      [SEARCH_TERM_PARAM]: searchString,
      [DOCUMENT_TYPE_PARAM]: documentType,
      [ORGANISM_PARAM]: organisms,
      [FILTERS_PARAM]: filters
    });
    updateFieldFiltersByFieldId({
      ...fieldFiltersByFieldId,
      [documentType]: filters
    })
  }, [ updateParams, searchString, documentType, organisms ]);

  if (!siteSearchServiceUrl) {
    return (
      <div>
        <h1>Oops... Search is unavailable!</h1>
        <div>
          This site is not configured to use search. Please contact an administrator.
        </div>
      </div>
    )
  }

  if (value == null && searchString === '') {
    return (
      <div>
        <h1>No results</h1>
        <div>Type a search expression in the box above to begin searching...</div>
      </div>
    );
  }

  if (value && value.type === 'error') {
    return (
      <ErrorPage message={value.error.message}/>
    )
  }

  if (value == null) {
    return <LoadingOverlay>Loading results</LoadingOverlay>;
  }

  return (
    <React.Fragment>
      <SiteSearch
        loading={loading}
        searchString={value.searchSettings.searchString}
        documentType={value.searchSettings.documentType}
        onDocumentTypeChange={setDocumentType}
        filters={value.searchSettings.filters}
        onFiltersChange={setFilters}
        filterOrganisms={value.searchSettings.organisms}
        onOrganismsChange={setOrganisms}
        response={value.response}
        offset={value.resultSettings.offset}
        numRecords={value.resultSettings.numRecords}
        organismTree={organismTree}
        onSearch={setSearchString}
        onPageOffsetChange={setOffset}
      />
    </React.Fragment>
  )
}

type Value =
  | { type: 'error', error: Error }
  | { type: 'success', response: SiteSearchResponse, searchSettings: SearchSettings, resultSettings: ResultSettings };

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

function useSiteSearchResponse(searchSettings: SearchSettings, resultSettings: ResultSettings) {
  const { searchString, allOrganisms, organisms, documentType, filters } = searchSettings;
  const { numRecords, offset } = resultSettings

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
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const validatedResonse = decode(siteSearchResponse, await response.text());
      return {
        type: 'success',
        response: validatedResonse,
        searchSettings,
        resultSettings
      }
    }

    catch(error) {
      return { type: 'error', error };
    }
  
  }, [ searchString, offset, numRecords, organisms, allOrganisms, documentType, filters, projectId ]);
}
