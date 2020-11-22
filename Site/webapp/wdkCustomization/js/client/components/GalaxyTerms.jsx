import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'wdk-client/Components';
import GalaxyPageLayout from './GalaxyPageLayout';

/**
 * Galaxy page component
 */
export default function GalaxyTerms(props) {
  let { user, showLoginForm } = props;
  const displayName = useSelector(
    state => state.globalData.config && state.globalData.config.displayName
  );

  return (
    <GalaxyPageLayout>
      <p className="eupathdb-GalaxyTermsLead">
        <em>Welcome to the free VEuPathDB Galaxy Data Analysis Service. </em>
        This service uses a dedicated Galaxy site preloaded with VEuPathDB genomes and
        workflows, and is hosted by <a href="https://www.globus.org/genomics">
        Globus Genomics</a>, an affiliate of <a href="https://www.globus.org">Globus</a>.
      </p>

      <div className="eupathdb-GalaxyWelcomeGrid">
        {displayName != 'OrthoMCL' && (<div>
          <p>Use Galaxy to analyze RNA-Seq, ChIP-Seq, Variants, and many other data sets.</p>
          <p>Some analysis results will be available as tracks and searches in {displayName}.</p>
        </div>)}
       {displayName == 'OrthoMCL' && (<div className="smaller-font">
	  <p>In VEuPathDB Galaxy you may upload your proteins .fasta file and map them to OrthoMCL Core or Residual groups.</p>
          <p>If the proteins come from a single proteome, you can additionally find paralog groups.</p>
          <p>Once you are logged in, click below "Go to Galaxy".</p>
        </div>)}
        <div>
          <img src="/a/wdkCustomization/images/globus-01-welcome-page.png"/>
        </div>
      </div>

      <div className="eupathdb-GalaxyTermsContinueLink">
        {user.isGuest ? (
          <a href="#login" onClick={e => {
            e.preventDefault();
            showLoginForm('/a/app/galaxy-orientation/sign-up')
          }} className="eupathdb-BigButton">
            Go to Galaxy
          </a>
        ) : (
          <Link to="/galaxy-orientation/sign-up" className="eupathdb-BigButton">
            Go to Galaxy
          </Link>
        )}
      </div>
    </GalaxyPageLayout>
  );
}

GalaxyTerms.propTypes = {
  user: PropTypes.object.isRequired,
  showLoginForm: PropTypes.func.isRequired
};
