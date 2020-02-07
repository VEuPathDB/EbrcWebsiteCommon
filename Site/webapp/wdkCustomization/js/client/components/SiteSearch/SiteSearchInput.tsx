import React, { useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';
import { makeClassNameHelper } from "wdk-client/Utils/ComponentUtils";
import { DatasetParam } from 'wdk-client/Utils/WdkModel';
import { SITE_SEARCH_ROUTE, SEARCH_TERM_PARAM } from './SiteSearchConstants';
import { useQueryParams } from 'ebrc-client/hooks/queryParams';

import './SiteSearch.scss';

const cx = makeClassNameHelper("SiteSearch");

export function SiteSearchInput() {
  const location = useLocation();
  const history = useHistory();
  const [ params ] = useQueryParams(SEARCH_TERM_PARAM);

  const onSearch = useCallback((searchString: string) => {
    history.push(`${SITE_SEARCH_ROUTE}?${SEARCH_TERM_PARAM}=${encodeURIComponent(searchString)}`);
  }, [ history ]);

  const searchString = location.pathname !== SITE_SEARCH_ROUTE ? ''
    : Array.isArray(params.q) ? params.q[0] : params.q;

  const placeholderText = useWdkService(async wdkService => {
    const [ idSearch, textSearch ] = await Promise.all([
      wdkService.getQuestionAndParameters('GeneByLocusTag').catch(),
      wdkService.getQuestionAndParameters('GenesByTextSearch').catch()
    ]);
    const id = idSearch?.parameters.find((p): p is DatasetParam => p.name === 'ds_gene_ids')?.defaultIdList;
    const text = textSearch?.parameters.find(p => p.name === 'text_expression')?.initialDisplayValue;
    const examples = [ `*`, id, text, `"oxo group"` ].filter(v => v).join(' or ');
    return 'E.g.,' + examples;
  })
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem(SEARCH_TERM_PARAM);
    if (input instanceof HTMLInputElement) onSearch(input.value);
  }, [ onSearch ])
  return (
    <form onSubmit={handleSubmit} className={cx("--SearchBox")}>
      <input
        type="input"
        name={SEARCH_TERM_PARAM}
        key={searchString}
        defaultValue={searchString}
        placeholder={placeholderText}
      />
      <button type="submit">
        <i className="fa fa-search" />
      </button>
    </form>
  );
}
