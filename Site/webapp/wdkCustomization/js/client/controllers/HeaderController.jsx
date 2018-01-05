import { WdkViewController } from 'wdk-client/Controllers';
import { Header } from 'wdk-client/Components';
import { ModalBoundary } from 'mesa';

export default class HeaderController extends WdkViewController {
  renderView() {
    return <ModalBoundary style={{ zIndex: 1000 }}><Header/></ModalBoundary>
  }
}
