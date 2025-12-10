;(function () {
  // DM4 RUNTIME CONTRACT MODULE
  // Establishes the DM4 namespace and core config used by all other DM4 modules.

  if (!window.DM4) {
    window.DM4 = {};
  }
  var DM4 = window.DM4;

  // Core config bucket for global flags (debug, feature toggles, etc.)
  DM4.config = DM4.config || {};

  // Default debug flag (can be overridden by host page before or after load)
  if (typeof DM4.config.debug === "undefined") {
    DM4.config.debug = true;
  }
})();