import React from 'react';
import { CategoryIcon } from 'ebrc-client/App/Categories';
import { IconAlt as Icon, Link } from 'wdk-client/Components';

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
    const { study, prefix, attemptAction } = this.props;
    const { searchType } = this.state;
    const { name, categories, route, headline, points, searches, disabled, downloadUrl } = study;
    const myStudyTitle = "Go to the Study Details page";
    const myDownloadTitle = "Download data files";

    return (
      <div className={'Card StudyCard ' + (disabled ? 'disabled' : '')}>
        <div className="box StudyCard-Heading">
          <h2 title={myStudyTitle}><Link to={route}>{name}</Link></h2>
          <div className="box StudyCard-Categories">
            {categories.map(cat => (
              <CategoryIcon category={cat} key={cat} />
            ))}
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
        <div className="box StudyCard-Download"> 
          <button
            type="button"
            className="link"
            onClick={(event) => {
              const { ctrlKey } = event;
              attemptAction('download', {
                studyId: study.id,
                onAllow: () => {
                  if (ctrlKey) window.open(downloadUrl.url, '_blank');
                  else window.location.assign(downloadUrl.url)
                }
              });
            }}
            title={myDownloadTitle}>
            Download Data <Icon fa="download" />
          </button>
        </div>
        <div className="box StudyCard-PreFooter">
          {searchType
            ? <span>Search <b>{searchType}</b></span>
            : <span title="Click on an Icon">{disabled ? 'Search Unavailable' : 'Search The Data'}</span>
          }
        </div>
        <div className="box StudyCard-Footer">
          {searches.length
            ? searches.map(({ icon, displayName, name }) => {
              const webappUrl = (prefix ? prefix : '') + '/showQuestion.do?questionFullName=' + name;
              return (
                <div
                  key={name}
                  className="box"
                  onMouseEnter={() => this.displaySearchType(displayName)}
                  onMouseLeave={this.clearDisplaySearchType}>
                  <a href={webappUrl}>
                    <i className={icon} />
                  </a>
                </div>
              );
            })
            : (
              <div className="box">
                &nbsp;
              </div>
            )}
        </div>
      </div>
    );
  }
};

export default StudyCard;
