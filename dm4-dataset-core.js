;(function () {
  "use strict";

  if (!window.DM4) {
    window.DM4 = {};
  }
  var DM4 = window.DM4;

  // Local debug flag mirrors the core viewer's DM4_DEBUG behavior
  var DM4_DEBUG = !!(DM4 && DM4.config && DM4.config.debug);

  /**
   * DATASET NORMALIZER
   *
   * This module owns the canonical normalization step for DM4 datasets.
   * It mirrors the original normalizeDataset implementation from the viewer
   * core, but is now exposed as DM4.dataset.normalize(rawDataset).
   */

  // DM4_DATASET_CORE_FUNCTION: normalize
  function normalizeDataset(raw) {
    if (!raw || typeof raw !== "object") {
      return DM4.Logger.critical(
        "normalizeDataset: empty or invalid raw dataset",
        function () {
          return { systems: {} };
        }
      );
    }

    var systemsSrc = raw.systems || {};
    var pixelsSrc = raw.system_pixels || raw.endpoint_pixels || {};
    var gridSrc = raw.system_grid || {};
    var sectorsSrc = raw.sectors || {};

    // Build reverse lookup: systemId -> sectorName
    var sectorBySystem = {};
    Object.entries(sectorsSrc).forEach(function (entry) {
      var sectorName = entry[0];
      var systemList = entry[1];
      (systemList || []).forEach(function (sysId) {
        sectorBySystem[sysId] = sectorName;
      });
    });

    var normalizedSystems = {};

    Object.entries(systemsSrc).forEach(function (entry) {
      var id = entry[0];
      var sys = entry[1] || {};
      var base = sys;

      var coords = base.coords;
      if (!coords && pixelsSrc && pixelsSrc[id]) {
        coords = pixelsSrc[id];
      }

      var grid = base.grid;
      if (!grid && gridSrc && gridSrc[id]) {
        grid = gridSrc[id];
      }

      var sector = base.sector;
      if (!sector && sectorBySystem[id]) {
        sector = sectorBySystem[id];
      }

      normalizedSystems[id] = Object.assign({}, base, {
        coords: coords,
        grid: grid,
        sector: sector
      });
    });

    return Object.assign({}, raw, {
      systems: normalizedSystems
    });
  }

  if (!DM4.dataset) {
    DM4.dataset = {};
  }
  DM4.dataset.normalize = normalizeDataset;
})();
