import React, { ReactNode, useEffect, useState } from 'react';

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

export type HeaderMenuItem = 
  | RouteMenuItem
  | WebAppMenuItem
  | ExternalLinkMenuItem
  | SubmenuItem;

type AdditionalSuggestionItem = {
  key: string,
  display: ReactNode
};

export const Header = ({ 
  branding, 
  containerClassName, 
  loadSuggestions, 
  menuItems,
  siteSearchSuggestions,
  additionalSuggestions
}: Props) => {
  const [ selectedMenuItems, setSelectedMenuItems ] = useState<string[]>([]);
  const [ searchTerm, setSearchTerm ] = useState('');
  const [ isSearchBarSelected, setIsSearchBarSelected ] = useState(false);
  const [ isSearchBarToggleHidden, setIsSearchBarToggleHidden ] = useState(true);

  console.log(selectedMenuItems);

  useEffect(() => {
    loadSuggestions(searchTerm);
  }, [ searchTerm ]);

  return (
    <header className={combineClassNames(cx(), containerClassName)}>
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
        e.stopPropagation();
        setSelectedItems(path);
      }
    : undefined;

  const onMouseLeave = item.type === 'subMenu'
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedItems(path.slice(0, -1));
      }
    : undefined;

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
          : <div 
              className={cx('SubmenuGroup')}
            >
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedItems(path);
                }}
              >
                {item.display}
                {' '}
                <IconAlt fa="caret-down" />
              </a>
              {
                selectedItems.includes(item.key) &&
                <MenuItemGroup 
                  menuItems={item.items} 
                  path={path}
                  selectedItems={selectedItems}
                  setSelectedItems={setSelectedItems}
                />
              }
            </div>
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
