import { connect } from 'react-redux';
import { PageController } from 'wdk-client/Controllers';
import { attemptAction } from 'ebrc-client/App/DataRestriction/DataRestrictionActionCreators';
import { requestNews } from 'ebrc-client/App/NewsSidebar/NewsModule';
import { loadSearches } from 'ebrc-client/App/Searches/SearchCardActionCreators';
import { requestStudies } from 'ebrc-client/App/Studies/StudyActionCreators';
import CardBasedIndex from '../components/CardBasedIndex';

const enhance = connect(
  (state, props) => {
    const { getSiteData, getHomeContent } = props;
    const { globalData, newsSidebar } = state;
    const { siteConfig } = globalData;
    const siteData = getSiteData(state);
    const homeContent = getHomeContent(siteData);

    return { ...siteConfig, siteData, newsSidebar, homeContent };
  },
  { attemptAction, loadSearches, requestNews, requestStudies }
);

class ClinEpiIndexController extends PageController {

  getTitle () {
    return this.props.displayName;
  }

  loadData() {
    this.props.loadSearches(this.props.searchesUserEmails);
    this.props.requestNews();
    this.props.requestStudies();
  }

  renderView () {
    return (
      <CardBasedIndex {...this.props} />
    )
  }
}

export default enhance(ClinEpiIndexController);
