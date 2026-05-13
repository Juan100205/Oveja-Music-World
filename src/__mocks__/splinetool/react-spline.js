// Jest stub for @splinetool/react-spline (ESM-only package)
const React = require('react')

function Spline({ scene, onLoad, style }) {
  React.useEffect(() => {
    // Intentionally never fires — tests trigger onLoad manually via splineBridge
  }, [])
  return React.createElement('div', { 'data-testid': 'spline-canvas', 'data-scene': scene, style })
}

module.exports = Spline
module.exports.default = Spline
module.exports.__esModule = true
