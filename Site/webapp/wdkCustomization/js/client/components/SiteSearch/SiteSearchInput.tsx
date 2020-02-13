import React, { useCallback, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Tooltip } from 'wdk-client/Components';
import { useSessionBackedState } from 'wdk-client/Hooks/SessionBackedState';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';
import { makeClassNameHelper } from "wdk-client/Utils/ComponentUtils";
import { DatasetParam } from 'wdk-client/Utils/WdkModel';
import { SITE_SEARCH_ROUTE, SEARCH_TERM_PARAM } from './SiteSearchConstants';

import './SiteSearch.scss';

const cx = makeClassNameHelper("SiteSearch");

export function SiteSearchInput() {
  const location = useLocation();
  const history = useHistory();
  const searchParams = new URLSearchParams(location.search);
  const searchString = location.pathname === SITE_SEARCH_ROUTE && searchParams.get(SEARCH_TERM_PARAM) || '';

  const onSearch = useCallback((queryString: string) => {
    history.push(`${SITE_SEARCH_ROUTE}?${queryString}`);
  }, [ history ]);

  const placeholderText = useWdkService(async wdkService => {
    const [ idSearch, textSearch ] = await Promise.all([
      wdkService.getQuestionAndParameters('GeneByLocusTag').catch(),
      wdkService.getQuestionAndParameters('GenesByTextSearch').catch()
    ]);
    const id = idSearch?.parameters.find((p): p is DatasetParam => p.name === 'ds_gene_ids')?.defaultIdList;
    const text = textSearch?.parameters.find(p => p.name === 'text_expression')?.initialDisplayValue;
    const examples = [ `*`, id, text, `"oxo group"` ].filter(v => v).join(' or ');
    return 'E.g.,' + examples;
  });

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
      <input
        type="input"
        name={SEARCH_TERM_PARAM}
        key={searchString}
        defaultValue={searchString}
        placeholder={placeholderText}
      />
      {location.pathname !== SITE_SEARCH_ROUTE && lastSearchQueryString && (
        <Tooltip content="Go to your last search result view">
          <button type="button" onClick={() => onSearch(lastSearchQueryString)}>
            <i className="fa fa-long-arrow-left"/>
          </button>
        </Tooltip>
      )}
      <button type="submit">
        <i className="fa fa-search" />
      </button>
    </form>
  );
}
