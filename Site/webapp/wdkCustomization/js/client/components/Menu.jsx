import { Component, PropTypes } from 'react';
import { Link } from 'wdk-client/Components';
import { safeHtml } from 'wdk-client/ComponentUtils';
import { isEmpty } from 'lodash';

/**
 * Site menu
 */
export default class Menu extends Component {

  constructor(props) {
    super(props);
    this.setPosition = this.setPosition.bind(this);
    this.state = { position: '', top: 0 };
  }

  setPosition() {
    let shouldFix = this.refs.trackingNode.getBoundingClientRect().top < 0;
    if (shouldFix && this.state.position !== 'fixed') {
      this.setState({ position: 'fixed'});
    }
    else if (!shouldFix && this.state.position === 'fixed') {
      this.setState({ position: ''});
    }
  }

  componentDidMount() {
    window.addEventListener('scroll', this.setPosition, { passive: true });
    this.setPosition();
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.setPosition, { passive: true });
  }

  render() {
    let { position, top } = this.state;
    return (
      <div ref="trackingNode" style={{ overflow: 'visible'}}>
        <ul className="eupathdb-Menu" style={{ position, top }}>
          {this.props.entries.map((entry) => (
            <MenuEntry
              key={entry.id}
              entry={entry}
              webAppUrl={this.props.webAppUrl}
              isGuest={this.props.isGuest}
              showLoginWarning={this.props.showLoginWarning}
              projectId={this.props.projectId}
            />
          ))}
        </ul>
      </div>
    );
  }
}

Menu.propTypes = {
  webAppUrl: PropTypes.string.isRequired,
  showLoginWarning: PropTypes.func.isRequired,
  entries: PropTypes.array.isRequired,
  isGuest: PropTypes.bool.isRequired,
  projectId: PropTypes.string.isRequired
};

/**
 * Site menu entry.
 */
function MenuEntry(props) {
  let { entry, webAppUrl, showLoginWarning, isGuest, projectId } = props;

  if (!include(entry, projectId)) return null;

  let handleClick = (e) => {
    if (entry.loginRequired && isGuest) {
      e.preventDefault();
      showLoginWarning('use this feature', e.currentTarget.href);
    }
  }
  let baseClassName = 'eupathdb-MenuItemText';
  let className = baseClassName + ' ' + baseClassName + '__' + entry.id +
    (entry.beta ? ' ' + baseClassName + '__beta' : '') +
    (entry.new ? ' ' + baseClassName + '__new' : '') +
    (!isEmpty(entry.children) ? ' ' + baseClassName + '__parent' : '');

  return (
    <li className="eupathdb-MenuItem">

      { entry.url ? <a className={className} title={entry.tooltip} href={entry.url} target={entry.target}>{renderEntryText(entry.text)}</a>
      : entry.webAppUrl ? <a onClick={handleClick} className={className} title={entry.tooltip} href={webAppUrl + entry.webAppUrl}>{renderEntryText(entry.text)}</a>
      : entry.route ? <Link onClick={handleClick} className={className} title={entry.tooltip} to={entry.route}>{renderEntryText(entry.text)}</Link>
      : <div className={className} title={entry.tooltip}>{renderEntryText(entry.text)}</div> }

      { !isEmpty(entry.children) &&
        <ul className="eupathdb-Submenu">
          {entry.children.map(childEntry =>
            <MenuEntry
              {...props}
              key={childEntry.id}
              entry={childEntry}
            />
          )}
        </ul> }

    </li>
  );
}

MenuEntry.propTypes = {
  webAppUrl: PropTypes.string.isRequired,
  showLoginWarning: PropTypes.func.isRequired,
  entry: PropTypes.object.isRequired,
  isGuest: PropTypes.bool.isRequired,
  projectId: PropTypes.string.isRequired
};

/**
 * Determine is menu entry should be include for projectId
 */
function include(entry, projectId) {
  const { include, exclude } = entry;
  return (include == null && exclude == null)
    || (include != null && include.indexOf(projectId) !== -1)
    || (exclude != null && exclude.indexOf(projectId) === -1);
}

function renderEntryText(text) {
  return typeof text === 'string' ? safeHtml(text) : text;
}
