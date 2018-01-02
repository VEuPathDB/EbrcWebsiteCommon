import { WdkViewController } from 'wdk-client/Controllers';
import { Header } from 'wdk-client/Components';

export default class HeaderController extends WdkViewController {
  renderView() {
    return <Header/>
  }
}
