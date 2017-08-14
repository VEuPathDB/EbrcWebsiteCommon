let re = /\.(js|jsx|ts|tsx)$/
let req = require.context('./', true);
Object.defineProperty(exports, '__esModule', { value: true });

for (let key of req.keys()) {
  if (key === './' || key === './index' || re.test(key)) continue;
  exports[key.replace(/([^/]*\/)*/, '')] = req(key).default;
}
