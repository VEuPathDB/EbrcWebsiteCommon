import { connect } from 'react-redux';
import { PageController } from 'wdk-client/Controllers';
import { attemptAction } from 'ebrc-client/App/DataRestriction/DataRestrictionActionCreators';
import { requestNews } from 'ebrc-client/App/NewsSidebar/NewsModule';
import { loadSearches } from 'ebrc-client/App/Searches/SearchCardActionCreators';
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
  { attemptAction, requestNews, loadSearches }
);

class ClinEpiIndexController extends PageController {

  getTitle () {
    return this.props.displayName;
  }

  loadData() {
    this.props.requestNews();
    this.props.loadSearches();
  }

  renderView () {
    return (
      <CardBasedIndex {...this.props} />
    )
  }
}

export default enhance(ClinEpiIndexController);
