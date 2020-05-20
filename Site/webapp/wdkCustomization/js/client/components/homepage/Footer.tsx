import React, { FunctionComponent, ReactNode } from 'react';

import { Link } from 'wdk-client/Components';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import { ProjectLink } from 'ebrc-client/components/homepage/ProjectLink';
import { SocialMediaLinks } from 'ebrc-client/components/homepage/SocialMediaLinks';
import { combineClassNames } from 'ebrc-client/components/homepage/Utils';

import { formatReleaseDate } from 'ebrc-client/util/formatters';

import './Footer.scss';

const cx = makeClassNameHelper('ebrc-Footer');

export const projects = [
  'VEuPathDB',
  'AmoebaDB',
  'CryptoDB',
  'FungiDB',
  'GiardiaDB',
  'HostDB',
  'MicrosporidiaDB',
  'PiroplasmaDB',
  'PlasmoDB',
  'ToxoDB',
  'TrichDB',
  'TriTrypDB',
  'VectorBase',
  'OrthoMCL',
  'ClinEpiDB',
  'MicrobiomeDB'
];

type Props = {
  containerClassName?: string;
  buildNumber: string | undefined;
  releaseDate: string | undefined;
  displayName: string | undefined;
};

export const Footer: FunctionComponent<Props> = ({ children, containerClassName, buildNumber, releaseDate, displayName }) => (
  <footer className={combineClassNames(cx(), containerClassName)}>
    <div className={cx('PageDescriptionRow')}>
      {children}
    </div>

    <div className={cx('SiteFamilyRow')}>
      <div className={cx('Copyright')}>
         <div><img width="80%" src="/assets/images/BRC_Logo_transparent-01.png"></img></div>
  {/*      <div className={cx('Brand')}>
          <Link to="/new-home-page">{displayName}</Link>
        </div>
        <div>
          Release {buildNumber} | {releaseDate && formatReleaseDate(releaseDate)}
        </div>
        <div>
          ©{new Date().getFullYear()} The VEuPathDB Project Team
        </div>
*/}
      </div>
      <div className="footer-center"> 
      <div className={cx('ProjectLinks')}>
        {projects.map(projectId =>
          <React.Fragment key={projectId}>
            <ProjectLink projectId={projectId} />
            {
              projectId === 'VectorBase' &&
              <div className={cx('Divider')}></div>
            }
          </React.Fragment>
        )}
      </div>
      <div className="footer-center-copyright">
          ©{new Date().getFullYear()} The VEuPathDB Project Team
      </div>
      </div>

      <SocialMediaLinks />
    </div>
  </footer>
);
