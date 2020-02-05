import { castArray, memoize, partial } from 'lodash';
import React, { useCallback, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSessionBackedState } from 'wdk-client/Hooks/SessionBackedState';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';
import { makeClassNameHelper } from "wdk-client/Utils/ComponentUtils";
import { decodeOrElse, arrayOf, string } from 'wdk-client/Utils/Json';
import { DatasetParam } from 'wdk-client/Utils/WdkModel';
import { SITE_SEARCH_ROUTE, SEARCH_TERM_PARAM, ORGANISM_PARAM } from './SiteSearchConstants';
import { useQueryParams } from 'ebrc-client/hooks/queryParams';

import './SiteSearch.scss';

const cx = makeClassNameHelper("SiteSearch");

const parseRawOrganism: (raw: string) => string[] = memoize(partial(decodeOrElse, arrayOf(string), []));

export function SiteSearchInput() {
  const location = useLocation();
  const history = useHistory();
  const [ storedOrganisms, updateStoredOrganisms ] = useSessionBackedState(
    [],
    'site-search/organisms',
    JSON.stringify,
    parseRawOrganism
  );
  
  const [ params ] = useQueryParams(SEARCH_TERM_PARAM, ORGANISM_PARAM);

  const onSearch = useCallback((searchString: string) => {
    const organismQueryPart = storedOrganisms.map(org => `${ORGANISM_PARAM}=${encodeURIComponent(org)}`).join('&');
    history.push(`${SITE_SEARCH_ROUTE}?${SEARCH_TERM_PARAM}=${encodeURIComponent(searchString)}` +
      (organismQueryPart ? `&${organismQueryPart}` : ''));
  }, [ history, storedOrganisms ]);

  useEffect(() => {
    if (location.pathname !== SITE_SEARCH_ROUTE) return;
    updateStoredOrganisms(castArray(params.organisms || []));
  }, [ params.organisms, location.pathname ])

  const searchString = location.pathname !== SITE_SEARCH_ROUTE ? ''
    : Array.isArray(params.q) ? params.q[0] : params.q;

  const placeholderText = useWdkService(async wdkService => {
    let eg = '';

    try {
      const [ idSearch, textSearch ] = await Promise.all([
        wdkService.getQuestionAndParameters('GeneByLocusTag').catch(),
        wdkService.getQuestionAndParameters('GenesByTextSearch').catch()
      ]);
      
      const id = idSearch?.parameters.find((p): p is DatasetParam => p.name === 'ds_gene_ids')?.defaultIdList;
      const text = textSearch?.parameters.find(p => p.name === 'text_expression')?.initialDisplayValue;
      const egValues = [ id, text ].filter(v => v).join(' or ');
      eg = egValues ? `... e.g., ${egValues}` : '';
    }
    catch {
      // ignore error
    }
    
    const { displayName } = await wdkService.getConfig();
    return `Search ${displayName}${eg}`;
  })

  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={cx("--SearchBox")}>
      <input
        type="input"
        ref={inputRef}
        key={searchString}
        defaultValue={searchString}
        placeholder={placeholderText}
        onBlur={() => {
          /* setShowSuggestions(false) */
        }}
        onFocus={() => {
          /* setShowSuggestions(true) */
        }}
        onKeyPress={e => {
          switch (e.key) {
            case "Esc":
            case "Escape":
              // setShowSuggestions(false);
              break;
            case "Down":
            case "ArrowDown":
              // setShowSuggestions(true);
              break;
            case "Enter":
              onSearch(e.currentTarget.value);
              break;
            default:
              return;
          }
        }}
      />
      <button
        type="button"
        onClick={() => {
          inputRef.current && onSearch(inputRef.current.value);
        }}
      >
        <i className="fa fa-search" />
      </button>
    </div>
  );
}
