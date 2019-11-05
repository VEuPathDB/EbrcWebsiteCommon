import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { Link, TextBox, IconAlt } from 'wdk-client/Components';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import { webAppUrl } from '../../config';

import { combineClassNames } from './Utils';

import './Header.scss';

const cx = makeClassNameHelper('ebrc-Header');

const useWebAppUrl = (): string => {
  return webAppUrl;
};

type Props = {
  branding: ReactNode,
  containerClassName?: string,
  loadSuggestions: (searchTerm: string) => void,
  menuItems: HeaderMenuItem[],
  siteSearchSuggestions?: string[],
  additionalSuggestions?: AdditionalSuggestionItem[]
};

type HeaderMenuItemBase = {
  key: string,
  display: ReactNode,
  tooltip?: string
};

interface RouteMenuItem extends HeaderMenuItemBase {
  type: 'route';
  route: string;
  target?: string;
}

interface WebAppMenuItem extends HeaderMenuItemBase {
  type: 'webAppRoute';
  urlSegment: string;
  target?: string;
}

interface ExternalLinkMenuItem extends HeaderMenuItemBase {
  type: 'externalLink',
  href: string
  target?: string
}

interface SubmenuItem extends HeaderMenuItemBase {
  type: 'subMenu',
  items: HeaderMenuItem[]
}

interface CustomMenuItem extends HeaderMenuItemBase {
  type: 'custom'
}

export type HeaderMenuItem = 
  | RouteMenuItem
  | WebAppMenuItem
  | ExternalLinkMenuItem
  | SubmenuItem
  | CustomMenuItem;

type AdditionalSuggestionItem = {
  key: string,
  display: ReactNode
};

const hasAsAncestor = (e: Element, ancestorCandidate: Element): boolean => {
  if (e === ancestorCandidate) {
    return true;
  } else if (!e.parentElement) {
    return false;
  } else {
    return hasAsAncestor(e.parentElement, ancestorCandidate);
  }
};

export const Header = ({ 
  branding, 
  containerClassName, 
  loadSuggestions, 
  menuItems,
  siteSearchSuggestions,
  additionalSuggestions
}: Props) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [ selectedMenuItems, setSelectedMenuItems ] = useState<string[]>([]);
  const [ searchTerm, setSearchTerm ] = useState('');
  const [ isSearchBarSelected, setIsSearchBarSelected ] = useState(false);
  const [ isSearchBarToggleHidden, setIsSearchBarToggleHidden ] = useState(true);

  const closeSubmenusOnClickout = useCallback((e: MouseEvent) => {
    if (
      headerRef.current &&
      e.target instanceof Element && 
      !hasAsAncestor(e.target, headerRef.current)
    ) {
      setSelectedMenuItems([]);
    }
  }, [ headerRef.current ]);

  useEffect(() => {
    window.addEventListener('click', closeSubmenusOnClickout);

    return () => {
      window.removeEventListener('click', closeSubmenusOnClickout);
    };
  }, [ closeSubmenusOnClickout ]);

  useEffect(() => {
    loadSuggestions(searchTerm);
  }, [ searchTerm ]);

  return (
    <header 
      className={combineClassNames(cx(), containerClassName)}
      ref={headerRef}
    >
      <div className={cx('Branding')}>
        {branding}
      </div>
      <div className={cx('Content')}>
        <div className={cx('MenuBar')}>
          <MenuItemGroup
            menuItems={menuItems}
            selectedItems={selectedMenuItems}
            setSelectedItems={setSelectedMenuItems}
          />
        </div>
        <div className={cx('SearchBar', isSearchBarToggleHidden ? 'toggle-hidden' : 'toggle-shown')}>
          <TextBox 
            onChange={setSearchTerm}
            value={searchTerm}
            placeholder="Site search..."
            onFocus={() => {
              setIsSearchBarSelected(true);
            }}
            onBlur={() => {
              setIsSearchBarSelected(false);
            }}
          />
          <div className={cx('SearchSubmit')}>
            <IconAlt fa="search" />
          </div>
          {
            isSearchBarSelected && siteSearchSuggestions && additionalSuggestions &&
            <Suggestions
              siteSearchSuggestions={siteSearchSuggestions}
              additionalSuggestions={additionalSuggestions}
            />
          }
        </div>
        <div className={cx('SearchBarToggle', isSearchBarToggleHidden ? 'hidden' : 'shown')}>
          <div className={cx('SearchSubmit')}>
            <IconAlt fa="search" />
          </div>
        </div>
      </div>
    </header>
  );
};

type MenuItemGroupProps = {
  menuItems: HeaderMenuItem[],
  path?: string[],
  selectedItems: string[],
  setSelectedItems: (newSelectedItems: string[]) => void
};

const MenuItemGroup = ({
  menuItems,
  path = [],
  selectedItems,
  setSelectedItems
}: MenuItemGroupProps) => 
  <div className={cx('MenuItemGroup')}>
    {
      menuItems.map(
        menuItem => 
          <HeaderMenuItemContent
            key={menuItem.key}
            item={menuItem}
            path={[...path, menuItem.key]}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
          />
      )
    }
  </div>;

type HeaderMenuItemContentProps = {
  item: HeaderMenuItem
  path: string[],
  selectedItems: string[],
  setSelectedItems: (newSelectedItems: string[]) => void
};

const HeaderMenuItemContent = ({
  item,
  path,
  selectedItems,
  setSelectedItems
}: HeaderMenuItemContentProps) => {
  const webAppUrl = useWebAppUrl();

  const onMouseEnter = item.type === 'subMenu' 
    ? (e: React.MouseEvent) => {
        setSelectedItems(path);
      }
    : undefined;

  const onMouseLeave = item.type === 'subMenu'
    ? (e: React.MouseEvent) => {
        setSelectedItems([]);
      }
    : undefined;

  const selected = selectedItems.includes(item.key);

  return (
    <div 
      className={cx('MenuItemContent')}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {
        item.type === 'route'
          ? <Link 
              to={item.route} 
              target={item.target}
            >
              {item.display}
            </Link>
          : item.type === 'webAppRoute'
          ? <a 
              href={`${webAppUrl}${item.urlSegment}`} 
              target={item.target}
            >
              {item.display}
            </a>
          : item.type === 'externalLink'
          ? <a 
              href={item.href} 
              target={item.target}
            >
              {item.display}
            </a>
          : item.type === 'subMenu'
          ? <div 
              className={cx('SubmenuGroup')}
              aria-haspopup
              aria-expanded={selected}
            >
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedItems(path);
                }}
              >
                {item.display}
              </a>
              {
                selected &&
                <MenuItemGroup 
                  menuItems={item.items} 
                  path={path}
                  selectedItems={selectedItems}
                  setSelectedItems={setSelectedItems}
                />
              }
            </div>
          : item.display
      }
    </div>
  );
};

type SuggestionsProps = {
  siteSearchSuggestions: string[],
  additionalSuggestions: AdditionalSuggestionItem[]
};

const Suggestions = ({
  siteSearchSuggestions,
  additionalSuggestions
}: SuggestionsProps) => 
  <div className={cx('Suggestions')}>
    {
      siteSearchSuggestions.map(
        siteSearchSuggestion => 
          <div key={siteSearchSuggestion} className={cx('SiteSearchSuggestion')}>
            <IconAlt fa="search" />{siteSearchSuggestion}
          </div>
      )
    }
    {
      additionalSuggestions && additionalSuggestions.length > 0 && additionalSuggestions.map(
        additionalSuggestion =>
        <div key={additionalSuggestion.key} className={cx('AdditionalSuggestion')}>
          {additionalSuggestion.display}
        </div>
      )
    }
  </div>;
