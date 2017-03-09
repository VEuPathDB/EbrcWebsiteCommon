import { isEmpty } from 'lodash';
import { PropTypes } from 'react';
import { Link } from 'wdk-client/Components';
import { safeHtml } from 'wdk-client/ComponentUtils';

/**
 * Small menu that appears in header
 */
const SmallMenu = ({ entries, webAppUrl }) => isEmpty(entries) ? null : (
  <ul className="eupathdb-SmallMenu">
    {entries.map(entry =>
      <Entry entry={entry} webAppUrl={webAppUrl}/>
    )}
  </ul>
)

SmallMenu.propTypes = {
  webAppUrl: PropTypes.string.isRequired,
  entries: PropTypes.array
}

export default SmallMenu

const Entry = ({ entry, webAppUrl }) => (
  <li className={'eupathdb-SmallMenuItem ' + (entry.liClassName || '')}>

    { entry.url ? <EntryUrl entry={entry}/>
    : entry.webAppUrl ? <EntryWebAppUrl entry={entry} webAppUrl={webAppUrl}/>
    : entry.route ? <EntryRoute entry={entry}/>
    : safeHtml(entry.text) }

    <SmallMenu entries={entry.children} webAppUrl={webAppUrl}/>
  </li>
)

const EntryUrl = ({ entry }) => (
  <a
    className={entry.className}
    title={entry.tooltip}
    href={entry.url}
    target={entry.target}
    onClick={entry.onClick}
  >{safeHtml(entry.text)}</a>
)

const EntryWebAppUrl = ({ entry, webAppUrl }) => (
  <a
    className={entry.className}
    title={entry.tooltip}
    href={`${webAppUrl}/${entry.webAppUrl}`}
    onClick={entry.onClick}
    target={entry.target}
  >{safeHtml(entry.text)}</a>
)

const EntryRoute = ({ entry }) => (
  <Link
    className={entry.className}
    title={entry.tooltip}
    to={entry.route}
    onClick={entry.onClick}
  >{safeHtml(entry.text)}</Link>
)
