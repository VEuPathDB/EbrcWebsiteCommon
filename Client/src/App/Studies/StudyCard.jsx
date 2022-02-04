import React from 'react';
import { connect } from 'react-redux';
import { useEda } from 'ebrc-client/config';
import { CategoryIcon } from 'ebrc-client/App/Categories';
import { IconAlt as Icon, Link } from '@veupathdb/wdk-client/lib/Components';
import { safeHtml } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import DownloadLink from './DownloadLink';
import { isPrereleaseStudy } from '@veupathdb/study-data-access/lib/data-restriction/DataRestrictionUtils';
import './StudyCard.scss';
import { makeEdaRoute } from 'ebrc-client/routes';
import { colors } from '@veupathdb/core-components';
import Card from '@veupathdb/core-components/dist/components/containers/Card';
import { TableDownload, EdaIcon } from '@veupathdb/core-components/dist/components/icons';
import FilledButton from '@veupathdb/core-components/dist/components/buttons/FilledButton';
import OutlinedButton from '@veupathdb/core-components/dist/components/buttons/OutlinedButton';

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

  renderLinkouts() {
    const { attemptAction, card } = this.props;
    return (
      <DownloadLink className="box StudyCard-Download" linkText="Download Data" studyAccess={card.access} studyId={card.id} studyUrl={card.downloadUrl.url} attemptAction={attemptAction}/>
    );
  }

  renderFooter() {
    const { card, user, permissions } = this.props;
    const { searchType } = this.state;
    const { searches, disabled } = card;
    return (
      <>
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
                    <Link className="StudyCard-SearchLink" to={route}>
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
      </>
    );
  }

  render () {
    const { card } = this.props;
    const { id, name, categories, route, headline, points, disabled } = card;
    const myStudyTitle = "Go to the Study Details page";
    const primaryCategory = categories[0];
    const edaRoute = makeEdaRoute(card.id) + '/new';


    if (useEda) {
      const styleOverrides = {content: {
          backgroundColor: 'white'
        },
        border: {
          color: "#c6dee2"
        }};

      const exploreOnPress = function () {
        location.href = edaRoute;
      };
      const myAnalysesOnPress = function () {
        return ({ "pathname": makeEdaRoute(), "search": `?s=${encodeURIComponent(card.name)}` });
      };

      const { analyses, attemptAction, card, user, permissions } = this.props;

      const studyYears = headline.match(/[0-9]{4}-?,?\s?[0-9]{4}/) 
                          ? headline.match(/[0-9]{4}-?,?\s?[0-9]{4}/)[0] 
                          : headline.match(/[0-9]{4}/) 
                            ? headline.match(/[0-9]{4}/)[0]
                            : '';

      const studyLocation = headline.replace(/[0-9]{4}-?,?\s?/g,'').replace(/\s?from\s?$|\s?in\s?$/,'').replace(/,\s?$/,'').trim();
      const disabledStyle = {opacity: 0.3,
        pointerEvents: 'none',
        transition: 'all 0.5s'
      };

      return (
          <div style={disabled ? {minWidth: 300, margin: 10, ...disabledStyle} : {minWidth: 300, margin: 10}}>
            <Card title={safeHtml(name)} titleSize="small" width={300} height={450} themeRole="primary" styleOverrides={styleOverrides}>
              <div style={{fontSize: "0.8rem"}}>
               <div style={{marginTop: 20, color: colors.gray[800]}}>
                <div style={{display: 'flex', alignItems: 'center', margin: 3}}>
                  <span style={{ fontWeight: 600}}>Location:</span>
                  &nbsp;{studyLocation}
                </div>
                {studyYears && (<div style={{display: 'flex', alignItems: 'center', margin: 3}}>
                  <span style={{ fontWeight: 600}}>Dates:</span>
                  &nbsp;{studyYears}
                  </div>)
                }
                </div>
                <div className="emptybox">
                  &nbsp;
                </div>
                <div style={{marginTop: 10, color: colors.gray[700]}}>
                  <ul>
                    {points.map((point, index) => <li style={{marginTop: 5}} key={index} dangerouslySetInnerHTML={{ __html: point }} />)}
                  </ul>
                </div>
               </div>
                <div style={{position: 'absolute', bottom: 30, display: 'flex', flexFlow: 'row', gap: 13, width: 240}}>
                  { isPrereleaseStudy(card.access, card.id, user, permissions)
                    ? <FilledButton text="Coming soon!" icon={EdaIcon} size="small" themeRole="primary" />
                    : <Link to={edaRoute} style={{textDecoration: 'none'}}><FilledButton text={disabled ? 'Explore Unavailable' : 'Explore'} textTransform="none" icon={EdaIcon} size="small" themeRole="primary"/></Link>
                  }
                  {analyses?.some(analysis => analysis.studyId === card.id) &&
                    <Link to={{ pathname: makeEdaRoute(), search: `?s=${encodeURIComponent(card.name)}` }} style={{textDecoration: 'none'}}><OutlinedButton text="My analyses" textTransform="none" icon={TableDownload} size="small" themeRole="primary"/></Link>
                  }
                </div>
            </Card>  
        </div>
      );

    } else {

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
          {this.renderLinkouts()}
          {this.renderFooter()}
        </div>
      );
    }
  }
}

export default connect( state => ({user: state.globalData.user}) )(StudyCard);

