/**
 * Base path untuk GitHub Pages (subfolder) & XAMPP
 */
(function () {
  const path = window.location.pathname || '';
  const lastSlash = path.lastIndexOf('/');
  window.APP_BASE = lastSlash <= 0 ? '' : path.substring(0, lastSlash);

  window.assetUrl = function assetUrl(relative) {
    const rel = relative.replace(/^\//, '');
    return (window.APP_BASE ? window.APP_BASE + '/' : '') + rel;
  };
})();
