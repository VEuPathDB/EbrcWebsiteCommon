import NewWindowLink from './NewWindowLink';
import { formatReleaseDate } from '../util/formatters';
import { buildNumber, releaseDate, displayName, projectId, webAppUrl } from '../config';

/** Application footer */
export default function Footer() {
  return (
    <div className="wide-footer ui-helper-clearfix" id="fixed-footer">
      <div className="left">
        <div className="build-info">
          <span>
            <a href={'https://beta.' + projectId.toLowerCase() + '.org'}>{displayName}</a>
            <span> {buildNumber} &nbsp;&nbsp; {formatReleaseDate(releaseDate)}</span>
          </span>
          <br/>
        </div>
        <div className="copyright">©{new Date().getFullYear()} The VEuPathDB Project Team</div>
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
          <li title="beta.VEuPathDB.org">
            <a href="https://beta.veupathdb.org">
              <img alt="Link to VEuPathDB homepage" src={webAppUrl + '/images/VEuPathDB.png'}/>
            </a>
          </li>
          <li title="beta.AmoebaDB.org" className="short-space">
            <a href="https://beta.amoebadb.org">
              <img src={webAppUrl + '/images/AmoebaDB/footer-logo.png'}/>
            </a>
          </li>
          <li title="beta.CryptoDB.org" className="short-space">
            <a href="https://beta.cryptodb.org">
              <img src={webAppUrl + '/images/CryptoDB/footer-logo.png'}/>
            </a>
          </li>
          <li title="beta.FungiDB.org" className="short-space">
            <a href="https://beta.fungidb.org">
              <img src={webAppUrl + '/images/FungiDB/footer-logo.png'}/>
            </a>
          </li>
          <li title="beta.GiardiaDB.org" className="short-space">
            <a href="https://beta.giardiadb.org">
              <img src={webAppUrl + '/images/GiardiaDB/footer-logo.png'}/>
            </a>
          </li>
          <li title="beta.MicrosporidiaDB.org" className="long-space">
            <a href="https://beta.microsporidiadb.org">
              <img src={webAppUrl + '/images/MicrosporidiaDB/footer-logo.png'}/>
            </a>
          </li>
          <li title="beta.PiroplasmaDB.org" className="short-space">
            <a href="https://beta.piroplasmadb.org">
              <img src={webAppUrl + '/images/PiroplasmaDB/footer-logo.png'}/>
            </a>
          </li>
          <li title="beta.PlasmoDB.org" className="long-space">
            <a href="https://beta.plasmodb.org">
              <img src={webAppUrl + '/images/PlasmoDB/footer-logo.png'}/>
            </a>
          </li>
          <li title="beta.ToxoDB.org" className="long-space">
            <a href="https://beta.toxodb.org">
              <img src={webAppUrl + '/images/ToxoDB/footer-logo.png'}/>
            </a>
          </li>
          <li title="beta.TrichDB.org" className="short-space">
            <a href="https://beta.trichdb.org">
              <img src={webAppUrl + '/images/TrichDB/footer-logo.png'}/>
            </a>
          </li>
          <li title="beta.TriTrypDB.org" className="short-space">
            <a href="https://beta.tritrypdb.org">
              <img src={webAppUrl + '/images/TriTrypDB/footer-logo.png'}/>
            </a>
          </li>
          <li title="beta.OrthoMCL.org" className="short-space">
            <a href="https://beta.orthomcl.org">
              <img src={webAppUrl + '/images/OrthoMCL/footer-logo.png'}/>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
