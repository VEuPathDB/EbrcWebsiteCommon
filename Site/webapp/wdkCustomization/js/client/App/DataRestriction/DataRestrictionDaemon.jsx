import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { UserSessionActions } from 'wdk-client/Actions';

import { clearRestrictions } from './DataRestrictionActionCreators';
import DataRestrictionModal from './DataRestrictionModal';

const { showLoginForm } = UserSessionActions;

function DataRestrictionDaemon(props) {
  const {
    dataRestriction,
    user,
    webAppUrl,
    clearRestrictions,
    showLoginForm,
  } = props;

  if (dataRestriction == null || user == null) return null;

  return !dataRestriction ? null : (
    <DataRestrictionModal
      when={true}
      user={user}
      study={dataRestriction.study}
      action={dataRestriction.action}
      webAppUrl={webAppUrl}
      onClose={clearRestrictions}
      showLoginForm={showLoginForm}
    />
  );
}

DataRestrictionDaemon.propTypes = {
  dataRestriction: PropTypes.object,
  user: PropTypes.object,
  webAppUrl: PropTypes.string.isRequired,
  clearRestrictions: PropTypes.func.isRequired,
  showLoginForm: PropTypes.func.isRequired,
};

const enhance = connect(
  state => ({
    dataRestriction: state.dataRestriction,
    user: state.globalData.user,
    webAppUrl: state.globalData.siteConfig.webAppUrl
  }),
  {
    clearRestrictions,
    showLoginForm
  }
)

export default enhance(DataRestrictionDaemon);
