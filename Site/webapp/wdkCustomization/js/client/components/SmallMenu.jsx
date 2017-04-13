import { isEmpty } from 'lodash';
import { PropTypes } from 'react';
import { Link } from 'wdk-client/Components';
import { safeHtml } from 'wdk-client/ComponentUtils';

/**
 * Small menu that appears in header
 */
const SmallMenu = ({ items, webAppUrl }) => isEmpty(items) ? null : (
  <ul className="eupathdb-SmallMenu">
    {items.map(item =>
      <Item key={item.id} item={item} webAppUrl={webAppUrl}/>
    )}
  </ul>
)

SmallMenu.propTypes = {
  webAppUrl: PropTypes.string.isRequired,
  items: PropTypes.array
}

export default SmallMenu

const Item = ({ item, webAppUrl }) => (
  <li className={'eupathdb-SmallMenuItem ' + (item.liClassName || '')}>

    { item.url ? <ItemUrl item={item}/>
    : item.webAppUrl ? <ItemWebAppUrl item={item} webAppUrl={webAppUrl}/>
    : item.route ? <ItemRoute item={item}/>
    : safeHtml(item.text) }

    <SmallMenu items={item.children} webAppUrl={webAppUrl}/>
  </li>
)

const ItemUrl = ({ item }) => (
  <a
    className={item.className}
    title={item.tooltip}
    href={item.url}
    target={item.target}
    onClick={item.onClick}
  >{safeHtml(item.text)}</a>
)

const ItemWebAppUrl = ({ item, webAppUrl }) => (
  <a
    className={item.className}
    title={item.tooltip}
    href={`${webAppUrl}/${item.webAppUrl}`}
    onClick={item.onClick}
    target={item.target}
  >{safeHtml(item.text)}</a>
)

const ItemRoute = ({ item }) => (
  <Link
    className={item.className}
    title={item.tooltip}
    to={item.route}
    onClick={item.onClick}
  >{safeHtml(item.text)}</Link>
)
