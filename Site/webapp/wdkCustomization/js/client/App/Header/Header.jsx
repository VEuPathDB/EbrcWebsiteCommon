import React from 'react';
import { connect } from 'react-redux';
import { Hero } from 'ebrc-client/App/Hero';
import { requestStudies } from 'ebrc-client/App/Studies/StudyActionCreators';
import { UserActions } from 'wdk-client/Actions';

import './Header.scss';

import HeaderNav from './HeaderNav';

const enhance = connect(
  (state, props) => {
    const { getSiteData, makeHeaderMenuItems } = props;
    const headerMenuItems = makeHeaderMenuItems(state);
    const siteData = getSiteData(state);
    const { dataRestriction, globalData } = state;
    const { user = {}, siteConfig, preferences } = globalData;
    return { user, siteConfig, preferences, siteData, dataRestriction, headerMenuItems };
  },
  { ...UserActions, requestStudies },
  (stateProps, actions) => {
    return { ...stateProps, actions };
  }
);

class Header extends React.Component {

  componentDidMount() {
    this.props.actions.requestStudies();
  }

  render () {
    const { headerMenuItems, siteConfig, siteData, user, actions } = this.props;
    const { webAppUrl, rootUrl } = siteConfig;
    const content = {
      heroImage: `${webAppUrl}/images/global.jpg`,
      heroPosition: 'left 33%',
      heading: `Welcome To <span style="font-weight: 400; font-family: 'Exo 2'">ClinEpi<span style="color:#DD314E">DB</span></span>`,
      tagline: 'Advancing global public health by facilitating the exploration and analysis of epidemiological studies'
    };
    const { pathname } = window.location;
    const showHomeContent = (rootUrl === pathname || (rootUrl + '/') === pathname);

    return (
      <header className={'Header' + (showHomeContent ? ' Header--Home' : '')}>
        <Hero image={content.heroImage} position={content.heroPosition}>
          <HeaderNav
            actions={actions}
            headerMenuItems={headerMenuItems}
            siteConfig={siteConfig}
            siteData={siteData}
            user={user}
          />
          {!showHomeContent
            ? null
            : (
              <div>
                <h1 dangerouslySetInnerHTML={{ __html: content.heading }} />
                <h3 dangerouslySetInnerHTML={{ __html: content.tagline }} />
              </div>
            )
          }
        </Hero>
      </header>
    );
  }
}

export default enhance(Header);
