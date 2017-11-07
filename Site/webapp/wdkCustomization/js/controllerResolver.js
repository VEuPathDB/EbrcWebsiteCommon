/* global wdk */
wdk.namespace('ebrc', ns => {
  /**
   * Return a Promise that resolves with the component identified by `id`.
   *
   * @param {string} id The string identifier of the ViewController.
   */
  async function controllerResolver(id) {
    let Controllers = await import(`./client/controllers`);
    return Controllers[id];
  }

  Object.assign(ns, { controllerResolver });
})
