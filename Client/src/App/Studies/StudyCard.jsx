import React from 'react';
import { connect } from 'react-redux';
import { CategoryIcon } from 'ebrc-client/App/Categories';
import { IconAlt as Icon, Link } from '@veupathdb/wdk-client/lib/Components';
import { safeHtml } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import DownloadLink from './DownloadLink';
import { isPrereleaseStudy } from 'ebrc-client/App/DataRestriction/DataRestrictionUtils';
import './StudyCard.scss';


class StudyCard extends React.Component {
  constructor (props) {
    super(props);
    this.state = { searchType: null };
    this.displaySearchType = this.displaySearchType.bind(this);
    this.clearDisplaySearchType = this.clearDisplaySearchType.bind(this);
  }

  displaySearchType (searchType) {
    this.setState({ searchType });
  }

  clearDisplaySearchType () {
    const searchType = null;
    this.setState({ searchType });
  }

  render () {
    const { card, user, permissions, prefix, attemptAction } = this.props;
    const { searchType } = this.state;
    const { id, access, name, categories, route, headline, points, searches, disabled } = card;
    const myStudyTitle = "Go to the Study Details page";
    const primaryCategory = categories[0];

    return (
      <div className={'Card StudyCard ' + (disabled ? 'disabled' : '') + ' StudyCard__' + id}>
        <div className="box StudyCard-Heading">
          <h2 title={myStudyTitle}><Link to={route}>{safeHtml(name)}</Link></h2>
          <div className="box StudyCard-Categories">
            {primaryCategory && <CategoryIcon category={primaryCategory}/>}
          </div>
          {/*<Link to={route} target="_blank" title={myStudyTitle}>
            <Icon fa="angle-double-right" /> 
          </Link> */}
        </div>
        <Link to={route} className="StudyCard-DetailsLink" title={myStudyTitle}>
          <small>Study Details <Icon fa="chevron-circle-right"/></small>
        </Link>
        <div className="box StudyCard-Stripe">
          {headline}
        </div>
        <div className="box StudyCard-Body">
          <ul>
            {points.map((point, index) => <li key={index} dangerouslySetInnerHTML={{ __html: point }} />)}
          </ul>
        </div>
        <DownloadLink className="box StudyCard-Download" linkText="Download Data" studyAccess={card.access} studyId={card.id} studyUrl={card.downloadUrl.url} attemptAction={attemptAction}/>
        <div className="box StudyCard-PreFooter">
          { isPrereleaseStudy(card.access, card.id, user, permissions)
            ? <span title="Please check the study page">Coming Soon!</span>
            : searchType
              ? <span>by <b>{searchType}</b></span>
              : <span title="Click on an Icon">{disabled ? 'Explore Unavailable' : 'Explore The Data'}</span>
          }
        </div>
        <div className="box StudyCard-Footer">
          { (!isPrereleaseStudy(card.access, card.id, user, permissions) && searches.length)
            ? searches.map(({ icon, displayName, path }) => {
              const route = `/search/${path}`;
              return (
                <div
                  key={path}
                  className="box"
                  onMouseEnter={() => this.displaySearchType(displayName)}
                  onMouseLeave={this.clearDisplaySearchType}>
                  <Link to={route}>
                    <i className={icon} />
                  </Link>
                </div>
              );
            })
            : (
              <div className="emptybox">
                &nbsp;
              </div>
            )}
        </div>
      </div>
    );
  }
}

export default connect( state => ({user: state.globalData.user}) )(StudyCard);
