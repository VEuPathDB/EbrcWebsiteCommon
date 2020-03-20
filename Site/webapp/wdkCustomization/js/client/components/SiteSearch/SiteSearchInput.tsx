import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Tooltip } from 'wdk-client/Components';
import { useSessionBackedState } from 'wdk-client/Hooks/SessionBackedState';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';
import { makeClassNameHelper } from "wdk-client/Utils/ComponentUtils";
import { DatasetParam } from 'wdk-client/Utils/WdkModel';
import { SITE_SEARCH_ROUTE, SEARCH_TERM_PARAM, DOCUMENT_TYPE_PARAM, ORGANISM_PARAM, FILTERS_PARAM } from './SiteSearchConstants';

import './SiteSearch.scss';

const cx = makeClassNameHelper("SiteSearch");

export function SiteSearchInput() {
  const location = useLocation();
  const history = useHistory();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchParams = new URLSearchParams(location.search);
  const searchString = location.pathname === SITE_SEARCH_ROUTE && searchParams.get(SEARCH_TERM_PARAM) || '';
  const docType = location.pathname === SITE_SEARCH_ROUTE && searchParams.get(DOCUMENT_TYPE_PARAM) || '';
  const organisms = location.pathname === SITE_SEARCH_ROUTE && searchParams.getAll(ORGANISM_PARAM) || [];
  const fields = location.pathname === SITE_SEARCH_ROUTE && searchParams.getAll(FILTERS_PARAM) || [];
  const hasFilters = !isEmpty(docType) || !isEmpty(organisms) || !isEmpty(fields);

  const onSearch = useCallback((queryString: string) => {
    history.push(`${SITE_SEARCH_ROUTE}?${queryString}`);
  }, [ history ]);

  const placeholderText = useWdkService(async wdkService => {
    const [ idSearch, textSearch ] = await Promise.all([
      wdkService.getQuestionAndParameters('GeneByLocusTag').catch(),
      wdkService.getQuestionAndParameters('GenesByText').catch()
    ]);
    const id = idSearch?.parameters.find((p): p is DatasetParam => p.name === 'ds_gene_ids')?.defaultIdList;
    const text = textSearch?.parameters.find(p => p.name === 'text_expression')?.initialDisplayValue;
    const examples = [ `*`, id, text, `"oxo group"` ].filter(v => v).join(' or ');
    return 'E.g.,' + examples;
  }, []);

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const queryString = new URLSearchParams(formData as any).toString();
    onSearch(queryString);
  }, [ onSearch ]);
  
  const [ lastSearchQueryString, setLastSearchQueryString] = useSessionBackedState<string>(
    '',
    'ebrc/site-search/last-query-string',
    (value: string) => value,
    (value: string) => value
  );

  useEffect(() => {
    if (location.pathname === SITE_SEARCH_ROUTE) {
      setLastSearchQueryString(location.search.slice(1));
    }
  }, [ location ]);

  return (
    <form action={SITE_SEARCH_ROUTE} onSubmit={handleSubmit} className={cx("--SearchBox")}>
      {docType && <input type="hidden" name={DOCUMENT_TYPE_PARAM} value={docType}/>}
      {organisms.map(organism => <input key={organism} type="hidden" name={ORGANISM_PARAM} value={organism}/>)}
      {fields.map(field => <input key={field} type="hidden" name={FILTERS_PARAM} value={field}/>)}
      <input
        ref={inputRef}
        type="input"
        onFocus={e => e.target.select()}
        name={SEARCH_TERM_PARAM}
        key={searchString}
        defaultValue={searchString}
        placeholder={placeholderText}
      />
      {location.pathname !== SITE_SEARCH_ROUTE && lastSearchQueryString && (
        <Tooltip content="Go back to your last search result">
          <button className="back" type="button" onClick={() => onSearch(lastSearchQueryString)}>
            <i className="fa fa-long-arrow-left"/>
          </button>
        </Tooltip>
      )}
      {hasFilters ? (
        <Tooltip content="Run your search without any filters">
          <button className="reset" type="button" onClick={() => {
            onSearch(`q=${encodeURIComponent(inputRef.current?.value || '')}`);
          }}>clear filters</button>
        </Tooltip>
      ) : null}
      <Tooltip content={hasFilters ? "Update your search, keeping existing filters" : "Run your search"}>
        <button type="submit">
          <i className="fa fa-search" />
        </button>
      </Tooltip>
    </form>
  );
}
