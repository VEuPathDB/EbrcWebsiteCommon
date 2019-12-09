import { identity } from 'lodash';
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';

import { showLoginForm, showLogoutWarning } from 'wdk-client/Actions/UserSessionActions';
import { transitionToInternalPage } from 'wdk-client/Actions/RouterActions';
import { Link, TextBox, IconAlt } from 'wdk-client/Components';
import { DispatchAction } from 'wdk-client/Core/CommonTypes';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';
import { RootState } from 'wdk-client/Core/State/Types';
import { User } from 'wdk-client/Utils/WdkUser';

import UserMenu from 'ebrc-client/App/UserMenu';

import { webAppUrl } from '../../config';

import { combineClassNames } from './Utils';

import { SocialMediaLinks } from './Footer';
import './Header.scss';
import { useSessionBackedState } from 'wdk-client/Hooks/SessionBackedState';

const cx = makeClassNameHelper('ebrc-Header');

export const todo = () => alert('Under construction');

const useWebAppUrl = (): string => {
  // FIXME: Pull this from global data
  return webAppUrl;
};

type StateProps = {
  user?: User
};

type DispatchProps = {
  actions: {
    showLoginForm: (url: string) => void,
    showLogoutWarning: () => void,
    goToGenePage: (geneId: string) => void
  }
};

type OwnProps = {
  branding: ReactNode,
  containerClassName?: string,
  loadSuggestions: (searchTerm: string) => void,
  menuItems: HeaderMenuItem[],
  siteSearchSuggestions?: string[],
  additionalSuggestions?: AdditionalSuggestionItem[]
};

type Props = StateProps & DispatchProps & OwnProps;

type FocusType = 'hover' | 'click' | 'unfocused';

type HeaderMenuItemBase<T> = {
  key: string,
  display: ReactNode,
  tooltip?: string,
  metadata?: T
};

interface RouteMenuItem<T> extends HeaderMenuItemBase<T> {
  type: 'reactRoute';
  url: string;
  target?: string;
}

interface WebAppMenuItem<T> extends HeaderMenuItemBase<T> {
  type: 'webAppRoute';
  url: string;
  target?: string;
}

interface ExternalLinkMenuItem<T> extends HeaderMenuItemBase<T> {
  type: 'externalLink',
  url: string
  target?: string
}

interface SubmenuItem<T> extends HeaderMenuItemBase<T> {
  type: 'subMenu',
  items: HeaderMenuItem<T>[]
}

interface CustomMenuItem<T> extends HeaderMenuItemBase<T> {
  type: 'custom'
}

export type HeaderMenuItem<T = {}> = 
  | RouteMenuItem<T>
  | WebAppMenuItem<T>
  | ExternalLinkMenuItem<T>
  | SubmenuItem<T>
  | CustomMenuItem<T>;

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

const HeaderView = ({ 
  branding, 
  containerClassName, 
  loadSuggestions, 
  menuItems,
  siteSearchSuggestions,
  additionalSuggestions,
  actions,
  user
}: Props) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [ selectedMenuItems, setSelectedMenuItems ] = useState<string[]>([]);
  const [ focusType, setFocusType ] = useState<FocusType>('unfocused');
  // XXX Temporary until site search is done
  const [ searchTerm, setSearchTerm ] = useSessionBackedState<string>(
    '',
    'header-site-search-term',
    identity,
    identity
  );
  const [ isSearchBarSelected, setIsSearchBarSelected ] = useState(false);
  const [ isSearchBarToggleHidden, setIsSearchBarToggleHidden ] = useState(true);
  const [ showHamburgerMenu, setShowHamburgerMenu ] = useState(false);

  const toggleHamburgerMenu = useCallback(() => {
    setShowHamburgerMenu(!showHamburgerMenu);
  }, [ showHamburgerMenu ]);

  const onClickInsideSubmenu = useCallback((e: MouseEvent) => {
    if (
      e.target instanceof HTMLAnchorElement
    ) {
      setFocusType('unfocused');
      setSelectedMenuItems([]);
    } else {
      setFocusType('click');
    }
  }, []);

  useEffect(() => {
    if (headerRef.current) {
      headerRef.current.addEventListener('click', onClickInsideSubmenu);
    }

    return () => {
      if (headerRef.current) {
        headerRef.current.removeEventListener('click', onClickInsideSubmenu);
      }
    };
  }, [ headerRef.current, onClickInsideSubmenu ]);
  
  const closeSubmenusOnClickout = useCallback((e: MouseEvent) => {
    if (
      headerRef.current &&
      e.target instanceof Element && 
      !hasAsAncestor(e.target, headerRef.current)
    ) {
      if (selectedMenuItems.length) {
        setFocusType('unfocused');
        setSelectedMenuItems([]);
      }
    }
  }, [ selectedMenuItems, headerRef.current ]);

  useEffect(() => {
    window.addEventListener('click', closeSubmenusOnClickout);

    return () => {
      window.removeEventListener('click', closeSubmenusOnClickout);
    };
  }, [ closeSubmenusOnClickout ]);

  useEffect(() => {
    if (searchTerm) {
      // We're disabling suggestions for now
    }
    // loadSuggestions(searchTerm);
  }, [ searchTerm ]);

  return (
    <header 
      className={combineClassNames(cx(), containerClassName)}
      ref={headerRef}
    >
      <div className={cx('BrandingContainer')}>
        <Link to="/">
          <div className={cx('Branding')}>
            {branding}
          </div>
        </Link>
        <div className={cx('Hamburger')} onClick={toggleHamburgerMenu}>
          {
            showHamburgerMenu 
              ? <IconAlt fa="close" />
              : <IconAlt fa="bars" />
          }
        </div>
      </div>
      <div className={cx('Content')}>
        <div className={cx('MenuBar', showHamburgerMenu ? 'hamburger-shown' : 'hamburger-hidden')}>
          <MenuItemGroup
            menuItems={menuItems}
            selectedItems={selectedMenuItems}
            setSelectedItems={setSelectedMenuItems}
            focusType={focusType}
            setFocusType={setFocusType}
          />
        </div>
        <div className={cx('SearchBar', isSearchBarToggleHidden ? 'toggle-hidden' : 'toggle-shown')}>
          <form onSubmit={e => {
            e.preventDefault();
            if (searchTerm) actions.goToGenePage(searchTerm);
          }}>
            <TextBox 
              onChange={setSearchTerm}
              value={searchTerm}
              placeholder="Site search... e.g. PF3D7_1133400"
              onFocus={() => {
                setIsSearchBarSelected(true);
              }}
              onBlur={() => {
                setIsSearchBarSelected(false);
              }}
            />
            <button 
              type="submit"
              className={cx('SearchSubmit')}
            >
              <IconAlt fa="search" />
            </button>
          </form>
          {
            isSearchBarSelected && siteSearchSuggestions && additionalSuggestions &&
            <Suggestions
              siteSearchSuggestions={siteSearchSuggestions}
              additionalSuggestions={additionalSuggestions}
            />
          }
        </div>
        <div className={cx('SearchBarToggle', isSearchBarToggleHidden ? 'hidden' : 'shown')}>
          <button 
            className={cx('SearchSubmit')}
            onClick={todo}
            type="button"
          >
            <IconAlt fa="search" />
          </button>
        </div>
        <UserMenu
          webAppUrl={webAppUrl}
          user={user}
          actions={actions}
        />
        <SocialMediaLinks />
      </div>
    </header>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  user: state.globalData.user
});

const mapDispatchToProps = (dispatch: DispatchAction): DispatchProps => ({
  actions: {
    showLoginForm: (url: string) => dispatch(showLoginForm(url)),
    showLogoutWarning: () => dispatch(showLogoutWarning()),
    goToGenePage: (geneId: string) => dispatch(transitionToInternalPage(`/record/gene/${geneId}`))
  }
});

export const Header = connect(mapStateToProps, mapDispatchToProps)(HeaderView);

type MenuItemGroupProps = {
  menuItems: HeaderMenuItem[],
  path?: string[],
  selectedItems: string[],
  focusType: FocusType,
  setSelectedItems: (newSelectedItems: string[]) => void,
  setFocusType: (newFocusType: FocusType) => void
};

const MenuItemGroup = ({
  menuItems,
  path = [],
  selectedItems,
  focusType,
  setSelectedItems,
  setFocusType
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
            focusType={focusType}
            setSelectedItems={setSelectedItems}
            setFocusType={setFocusType}
          />
      )
    }
  </div>;

type HeaderMenuItemContentProps = {
  item: HeaderMenuItem
  path: string[],
  selectedItems: string[],
  focusType: FocusType,
  setSelectedItems: (newSelectedItems: string[]) => void,
  setFocusType: (newFocusType: FocusType) => void
};

const HeaderMenuItemContent = ({
  item,
  path,
  selectedItems,
  focusType,
  setSelectedItems,
  setFocusType
}: HeaderMenuItemContentProps) => {
  const webAppUrl = useWebAppUrl();

  const onMouseEnter = item.type === 'subMenu' 
    ? (e: React.MouseEvent) => {
        if (focusType !== 'click') {
          setFocusType('hover');
        }

        setSelectedItems(path);
      }
    : undefined;

  const onMouseLeave = item.type === 'subMenu'
    ? (e: React.MouseEvent) => {
        if (focusType === 'hover') {
          setFocusType('unfocused');
          setSelectedItems([]);
        }
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
        item.type === 'reactRoute'
          ? <Link 
              to={item.url} 
              target={item.target}
            >
              {item.display}
            </Link>
          : item.type === 'webAppRoute'
          ? <a 
              href={`${webAppUrl}${item.url}`} 
              target={item.target}
            >
              {item.display}
            </a>
          : item.type === 'externalLink'
          ? <a 
              href={item.url} 
              target={item.target}
            >
              {item.display}
            </a>
          : item.type === 'subMenu'
          ? <div 
              className={cx('SubmenuGroup', selected ? 'selected' : 'unselected')}
              aria-haspopup
              aria-expanded={selected}
            >
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setFocusType('click');
                  setSelectedItems(path);
                }}
              >
                {item.display}
              </a>
              {
                selected &&
                <div className={cx('MenuItemGroupContainer')}>
                  <MenuItemGroup 
                    menuItems={item.items} 
                    path={path}
                    selectedItems={selectedItems}
                    focusType={focusType}
                    setSelectedItems={setSelectedItems}
                    setFocusType={setFocusType}
                  />
                </div>
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
