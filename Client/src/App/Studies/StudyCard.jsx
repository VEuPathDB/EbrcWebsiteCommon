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
import UIThemeProvider from '@veupathdb/core-components/dist/components/theming/UIThemeProvider';
import OutlinedButton from '@veupathdb/core-components/dist/components/buttons/OutlinedButton';
import { LocationOn, CalendarToday, MenuBookOutlined } from '@material-ui/icons';

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
    const { analyses, attemptAction, card } = this.props;
    console.log(colors);
    if (useEda) {
      return (
        <div className="StudyCard-LinkOuts">
         {// <DownloadLink className="box StudyCard-Download" linkText="Download" iconFirst studyAccess={card.access} studyId={card.id} studyUrl={card.downloadUrl.url} attemptAction={attemptAction}/>
          }
          {analyses?.some(analysis => analysis.studyId === card.id) &&
            <div className="box StudyCard-MyAnalyses">
              <Link to={{ pathname: makeEdaRoute(), search: `?s=${encodeURIComponent(card.name)}` }}>
                <i className="ebrc-icon-table"/> My analyses
              </Link>
            </div>
          }
        </div>
      );
    }
    else {
      return (
        <DownloadLink className="box StudyCard-Download" linkText="Download Data" studyAccess={card.access} studyId={card.id} studyUrl={card.downloadUrl.url} attemptAction={attemptAction}/>
      );
    }
  }

  renderFooter() {
    const { card, user, permissions } = this.props;
    if (useEda) {
      const { disabled } = card;
      const edaRoute = makeEdaRoute(card.id) + '/~latest';
      return (
        <Link className="StudyCard-SearchLink" to={edaRoute}>
          <div className="box StudyCard-PreFooter">
            { isPrereleaseStudy(card.access, card.id, user, permissions)
              ? <span title="Please check the study page">Coming Soon!</span>
              : <span>{disabled ? 'Explore Unavailable' : 'Explore The Data'}</span>
            }
          </div>
          <div className="box StudyCard-Footer">
            { (!isPrereleaseStudy(card.access, card.id, user, permissions))
             ? (
               <div className="box">
                 <i className="ebrc-icon-edaIcon"/>
               </div>
             ) : (
               <div className="emptybox">
                 &nbsp;
               </div>
             )}
          </div>
        </Link>
      );
    }
    else {
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
  }

  render () {
    const { card } = this.props;
    const { id, name, categories, route, headline, points, disabled } = card;
    const myStudyTitle = "Go to the Study Details page";
    const primaryCategory = categories[0];
    const edaRoute = makeEdaRoute(card.id) + '/~latest';


    if (useEda) {
      const styleOverrides = {content: {
        backgroundColor: 'white'
      }};

      const exploreOnPress = function () {
        location.href = edaRoute;
      };
      const detailsOnPress = function () {
        location.href = edaRoute + '/details';
      };
      const myAnalysesOnPress = function () {
        return ({ "pathname": makeEdaRoute(), "search": `?s=${encodeURIComponent(card.name)}` });
      };

      const { analyses, attemptAction, card, user, permissions } = this.props;

      const studyYears = headline.match(/[0-9]{4}-?,?\s?[0-9]{4}/) ? headline.match(/[0-9]{4}-?,?\s?[0-9]{4}/)[0] : headline.match(/[0-9]{4}/)[0];
      const studyLocation = headline.replace(/[0-9]{4}-?,?\s?/g,'').replace(/\s?from\s?$/,'').replace(/,\s?$/,'').trim();
      const disabledStyle = {opacity: 0.3,
        pointerEvents: 'none',
        transition: 'all 0.5s'
      };

      return (
          <div style={disabled ? {minWidth: 300, margin: 10, ...disabledStyle} : {minWidth: 300, margin: 10}}>
            <UIThemeProvider
              theme={{
                palette: {
                  primary: { hue: colors.mutedCyan, level: 600 },
                  secondary: { hue: colors.mutedRed, level: 500 },
                },
              }}
              >
            </UIThemeProvider> 
            <Card title={safeHtml(name)} titleSize="small" width={300} height={480} themeRole="primary" styleOverrides={styleOverrides}>
              <div style={{marginTop: 20, color: colors.mutedCyan[600]}}>
                <div style={{display: 'flex', alignItems: 'center', margin: 3}}>
                  <LocationOn fontSize="inherit" style={{marginRight: 10}} />{studyLocation}
                </div>
                <div style={{display: 'flex', alignItems: 'center', margin: 3}}>
                  <CalendarToday fontSize="inherit" style={{marginRight: 10}} />{studyYears}
                </div>
              </div>
              <div className="emptybox">
                &nbsp;
              </div>
              <div style={{marginTop: 10}}>
                <ul>
                  {points.map((point, index) => <li key={index} dangerouslySetInnerHTML={{ __html: point }} />)}
                </ul>
              </div>
              <div style={{position: 'absolute', bottom: 20, left: 20, display: 'flex', flexDirection: 'column'}}>
                {analyses?.some(analysis => analysis.studyId === card.id) &&
                  <OutlinedButton text="My analyses" icon={TableDownload} size="small" themeRole="primary" onPress={myAnalysesOnPress}/>
                }
                { isPrereleaseStudy(card.access, card.id, user, permissions)
                  ? <OutlinedButton text="Coming soon!" icon={EdaIcon} size="small" themeRole="primary" />
                  : <OutlinedButton text={disabled ? 'Explore Unavailable' : 'Explore'} icon={EdaIcon} size="small" themeRole="primary" onPress={exploreOnPress}/>
                }
                <OutlinedButton text="Study Details" icon={MenuBookOutlined} size="small" themeRole="primary" onPress={detailsOnPress}/>
              </div>
            </Card>
          </div>
      );

    } else {

      return (
        <div className={'Card StudyCard ' + (disabled ? 'disabled' : '') + ' StudyCard__' + id}>
          <div className="box StudyCard-Heading">
            <h2 title={myStudyTitle}><Link to={useEda ? edaRoute + '/details' : route}>{safeHtml(name)}</Link></h2>
            <div className="box StudyCard-Categories">
              {primaryCategory && <CategoryIcon category={primaryCategory}/>}
            </div>
            {/*<Link to={route} target="_blank" title={myStudyTitle}>
              <Icon fa="angle-double-right" /> 
            </Link> */}
          </div>
          <Link to={useEda ? edaRoute + '/details' : route} className="StudyCard-DetailsLink" title={myStudyTitle}>
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
