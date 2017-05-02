import React from 'react';
import { render} from 'react-dom';

// An adaptor that allows us to reuse react client components on the legacy website.
// This currently only works with components that are not view-specific
// (like the header and footer).


class ClientContextProvider extends React.Component {

  getChildContext() {
    const { stores: { IndexStore: store }, dispatchAction } = window.ebrc.context;
    return { store, dispatchAction }
  }

  render() {
    return this.props.children;
  }

}

ClientContextProvider.childContextTypes = {
  store: React.PropTypes.object.isRequired,
  dispatchAction: React.PropTypes.func.isRequired
}


export function renderWithContext(reactElement, container) {
  render((
    <ClientContextProvider>
      {reactElement}
    </ClientContextProvider>
  ), container);
}
