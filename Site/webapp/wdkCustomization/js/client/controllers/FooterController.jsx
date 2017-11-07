import { WdkViewController } from 'wdk-client/Controllers';
import { Footer } from 'wdk-client/Components';

export default class FooterController extends WdkViewController {
  renderView() {
    return <Footer/>
  }
}
