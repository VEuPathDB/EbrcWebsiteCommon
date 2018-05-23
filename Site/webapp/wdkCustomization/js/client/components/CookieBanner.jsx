import React from 'react';

// Store user consent in browser storage
// -------------------------------------

const USER_AGREED_KEY = '@ebrc/agreed-cookies';

const UserAgreedStore = {
  get: () => JSON.parse(window.localStorage.getItem(USER_AGREED_KEY) || "false"),
  set: (value) => window.localStorage.setItem(USER_AGREED_KEY, JSON.stringify(Boolean(value)))
};


// Styles
// ------

const bannerStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '2em',
  fontSize: '1.2em',
  background: 'black',
  color: 'white',
  boxShadow: 'rgb(114, 114, 114) 0px -1px 1px',
  zIndex: 1000
};

const linkStyle = {
  color: '#96b1e9',
  textDecoration: 'underline',
  whiteSpace: 'nowrap'
};


/**
 * Inform user of cookie usage. Display banner until user clicks agree button.
 */
export default class CookieBanner extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      userAgreed: undefined,
      loading: true
    };

    this.handleButtonClick = this.handleButtonClick.bind(this);
  }

  componentDidMount() {
    this.setState({
      userAgreed: UserAgreedStore.get(),
      loading: false
    });
  }

  handleButtonClick() {
    UserAgreedStore.set(true);
    this.setState({ userAgreed: true });
  }

  render() {
    const { loading, userAgreed } = this.state;
    return loading || userAgreed ? null : (
      <div style={bannerStyle}>
        <div>
          This website requires cookies, and the limited processing of your
          personal data in order to function. By using the site you are agreeing
          to this as outlined in our <a style={linkStyle} target="_blank" href="/documents/EuPathDB_Website_Privacy_Policy.shtml">Privacy Notice</a>.
        </div>
        <div>
          <div>
            <button style={linkStyle} type="button" onClick={this.handleButtonClick} className="wdk-Link">I agree, dismiss this banner.</button>
          </div>
          <div style={{ marginTop: '.5em' }}>
            <a style={linkStyle} target="_blank" href="/documents/EuPathDB_Website_Privacy_Policy.shtml">More information.</a>
          </div>
        </div>
      </div>
    );
  }
}
