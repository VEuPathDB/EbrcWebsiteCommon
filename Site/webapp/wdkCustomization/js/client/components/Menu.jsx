import { isEmpty, identity } from 'lodash';
import { Component } from 'react';
import PropTypes from 'prop-types';
import { safeHtml } from 'wdk-client/ComponentUtils';

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
          {this.props.items.filter(identity).map((item) => (
            <MenuItem
              key={item.id}
              item={item}
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
  items: PropTypes.array.isRequired,
  isGuest: PropTypes.bool.isRequired,
  projectId: PropTypes.string.isRequired
};

/**
 * Site menu item.
 */
function MenuItem(props) {
  let { item, webAppUrl, showLoginWarning, isGuest, projectId } = props;

  if (!include(item, projectId)) return null;

  let handleClick = (e) => {
    if (item.onClick) {
      item.onClick(e);
    }
    if (item.loginRequired && isGuest) {
      e.preventDefault();
      showLoginWarning('use this feature', e.currentTarget.href);
    }
  }
  let baseClassName = 'eupathdb-MenuItemText';
  let className = baseClassName + ' ' + baseClassName + '__' + item.id +
    (item.beta ? ' ' + baseClassName + '__beta' : '') +
    (item.new ? ' ' + baseClassName + '__new' : '') +
    (!isEmpty(item.children) ? ' ' + baseClassName + '__parent' : '');

  return (
    <li className={`eupathdb-MenuItem eupathdb-MenuItem__${item.id}`}>

      { item.url ? <a onClick={handleClick} className={className} title={item.tooltip} href={item.url} target={item.target}>{renderItemText(item.text)}</a>
      : item.webAppUrl ? <a onClick={handleClick} className={className} title={item.tooltip} href={webAppUrl + item.webAppUrl}>{renderItemText(item.text)}</a>
      : item.route ?  <a onClick={handleClick} className={className} title={item.tooltip} href={webAppUrl + '/app/' + item.route}>{renderItemText(item.text)}</a>
      : <div className={className} title={item.tooltip}>{renderItemText(item.text)}</div> }

      { !isEmpty(item.children) &&
        <ul className="eupathdb-Submenu">
          {item.children.filter(identity).map(childItem =>
            <MenuItem
              {...props}
              key={childItem.id}
              item={childItem}
            />
          )}
        </ul> }

    </li>
  );
}

MenuItem.propTypes = {
  webAppUrl: PropTypes.string.isRequired,
  showLoginWarning: PropTypes.func.isRequired,
  item: PropTypes.object.isRequired,
  isGuest: PropTypes.bool.isRequired,
  projectId: PropTypes.string.isRequired
};

/**
 * Determine is menu item should be include for projectId
 */
function include(item, projectId) {
  const { include, exclude } = item;
  return (include == null && exclude == null)
    || (include != null && include.indexOf(projectId) !== -1)
    || (exclude != null && exclude.indexOf(projectId) === -1);
}

function renderItemText(text) {
  return typeof text === 'string' ? safeHtml(text) : text;
}
