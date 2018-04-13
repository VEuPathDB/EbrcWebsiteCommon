import NewWindowLink from './NewWindowLink';
import { formatReleaseDate } from '../util/formatters';
import { buildNumber, releaseDate, displayName, projectId, webAppUrl } from '../config';

const projects = [
  'EuPathDB',
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
];

/** Application footer */
export default function Footer() {
  return (
    <div className="wide-footer ui-helper-clearfix" id="fixed-footer">
      <div className="left">
        <div className="build-info">
          <span>
            <a href={'http://' + projectId.toLowerCase() + '.org'}>{displayName}</a>
            <span> {buildNumber} &nbsp;&nbsp; {formatReleaseDate(releaseDate)}</span>
          </span>
          <br/>
        </div>
        <div className="copyright">©{new Date().getFullYear()} The EuPathDB Project Team</div>
        <div className="twitter-footer">Follow us on
          <a className="eupathdb-SocialMedia eupathdb-SocialMedia__twitter" href="https://twitter.com/MicrobiomeDB" target="_blank"></a>
        </div>
      </div>
      <div className="right">
        <ul className="attributions">
          <li>
            <a href="http://code.google.com/p/strategies-wdk/">
              <img width="120" src={webAppUrl + '/wdk/images/stratWDKlogo.png'} />
            </a>
          </li>
        </ul>
        <div className="contact">
          Please <NewWindowLink href={webAppUrl + '/contact.do'}>Contact Us</NewWindowLink> with any questions or comments
        </div>
      </div>
      <div className="bottom">
        <ul className="site-icons">
          {projects.map(project =>
            <li title={`${project}.org`}>
              <a href={`https://www.${project.toLowerCase()}.org`} className={project}>
                https://www.{project.toLowerCase()}.org
            </a>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
