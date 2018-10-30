import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import Home from 'ebrc-client/App/Home';
import DisclaimerModal from 'ebrc-client/App/DisclaimerModal';

/* * Home page for clinepidb sites */
export default function Index (props) {
  return (
    <Fragment>
      <Home {...props} />
      <DisclaimerModal />
    </Fragment>
  );
}

Index.propTypes = {
  displayName: PropTypes.string.isRequired,
  webAppUrl: PropTypes.string.isRequired
};
