import React from 'react';

import { Link, IconAlt } from 'wdk-client/Components';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import { ProjectLink } from 'ebrc-client/components/homepage/ProjectLink';

// FIXME: Pull these from globalData
import { twitterUrl, facebookUrl, youtubeUrl } from 'ebrc-client/config';
import { formatReleaseDate } from 'ebrc-client/util/formatters';

import { Twitter, Facebook, YouTube, ContactUs } from './SocialMediaIcons';
import { combineClassNames } from './Utils';

import './Footer.scss';

const cx = makeClassNameHelper('ebrc-Footer');

export const projects = [
  'VEuPathDB',
  'AmoebaDB',
  'CryptoDB',
  'FungiDB',
  'GiardiaDB',
  'MicrosporidiaDB',
  'PiroplasmaDB',
  'PlasmoDB',
  'ToxoDB',
  'TrichDB',
  'TriTrypDB',
  'OrthoMCL',
  'VectorBase'
];

type Props = {
  containerClassName?: string;
  buildNumber: string | undefined;
  releaseDate: string | undefined;
  displayName: string | undefined;
};

export const Footer = ({ containerClassName, buildNumber, releaseDate, displayName }: Props) => (
  <footer className={combineClassNames(cx(), containerClassName)}>
    <div className={cx('Copyright')}>
      <div className={cx('Brand')}>
        <Link to="/new-home-page">{displayName}</Link>
      </div>
      <div>
        Release {buildNumber} | {releaseDate && formatReleaseDate(releaseDate)}
      </div>
      <div>
        ©{new Date().getFullYear()} The VEuPathDB Project Team
      </div>
    </div>

    <div className={cx('ProjectLinks')}>
      {projects.map(projectId =>
        <ProjectLink key={projectId} projectId={projectId} />
      )}
    </div>

    <SocialMediaLinks />
  </footer>
);

type SocialMediaLinksProps = {
  showNewsIcon?: boolean,
  onNewsIconClick?: () => void
};

export const SocialMediaLinks = ({
  showNewsIcon = false,
  onNewsIconClick
}: SocialMediaLinksProps) =>
  <div className={cx('SocialMediaLinks')}>
    {
      showNewsIcon &&
      <button onClick={onNewsIconClick} className="link">
        <IconAlt fa="newspaper-o" />
        <span>News</span>
      </button>
    }

    <Link to="/contact-us" target="_blank">
      <ContactUs />
    </Link>

    <a href={twitterUrl} target="_blank">
      <Twitter />
    </a>

    <a href={facebookUrl} target="_blank">
      <Facebook />
    </a>

    <a href={youtubeUrl} target="_blank">
      <YouTube />
    </a>
  </div>;
