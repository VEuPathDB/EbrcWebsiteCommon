import React from 'react';
import NewWindowLink from './NewWindowLink';
import { formatReleaseDate } from '../util/formatters';
import { buildNumber, releaseDate, displayName, webAppUrl } from '../config';

const projects = [
  [ 'https', 'EuPathDB' ],
  [ 'http', 'AmoebaDB' ],
  [ 'http', 'CryptoDB' ],
  [ 'http', 'FungiDB' ],
  [ 'http', 'GiardiaDB' ],
  [ 'http', 'MicrosporidiaDB' ],
  [ 'http', 'PiroplasmaDB' ],
  [ 'http', 'PlasmoDB' ],
  [ 'http', 'ToxoDB' ],
  [ 'http', 'TrichDB' ],
  [ 'http', 'TriTrypDB' ],
  [ 'http', 'OrthoMCL' ],
];

/** Application footer */
export default function Footer() {
  return (
    <div className="Footer">
      <div>
        <div>
          <span>
            <a href={`//${location.hostname}`}>{displayName}</a>
            <span> {buildNumber} &nbsp;&nbsp; {formatReleaseDate(releaseDate)}</span>
          </span>
          <br/>
        </div>
        <div>©{new Date().getFullYear()} The EuPathDB Project Team</div>
      </div>

      <div>
        <ul className="site-icons">
          {projects.map(([ protocol, project ]) =>
            <li title={`${project}.org`} key={project}>
              <a href={`${protocol}://${project.toLowerCase()}.org`} className={project}>
                {protocol}://{project.toLowerCase()}.org
            </a>
            </li>
          )}
        </ul>
      </div>

      <div>
        <div>
          <a href="http://code.google.com/p/strategies-wdk/">
            <img width="120" src={webAppUrl + '/wdk/images/stratWDKlogo.png'} />
          </a>
        </div>
        <div>
          Please <NewWindowLink href={webAppUrl + '/app/contact-us'}>Contact Us</NewWindowLink> with any questions or comments
        </div>
      </div>
    </div>
  );
}
