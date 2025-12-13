;(function () {
  "use strict";
  /*******************************
   * DREADMARCH VIEWER 4.0 — TABLE OF CONTENTS (DETAILED)
   *
   * 1) CONFIG DEFAULTS
   *    - applyStyleProfileForMode()
   *
   * 2) DATASET NORMALIZER
   *    - normalizeDataset()
   *
   * 3) STATE MANAGER
   *    - createStateManager()
   *    - getState()
   *    - notifySubscribers()
   *    - subscribe()
   *
   * 4) MAP: SYSTEM MARKERS & ROUTE LAYER
   *    - createSystemMarkersLayer()
   *    - buildMarkers()
   *    - renderSelection()  // markers / labels selection renderers
   *    - createSystemLabelsLayer()
   *    - buildLabels()
   *    - createRouteLayer()
   *    - getPointCoords()
   *    - registerLine()
   *
   * 5) MAP LAYER WITH DATA-BOUNDS CAMERA
   *    - initMapLayer()
   *    - clampAndApply()
   *    - resetViewToDataBounds()
   *    - initialApply()
   *    - handleResize()
   *
   * 6) PANELS: IDENTITY
   *    - IdentityPanel()
   *    - renderIdentity()
   *    - directionArrow()
   *    - baseDistance()
   *    - functionalD/*******************************
 * 6) PANEL & UI FUNCTION SUMMARY
 *    - distance()
 *    - renderNavcom()
 *    - pushNeighbor()
 *    - TestPanel()
 *    - makeBodyLine()
 *    - render()
 *    - assertPanelContract()
 *
 * 7) UI: PANEL REGISTRY
 *    - createPanelRegistry()
 *    - activatePanel()
 *    - setActiveButton()
 *
 * 8) UI: CONTROL BAR
 *    - initControlBar()
 *    - setActiveButton()
 *
 * 9) CORE BOOTSTRAP
 *    - bootstrapViewer()
 *    - runDm4SelfTest()
 *    - logPanelRegistryStatus()
 *******************************/


  /**
   * DREADMARCH BUNDLE INTEGRITY NOTE
   *
   * This bundle uses SHA-256 integrity hashes recorded in:
   *   - Dreadmarch_Development_Protocol_v1.0.txt
   *
   * When core files (index.html, dreadmarch-viewer4.js, dm-style-palette-e2.css)
   * are intentionally modified, the protocol's INTEGRITY HASHES section must be
   * updated to match the new state of the bundle.
   *
   * If the hashes in the protocol do not match the current files, treat that as
   * a signal to review recent changes for protocol compliance.
   */


  /**
   * DREADMARCH VIEWER 4.0 — UI & STYLE CONTRACT
   *
   * TEXT ROLES
   * ----------
   * - Only these text color roles:
   *   - .dm-text-title   → --dm-text-title-color
   *   - .dm-text-header  → --dm-text-header-color
   *   - .dm-text-body    → --dm-text-body-color
   *
   * FONTS
   * -----
   * - Only these font size variables:
   *   - --dm-font-large
   *   - --dm-font-medium
   *   - --dm-font-small
   * - No inline font-size in JS or HTML.
   *
   * PANELS
   * ------
   * - Panel roots:  .dm4-<panel>-root
   * - Inner:        .dm4-<panel>-inner
   * - Titles:       dm-text-title
   * - Headers:      dm-text-header
   * - Body lines:   dm-text-body
   *
   * COLORS
   * ------
   * - Component code never hard-codes colors.
   * - All colors come from:
   *   - system label palette (for map + identity-name)
   *   - text roles (for panel copy)
   *
   * ADDING NEW ROLES
   * ----------------
   * - If a design needs a new “kind” of text (warning, error, metric, etc.):
   *   1. Add a new --dm-text-*-color in the palette.
   *   2. Add a new .dm-text-* class in dm-style-palette-e2.css.
   *   3. Use that class in panel DOM.
   */
  /**
   * DM4 UI & STYLE EXPANSION PLAYBOOK
   *
   * HOW TO ADD A NEW TEXT ROLE (e.g. dm-text-warning)
   * -------------------------------------------------
   * 1) In dm-style-palette-e2.css:
   *    - Define a palette variable, e.g.:
   *        --dm-text-warning-color: #ffcc66;
   *    - Add a role class:
   *        .dm-text-warning { color: var(--dm-text-warning-color); }
   *
   * 2) In this file (DM4_STYLE_CONTRACT):
   *    - Add the variable name to requiredCssVars if you want runtime checks.
   *    - Add "dm-text-warning" to allowedTextRoles.
   *
   * 3) In panel code:
   *    - Apply the class to elements that should use this role, e.g.:
   *        el.classList.add("dm-text-warning");
   *
   * 4) Verify:
   *    - Load the viewer and check the console:
   *      - No 'Unknown text role class' warnings.
   *      - No 'Missing required CSS variable' errors.
   *
   * HOW TO ADD A NEW MODE (e.g. 'intel')
   * ------------------------------------
   * 1) In this file:
   *    - Add the new mode string to DM4_MODES:
   *        const DM4_MODES = ["navcom", "strategic", "intel"];
   *
   * 2) Wire behavior:
   *    - Add a button or other trigger that calls:
   *        core.state.actions.setMode("intel");
   *    - Update applyStyleProfileForMode(mode) if the mode has unique styling.
   *
   * 3) Verify:
   *    - Trigger the new mode and confirm:
   *      - No '[STATE] Attempt to set unknown mode' warnings.
   *      - The mode-specific behavior (panels, styles) activates as expected.
   *
   * HOW TO ADD A NEW PANEL (e.g. strategicOverview)
   * -----------------------------------------------
   * 1) Implement a factory function:
   *    - Signature: function StrategicOverviewPanel(core) { ... }
   *    - Return an object with mount(host) and unmount().
   *    - Use DM4 naming + text roles:
   *        root.classList.add("dm4-strategicOverview-root");
   *        titleEl.classList.add("dm4-strategicOverview-title", "dm-text-title");
   *        sectionHeader.classList.add("dm4-strategicOverview-section-title", "dm-text-header");
   *        lineEl.classList.add("dm4-strategicOverview-line", "dm-text-body");
   *
   * 2) Register it canonically in DM4_PANELS:
   *        DM4_PANELS.strategicOverview = {
   *          id: "strategicOverview",
   *          label: "Strategic Overview",
   *          factory: StrategicOverviewPanel,
   *          isCore: true
   *        };
   *
   * 3) Activate it from UI:
   *    - Call panelRegistry.activatePanel("strategicOverview") in response to a mode or button.
   *
   * 4) Verify:
   *    - No '[PANEL] Unknown panel id' warnings.
   *    - No '[PANEL] Activating non-core or legacy panel id' warnings.
   *    - No '[PANEL] ... missing text role class' warnings from assertPanelContract().
   *
   * HOW TO ADD NEW UTILITY / NON-PANEL CLASSES
   * ------------------------------------------
   * 1) Prefer namespaced classes:
   *    - Use prefixes 'dm-' or 'dm4-' for new components and utilities, e.g.:
   *        .dm-util-scroll-y { overflow-y: auto; }
   *
   * 2) If you must use standalone (non-namespaced) classes:
   *    - Add their names to DM4_ALLOWED_STANDALONE_CLASSES in this file, e.g.:
   *        const DM4_ALLOWED_STANDALONE_CLASSES = new Set(["active", "scroll-y"]);
   *
   * 3) Verify:
   *    - Load the viewer and check that runClassNamespaceChecks() does not log
   *      '[STYLE] Non-namespaced or unexpected class' warnings for the new classes.
   *
   * GENERAL RULE
   * ------------
   * - When introducing anything that looks like a new UI 'species' (new panel type,
   *   new mode, new text role, new utility family), update:
   *     - The relevant whitelist (DM4_MODES, DM4_PANELS, DM4_STYLE_CONTRACT, etc.)
   *     - The comments in this playbook if the process changes.
   */


  const DM4_DEBUG = !!(window.DM4 && window.DM4.config && window.DM4.config.debug);
  const DM4_BUNDLE_META = {
    viewerVersion: "4.0.0",
    protocolVersion: "1.2",
    bundleLabel: "FullSystem_WithProtocol",
    expectedDatasetVersion: "3.x",
    notes:
      "Guard rails, expansion playbooks, TOC, protocol v1.2, self-test, metadata, and integrity workflow."
  };



  const DM4_STYLE_CONTRACT = {
    requiredCssVars: [
      "--dm-text-title-color",
      "--dm-text-header-color",
      "--dm-text-body-color",
      "--dm-crimson-accent",
      "--dm-font-large",
      "--dm-font-medium",
      "--dm-font-small"
    ],
    allowedTextRoles: [
      "dm-text-title",
      "dm-text-header",
      "dm-text-body"
    ]
  };

  // DM4_CORE_FUNCTION: runStyleContractChecks

  function runStyleContractChecks() {
    try {
      const root = document.documentElement;
      const cs = getComputedStyle(root);

      DM4_STYLE_CONTRACT.requiredCssVars.forEach((name) => {
        const value = cs.getPropertyValue(name).trim();
        if (!value) {
          DM4.Logger.error("[STYLE] Missing required CSS variable:", name);
        }
      });
    } catch (err) {
      DM4.Logger.error("[STYLE] Failed to run style contract checks:", err);
    }
  }

  // DM4_CORE_FUNCTION: runDomStyleContractChecks

  function runDomStyleContractChecks() {
    if (!DM4_DEBUG) return;

    try {
      // 1) Inline styles are not allowed on UI elements
      document.querySelectorAll("[style]").forEach((el) => {
        DM4.Logger.warn("[STYLE] Inline style found on element:", el);
      });

      // 2) Unknown dm-text-* classes
      const allowed = new Set(DM4_STYLE_CONTRACT.allowedTextRoles);

      document.querySelectorAll("[class*='dm-text-']").forEach((el) => {
        el.classList.forEach((cls) => {
          if (cls.startsWith("dm-text-") && !allowed.has(cls)) {
            DM4.Logger.warn("[STYLE] Unknown text role class '" + cls + "' on element:", el);
          }
        });
      });
    } catch (err) {
      DM4.Logger.error("[STYLE] Failed to run DOM style contract checks:", err);
    }
  }

  const DM4_CORE_FUNCTIONS = ["IdentityPanel",
"TestPanel",
"createPanelRegistry",
"bootstrapViewer"
];

  // DM4_HELPER_FUNCTION: logCoreFunctionPresence

  function logCoreFunctionPresence() {
    if (!DM4_DEBUG) return;
    try {
      DM4.Logger.log("[CORE] Expected core functions:", DM4_CORE_FUNCTIONS.join(", "));
    } catch (err) {
      DM4.Logger.error("[CORE] Failed to log core functions:", err);
    }
  }



  

  

  /**
   * DM4 CORE MODES & CLASS NAMESPACE CONTRACT
   */
  const DM4_MODES = ["navcom", "strategic"];

  const DM4_ALLOWED_CLASS_PREFIXES = ["dm-", "dm4-"];
  const DM4_ALLOWED_STANDALONE_CLASSES = new Set(["active"]);

  // DM4_HELPER_FUNCTION: isKnownMode

  function isKnownMode(mode) {
    return DM4_MODES.indexOf(mode) !== -1;
  }

  // Panel knowledge is defined via DM4_PANELS / DM4_PANEL_IDS later in this file.
  // DM4_HELPER_FUNCTION: isKnownPanel
  function isKnownPanel(id) {
    return typeof DM4_PANEL_IDS !== "undefined" && DM4_PANEL_IDS.indexOf(id) !== -1;
  }

  // DM4_HELPER_FUNCTION: runClassNamespaceChecks

  function runClassNamespaceChecks() {
    if (!DM4_DEBUG) return;
    try {
      document.querySelectorAll("[class]").forEach(function (el) {
        el.classList.forEach(function (cls) {
          const hasAllowedPrefix = DM4_ALLOWED_CLASS_PREFIXES.some(function (prefix) {
            return cls.startsWith(prefix);
          });
          if (!hasAllowedPrefix && !DM4_ALLOWED_STANDALONE_CLASSES.has(cls)) {
            DM4.Logger.warn("[STYLE] Non-namespaced or unexpected class detected:", cls, "on element:", el);
          }
        });
      });
    } catch (err) {
      DM4.Logger.error("[STYLE] Failed to run class namespace checks:", err);
    }
  }

/***********************
   * 1) CONFIG DEFAULTS
   ***********************/
  const DM4_DEFAULT_CONFIG = {
    mapWidth: 4096,
    mapHeight: 4096
  };

const DM_STRINGS = {

  identity: {
    placeholder: "Select a system glyph to load system data.",
    notFound: "System not found in dataset.",
  },
  navcom: {
    placeholder: "Select a system glyph to inspect nav data.",
    notFound: "System not found in dataset.",
    headings: {
      routeConnectivity: "ROUTE CONNECTIVITY",
      networkProfile: "NETWORK PROFILE",
      strategicDistances: "STRATEGIC DISTANCES",
      datasetIntegrity: "DATASET INTEGRITY",
    },
  },
  status: {
    datasetOnline: (version) => "Dataset online (" + version + ").",
    onlineWithWarnings: (version, problems) =>
      "Online with warnings (" + version + "): " + problems.join(", "),
    panelHealthWarning: (message) => "Panel health warning: " + message,
    panelRenderError: (message) => "Panel render error: " + message,
    healthCheckError: (version, message) =>
      "Health check error (" + version + "): " + message,
  },
};


const DM4_STYLE_PROFILES = {
  navcom: "dm-style-palette-e2.css",
  strategic: "dm-style-palette-e2.css",
  intel: "dm-style-palette-e2.css",
  command: "dm-style-palette-e2.css"
};

// DM4_CORE_FUNCTION: applyStyleProfileForMode

function applyStyleProfileForMode(mode) {
  const linkId = "dm-style-profile";
  const href = DM4_STYLE_PROFILES[mode] || DM4_STYLE_PROFILES.navcom;
  if (!href) return;
  let linkEl = document.getElementById(linkId);
  if (!linkEl) {
    linkEl = document.createElement("link");
    linkEl.id = linkId;
    linkEl.rel = "stylesheet";
    document.head.appendChild(linkEl);
  }
  if (linkEl.getAttribute("href") !== href) {
    linkEl.setAttribute("href", href);
  }
}


  /******************************
   * 2) DATASET NORMALIZER
   ******************************/
  // DM4_CORE_FUNCTION: normalizeDataset
  function normalizeDataset(raw) {
    if (!raw || typeof raw !== "object") {
      DM4.Logger.warn("normalizeDataset: empty or invalid raw dataset");
      return { systems: {} };
    }

    const systemsSrc = raw.systems || {};
    const pixelsSrc = raw.system_pixels || raw.endpoint_pixels || {};
    const gridSrc = raw.system_grid || {};
    const sectorsSrc = raw.sectors || {};

    const sectorBySystem = {};
    Object.entries(sectorsSrc).forEach(function ([sectorName, systemList]) {
      (systemList || []).forEach(function (sysId) {
        sectorBySystem[sysId] = sectorName;
      });
    });

    const normalizedSystems = {};

    Object.entries(systemsSrc).forEach(function ([id, sys]) {
      const base = sys || {};

      let coords = base.coords;
      if (!coords && pixelsSrc && pixelsSrc[id]) {
        coords = pixelsSrc[id];
      }

      let grid = base.grid;
      if (!grid && gridSrc && gridSrc[id]) {
        grid = gridSrc[id];
      }

      let sector = base.sector;
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

  /***********************
   * 3) STATE MANAGER
   ***********************/
  // DM4_CORE_FUNCTION: createStateManager
  function createStateManager(config, dataset, campaign) {
    let subscribers = [];

    let state = {
      config: config || {},
      dataset: dataset || { systems: {} },
      campaign: campaign || {
        factions: [],
        systemControl: [],
        actors: [],
        assetRequests: [],
        budgets: { players: {} },
        actorTypes: [],
        assetCatalog: []
      },
      access: {
        tier: "viewer",
        playerId: null,
        factions: [],
        capabilities: {
          canEditOwnActors: false,
          canEditFactionActors: false,
          canEditSystemControl: false,
          canSeeGmOnly: false
        }
      },
      selection: {
        system: null
      },
      mode: "navcom",
      editor: {
        enabled: false,
        jobs: []
      }
    };

    // DM4_HELPER_FUNCTION: getState

    function getState() {
      return state;
    }

    // DM4_HELPER_FUNCTION: notifySubscribers

    function notifySubscribers() {
      const snapshot = state;
      subscribers.forEach(function (fn) {
        fn(snapshot);
      });
    }

    // DM4_HELPER_FUNCTION: subscribe

    function subscribe(fn) {
      subscribers.push(fn);
      fn(state);
      return function () {
        subscribers = subscribers.filter(function (s) {
          return s !== fn;
        });
      };
    }

    const actions = {
      selectSystem: function (systemId) {
        state = Object.assign({}, state, {
          selection: Object.assign({}, state.selection, {
            system: systemId
          })
        });
        notifySubscribers();
      },

      setMode: function (mode) {
        if (!isKnownMode(mode)) {
          if (DM4_DEBUG) {
            DM4.Logger.warn("[STATE] Attempt to set unknown mode:", mode);
          }
          return;
        }
        state = Object.assign({}, state, { mode: mode });
        notifySubscribers();
      },

      setDataset: function (newDataset) {
        state = Object.assign({}, state, {
          dataset: newDataset || { systems: {} }
        });
        notifySubscribers();
      },

      setCampaign: function (newCampaign) {
        state = Object.assign({}, state, {
          campaign: newCampaign || state.campaign
        });
        notifySubscribers();
      },

      setAccess: function (partial) {
        state = Object.assign({}, state, {
          access: Object.assign({}, state.access, partial)
        });
        notifySubscribers();
      },

      setEditorEnabled: function (enabled) {
        const current = state.editor || { enabled: false, jobs: [] };
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { enabled: !!enabled })
        });
        notifySubscribers();
      },

      addEditorJob: function (job) {
        const current = state.editor || { enabled: false, jobs: [] };
        const jobs = (current.jobs || []).concat(job || {});
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { jobs: jobs })
        });
        notifySubscribers();
      },

      clearEditorJobs: function () {
        const current = state.editor || { enabled: false, jobs: [] };
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { jobs: [] })
        });
        notifySubscribers();
      }
    };

    return { getState: getState, subscribe: subscribe, actions: actions };
  }

  /****************************************
   * 4) MAP: SYSTEM MARKERS & ROUTE LAYER
   ****************************************/
  // DM4_CORE_FUNCTION: createSystemMarkersLayer
  function createSystemMarkersLayer(core) {
    const state = core.state;
    const container = document.createElement("div");
    container.classList.add("dm-layer-systems");

    const markerById = new Map();
    let unsubscribe = null;

    // DM4_HELPER_FUNCTION: buildMarkers

    function buildMarkers(dataset) {
      container.innerHTML = "";
      markerById.clear();

      const systems = dataset.systems || {};

      Object.entries(systems).forEach(function ([id, sys]) {
        const marker = document.createElement("div");
        marker.classList.add("dm-system-marker");
        marker.dataset.systemId = id;

        const coords = sys.coords || [];
        const x = coords[0];
        const y = coords[1];

        if (typeof x !== "number" || typeof y !== "number") {
          DM4.Logger.warn("Missing coords for system:", id);
          return;
        }

        marker.style.left = x + "px";
        marker.style.top = y + "px";
        marker.title = id;

        marker.addEventListener("click", function (e) {
          e.stopPropagation();
          core.state.actions.selectSystem(id);

          try {
            var st = core.state.getState();
            if (
              st &&
              st.editor &&
              st.editor.enabled &&
              core.panelRegistry &&
              typeof core.panelRegistry.activatePanel === "function"
            ) {
              core.panelRegistry.activatePanel("editor");
            }
          } catch (err) {
            DM4.Logger.warn("[EDITOR] Failed to activate editor panel on system click:", err);
          }
        });

        container.appendChild(marker);
        markerById.set(id, marker);
      });

    }

    // DM4_HELPER_FUNCTION: renderSelection

    function renderSelection(st) {
      const selected = (st.selection && st.selection.system) || null;
      markerById.forEach(function (marker, id) {
        marker.classList.toggle("dm-system-selected", id === selected);
      });
    }

    buildMarkers(core.state.getState().dataset);

    unsubscribe = state.subscribe(function (st) {
      renderSelection(st);
    });

    return {
      element: container,
      destroy: function () {
        if (unsubscribe) unsubscribe();
      }
    };
  }

// DM4_CORE_FUNCTION: createSystemLabelsLayer

function createSystemLabelsLayer(core) {
  const state = core.state;
  const container = document.createElement("div");
  container.classList.add("dm-layer-labels");

  const labelById = new Map();
  let unsubscribe = null;

  // DM4_HELPER_FUNCTION: buildLabels

  function buildLabels(dataset) {
    container.innerHTML = "";
    labelById.clear();

    const systems = dataset.systems || {};

    Object.entries(systems).forEach(function ([id, sys]) {
      const coords = sys.coords || [];
      const x = coords[0];
      const y = coords[1];

      if (typeof x !== "number" || typeof y !== "number") {
        DM4.Logger.warn("Missing coords for system (label):", id);
        return;
      }

      const label = document.createElement("div");
      label.classList.add("dm-system-label");
      label.textContent = id;

      // Offset label a bit from the marker so it doesn't overlap
      label.style.left = (x + 9) + "px";
      label.style.top = (y - 8) + "px";

      // Allow selecting systems by clicking the label
      label.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (state && state.actions && typeof state.actions.selectSystem === "function") {
          state.actions.selectSystem(id);
        }
      });

      container.appendChild(label);
      labelById.set(id, label);
    });
  }

  // DM4_HELPER_FUNCTION: renderSelection

  function renderSelection(st) {
    const selected = (st.selection && st.selection.system) || null;
    labelById.forEach(function (label, id) {
      label.classList.toggle("dm-system-label-selected", id === selected);
    });
  }

  buildLabels(state.getState().dataset);
  unsubscribe = state.subscribe(function (st) {
    renderSelection(st);
  });

  return {
    element: container,
    destroy: function () {
      if (unsubscribe) unsubscribe();
    }
  };
}


// DM4_CORE_FUNCTION: createRouteLayer


function createRouteLayer(core) {
  const svgNS = "http://www.w3.org/2000/svg";
  const config = core.config || {};
  const width = config.mapWidth || 4096;
  const height = config.mapHeight || 4096;

  const state = core.state;
  const dataset = state.getState().dataset || {};
  const hyperlanes = dataset.hyperlanes || {};
  const routeMeta = dataset.route_metadata || {};
  const systems = dataset.systems || {};
  const endpoints = dataset.endpoint_pixels || {};

  const endpointMeta = dataset.endpoint_metadata || {};

  // DM4_HELPER_FUNCTION: buildRouteEdgeMarkers
  function buildRouteEdgeMarkers() {
    const markers = [];
    Object.keys(endpoints).forEach(function (id) {
      const meta = endpointMeta[id];
      if (!meta || meta.role !== "synthetic_edge") return;

      const coords = endpoints[id];
      if (!Array.isArray(coords) || coords.length < 2) return;

      const routeId = meta.route_id;
      if (!routeId) return;

      const rMeta = routeMeta[routeId] || {};
      const routeClass = rMeta.route_class || "minor";
      if (routeClass === "minor") return;

      let outward = meta.outward_vector || [0, 0];
      let outX = outward[0] || 0;
      let outY = outward[1] || 0;

      // Normalize to a simple cardinal direction
      if (Math.abs(outX) >= Math.abs(outY)) {
        outY = 0;
        outX = outX >= 0 ? 1 : -1;
      } else {
        outX = 0;
        outY = outY >= 0 ? 1 : -1;
      }

      markers.push({
        id: id,
        routeId: routeId,
        routeClass: routeClass,
        x: coords[0],
        y: coords[1],
        outwardX: outX,
        outwardY: outY
      });
    });
    return markers;
  }


  // DM4_HELPER_FUNCTION: getPointCoords

  function getPointCoords(id) {
    const sys = systems[id];
    if (sys && Array.isArray(sys.coords) && sys.coords.length >= 2) {
      return sys.coords;
    }
    if (endpoints && Array.isArray(endpoints[id])) {
      return endpoints[id];
    }
    DM4.Logger.warn("Missing coords for route endpoint:", id);
    return null;
  }

  const svg = document.createElementNS(svgNS, "svg");
  svg.classList.add("dm-layer-routes");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", "0 0 " + width + " " + height);

  const allLines = [];
  const linesBySystem = new Map();

  // DM4_HELPER_FUNCTION: registerLine

  function registerLine(line, from, to) {
    allLines.push(line);
    [from, to].forEach(function (id) {
      if (!id) return;
      const list = linesBySystem.get(id) || [];
      list.push(line);
      linesBySystem.set(id, list);
    });
  }

  Object.keys(hyperlanes).forEach(function (routeName) {
    if (routeName === "minor_routes") return;

    const segments = hyperlanes[routeName] || [];
    const meta = routeMeta[routeName] || {};
    const cls = meta.route_class === "major" ? "route-major" : "route-medium";

    segments.forEach(function (pair) {
      if (!Array.isArray(pair) || pair.length < 2) return;
      const from = pair[0];
      const to = pair[1];

      const fromCoords = getPointCoords(from);
      const toCoords = getPointCoords(to);
      if (!fromCoords || !toCoords) return;

      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", fromCoords[0]);
      line.setAttribute("y1", fromCoords[1]);
      line.setAttribute("x2", toCoords[0]);
      line.setAttribute("y2", toCoords[1]);

      line.setAttribute("class", cls);
      line.setAttribute("data-route-name", routeName);
      line.setAttribute("data-from", from);
      line.setAttribute("data-to", to);

      svg.appendChild(line);
      registerLine(line, from, to);
    });
  });

  const minorList = hyperlanes.minor_routes || [];
  minorList.forEach(function (pair) {
    if (!Array.isArray(pair) || pair.length < 2) return;
    const from = pair[0];
    const to = pair[1];

    const fromCoords = getPointCoords(from);
    const toCoords = getPointCoords(to);
    if (!fromCoords || !toCoords) return;

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", fromCoords[0]);
    line.setAttribute("y1", fromCoords[1]);
    line.setAttribute("x2", toCoords[0]);
    line.setAttribute("y2", toCoords[1]);

    line.setAttribute("class", "route-minor");
    line.setAttribute("data-route-name", "minor_routes");
    line.setAttribute("data-from", from);
    line.setAttribute("data-to", to);

    svg.appendChild(line);
    registerLine(line, from, to);
  });


  const edgeMarkers = buildRouteEdgeMarkers();
  if (edgeMarkers && edgeMarkers.length) {
    const edgesGroup = document.createElementNS(svgNS, "g");
    edgesGroup.setAttribute("class", "dm4-routes-edges");

    edgeMarkers.forEach(function (m) {
      const size = 14;
      const x = m.x;
      const y = m.y;

      const arrow = document.createElementNS(svgNS, "path");
      arrow.setAttribute("class", "dm4-route-endpoint-arrow route-" + m.routeClass);
      arrow.setAttribute(
        "d",
        "M " + (x - size / 2) + " " + (y + size / 2) +
          " L " + (x + size / 2) + " " + (y + size / 2) +
          " L " + x + " " + (y - size / 2) + " Z"
      );

      let angle = 0;
      if (m.outwardX === 0 && m.outwardY > 0) {
        angle = 90;
      } else if (m.outwardX === 0 && m.outwardY < 0) {
        angle = -90;
      } else if (m.outwardX > 0 && m.outwardY === 0) {
        angle = 0;
      } else if (m.outwardX < 0 && m.outwardY === 0) {
        angle = 180;
      }

      arrow.setAttribute("transform", "rotate(" + angle + " " + x + " " + y + ")");

      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("class", "dm4-route-endpoint-label dm-text-body");
      label.textContent = m.routeId;

      const labelOffset = 18;
      let lx = x;
      let ly = y;

      if (m.outwardY > 0) ly += labelOffset;
      if (m.outwardY < 0) ly -= labelOffset;
      if (m.outwardX > 0) lx += labelOffset;
      if (m.outwardX < 0) lx -= labelOffset;

      label.setAttribute("x", lx);
      label.setAttribute("y", ly);

      edgesGroup.appendChild(arrow);
      edgesGroup.appendChild(label);
    });

    svg.appendChild(edgesGroup);
  }

  // DM4_HELPER_FUNCTION: renderSelection

  function renderSelection(st) {
    const selected = (st.selection && st.selection.system) || null;

    // Clear all selection styling
    allLines.forEach(function (line) {
      line.classList.remove("dm-route-selected");
    });

    if (!selected) return;

    const list = linesBySystem.get(selected);
    if (!list || !list.length) return;

    list.forEach(function (line) {
      line.classList.add("dm-route-selected");
    });
  }

  const unsubscribe = state.subscribe(function (st) {
    renderSelection(st);
  });

  // Initial render
  renderSelection(state.getState());

  return {
    element: svg,
    destroy: function () {
      if (unsubscribe) unsubscribe();
    }
  };
}


/*********************************
 * 5) MAP LAYER WITH DATA-BOUNDS CAMERA
 *********************************/
// DM4_CORE_FUNCTION: initMapLayer
function initMapLayer(core, root) {
  const mapContainer = document.createElement("div");
  mapContainer.classList.add("dm-map-container");

  const viewport = document.createElement("div");
  viewport.classList.add("dm-map-viewport");

  const routeLayer = createRouteLayer(core);
  const systemsLayer = createSystemMarkersLayer(core);
  const labelsLayer = createSystemLabelsLayer(core);

  viewport.appendChild(routeLayer.element);
  viewport.appendChild(systemsLayer.element);
  viewport.appendChild(labelsLayer.element);

  mapContainer.appendChild(viewport);
  root.appendChild(mapContainer);

  const dataset = core.state.getState().dataset || {};
  const systems = dataset.systems || {};
  const endpoints = dataset.endpoint_pixels || {};

  // Compute data bounds (systems + endpoints)
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  Object.values(systems).forEach(function (sys) {
    if (!sys || !Array.isArray(sys.coords)) return;
    const x = sys.coords[0];
    const y = sys.coords[1];
    if (typeof x !== "number" || typeof y !== "number") return;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });

  Object.values(endpoints).forEach(function (pt) {
    if (!Array.isArray(pt)) return;
    const x = pt[0];
    const y = pt[1];
    if (typeof x !== "number" || typeof y !== "number") return;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    // Fallback: just treat 0..4096 as world
    minX = 0;
    minY = 0;
    maxX = core.config.mapWidth || 4096;
    maxY = core.config.mapHeight || 4096;
  }

  const padding = 50;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const worldWidth = maxX - minX;
  const worldHeight = maxY - minY;

  let zoom = 1;
  let translateX = 0;
  let translateY = 0;

  let minZoom = 0.1;
  const maxZoom = 5;

  // DM4_HELPER_FUNCTION: clampAndApply

  function clampAndApply() {
    const cw = mapContainer.clientWidth || 1;
    const ch = mapContainer.clientHeight || 1;

    // Convert current translate/zoom into world-space viewport
    const worldLeft = (0 - translateX) / zoom;
    const worldTop = (0 - translateY) / zoom;
    const worldRight = worldLeft + cw / zoom;
    const worldBottom = worldTop + ch / zoom;

    // Camera bounds in world space
    const worldMinX = minX;
    const worldMinY = minY;

    // Allow a small extra pan buffer on the right side only
    const extraPanRight = 150; // world-space units (pixels)
    const worldMaxX = minX + worldWidth + extraPanRight;
    const worldMaxY = minY + worldHeight;

    // Clamp horizontally
    let newWorldLeft = worldLeft;
    let newWorldRight = worldRight;

    if (worldWidth <= cw / zoom) {
      // World smaller than viewport: center it
      newWorldLeft = worldMinX - (cw / zoom - worldWidth) / 2;
    } else {
      if (worldLeft < worldMinX) {
        newWorldLeft = worldMinX;
      } else if (worldRight > worldMaxX) {
        newWorldLeft = worldMaxX - cw / zoom;
      }
    }
    newWorldRight = newWorldLeft + cw / zoom;

    // Clamp vertically
    let newWorldTop = worldTop;
    let newWorldBottom = worldBottom;

    if (worldHeight <= ch / zoom) {
      newWorldTop = worldMinY - (ch / zoom - worldHeight) / 2;
    } else {
      if (worldTop < worldMinY) {
        newWorldTop = worldMinY;
      } else if (worldBottom > worldMaxY) {
        newWorldTop = worldMaxY - ch / zoom;
      }
    }
    newWorldBottom = newWorldTop + ch / zoom;

    // Convert back to translate
    translateX = -newWorldLeft * zoom;
    translateY = -newWorldTop * zoom;

    viewport.style.transform =
      "translate(" + translateX + "px," + translateY + "px) scale(" + zoom + ")";
  }

  // DM4_HELPER_FUNCTION: resetViewToDataBounds

  function resetViewToDataBounds() {
    const cw = mapContainer.clientWidth || 1;
    const ch = mapContainer.clientHeight || 1;

    if (cw <= 0 || ch <= 0) return;

    // Compute zoom so that world bounds fit in viewport
    const zoomX = cw / worldWidth;
    const zoomY = ch / worldHeight;
    const fitZoom = Math.min(zoomX, zoomY);

    // Lock minimum zoom (maximum zoom-out) to the data-bounds fit
    minZoom = fitZoom;

    // Start from the fitted zoom level
    zoom = fitZoom;

    // Respect global limits
    if (zoom < minZoom) zoom = minZoom;
    if (zoom > maxZoom) zoom = maxZoom;

    // Center camera on world bounds center
    const centerX = minX + worldWidth / 2;
    const centerY = minY + worldHeight / 2;

    translateX = cw / 2 - centerX * zoom;
    translateY = ch / 2 - centerY * zoom;

    clampAndApply();
  }

  // DM4_HELPER_FUNCTION: initialApply

  function initialApply() {
    resetViewToDataBounds();
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(initialApply, 0);
  } else {
    window.addEventListener("load", initialApply, { once: true });
  }

  // DM4_HELPER_FUNCTION: handleResize

  function handleResize() {
    resetViewToDataBounds();
  }
  window.addEventListener("resize", handleResize);

  // Panning
  let isPanning = false;
  let hasDragged = false;
  let startX = 0;
  let startY = 0;
  let startTX = 0;
  let startTY = 0;

  mapContainer.addEventListener("mousedown", function (e) {
    if (e.button !== 0) return;
    isPanning = true;
    hasDragged = false;
    startX = e.clientX;
    startY = e.clientY;
    startTX = translateX;
    startTY = translateY;
    mapContainer.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", function (e) {
    if (!isPanning) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasDragged = true;
    }
    translateX = startTX + dx;
    translateY = startTY + dy;
    clampAndApply();
  });

  window.addEventListener("mouseup", function () {
    if (isPanning) {
      isPanning = false;
      mapContainer.style.cursor = "grab";
    }
  });

  mapContainer.addEventListener("mouseleave", function () {
    if (isPanning) {
      isPanning = false;
      mapContainer.style.cursor = "grab";
    }
  });

  mapContainer.addEventListener("click", function (e) {
    // Ignore synthetic clicks following a drag
    if (hasDragged) {
      hasDragged = false;
      return;
    }

    // Ctrl+click: copy parsec/pixel coordinates and update top bar readout
    if (e.ctrlKey || e.metaKey) {
      const rect = mapContainer.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      const worldX = (cx - translateX) / zoom;
      const worldY = (cy - translateY) / zoom;
      const px = Math.round(worldX);
      const py = Math.round(worldY);
      const coordText = px + "," + py;

      if (core && core.topBarCoords) {
        core.topBarCoords.textContent = "Parsec Coordinates: " + coordText;
      }

      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(coordText).catch(function (err) {
          DM4.Logger.warn("Clipboard write failed:", err);
        });
      }

      // Do not change selection on a coord copy click
      return;
    }

    const target = e.target;
    if (target && typeof target.closest === "function") {
      if (target.closest(".dm-system-marker") || target.closest(".dm-system-label")) {
        return;
      }
    }
    if (core && core.state && core.state.actions && typeof core.state.actions.selectSystem === "function") {
      core.state.actions.selectSystem(null);
    }
  });

// Zooming
  mapContainer.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      const rect = mapContainer.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      const worldX = (cx - translateX) / zoom;
      const worldY = (cy - translateY) / zoom;

      const zoomFactor = 1 - e.deltaY * 0.001;
      let newZoom = zoom * zoomFactor;
      if (newZoom < minZoom) newZoom = minZoom;
      if (newZoom > maxZoom) newZoom = maxZoom;
      zoom = newZoom;

      translateX = cx - worldX * zoom;
      translateY = cy - worldY * zoom;

      clampAndApply();
    },
    { passive: false }
  );

  return {
    destroy: function () {
      systemsLayer.destroy();
      routeLayer.destroy();
      labelsLayer.destroy();
      window.removeEventListener("resize", handleResize);
      if (mapContainer.parentNode) {
        root.removeChild(mapContainer);
      }
    }
  };
}

/***************************
   * 6) PANELS: IDENTITY
   ***************************/
  // DM4_CORE_FUNCTION: IdentityPanel
  // DM4_CORE_FUNCTION: IdentityPanel
  function IdentityPanel(core) {
    if (typeof DM4 !== "undefined" &&
        DM4.panels &&
        typeof DM4.panels.IdentityPanel === "function") {
      return DM4.panels.IdentityPanel(core);
    }
    DM4.Logger.error("[PANELS] DM4.panels.IdentityPanel is not available.");
    return null;
  }



  /***************************
   * 6b) PANEL: TEST PANEL
   * DM4 CORE MODULE: Test panel blueprint & contract verifier
   ***************************/
  // DM4_CORE_FUNCTION: TestPanel
  // DM4_CORE_FUNCTION: TestPanel
  function TestPanel(core) {
    if (typeof DM4 !== "undefined" &&
        DM4.panels &&
        typeof DM4.panels.TestPanel === "function") {
      return DM4.panels.TestPanel(core);
    }
    DM4.Logger.error("[PANELS] DM4.panels.TestPanel is not available.");
    return null;
  }





  
  /***************************
   * 6c) PANEL: DATASET EDITOR
   * DM4 CORE MODULE: Dataset editor panel blueprint (v1)
   ****************************/
  function EditorPanel(core) {
    const state = core.state;

    const root = document.createElement("div");
    root.classList.add("dm4-editor-root");

    const inner = document.createElement("div");
    inner.classList.add("dm4-editor-inner");
    root.appendChild(inner);

    // Title – uses dm-text-title
    const titleEl = document.createElement("h2");
    titleEl.classList.add("dm4-editor-title", "dm-text-title");
    titleEl.textContent = "DATASET EDITOR";
    inner.appendChild(titleEl);

    // Editor mode status line
    const modeLine = document.createElement("div");
    modeLine.classList.add("dm4-editor-line", "dm-text-header");
    inner.appendChild(modeLine);

    // System / sector section
    const sysSectionTitle = document.createElement("div");
    sysSectionTitle.classList.add("dm4-editor-section-title", "dm-text-header");
    sysSectionTitle.textContent = "SYSTEM & SECTOR";
    inner.appendChild(sysSectionTitle);

    const sysContent = document.createElement("div");
    sysContent.classList.add("dm4-editor-section");
    inner.appendChild(sysContent);

    // Pending edits section
    const jobsSectionTitle = document.createElement("div");
    jobsSectionTitle.classList.add("dm4-editor-section-title", "dm-text-header");
    jobsSectionTitle.textContent = "PENDING EDITS";
    inner.appendChild(jobsSectionTitle);

    const jobsContent = document.createElement("div");
    jobsContent.classList.add("dm4-editor-section");
    inner.appendChild(jobsContent);

    // Small helper: derive current dataset id (for job tagging)
    function getCurrentDatasetId() {
      try {
        if (typeof window !== "undefined" && window.DM4_CURRENT_DATASET_ID) {
          return window.DM4_CURRENT_DATASET_ID;
        }
      } catch (e) {
        // ignore, fall through to default
      }
      return "main";
    }

    // Small helper: summarise jobs for display
    function describeJob(job) {
      if (!job || typeof job !== "object") return "(invalid job)";
      var t = job.op_type || job.type || "unknown";
      var target = job.target_dataset || job.dataset || getCurrentDatasetId();
      var payload = job.payload || {};
      if (t === "change_sector") {
        var sid = payload.system_id || "?";
        var oldS = payload.old_sector_id || payload.oldSector || "?";
        var newS = payload.new_sector_id || payload.newSector || "?";
        return "[" + target + "] change_sector: " + sid + " " + oldS + " → " + newS;
      }
      return "[" + target + "] " + t;
    }

    
    // DB5 patch processor (in-viewer, strict)
    function dm4ValidateDb5Structure(db5) {
      if (!db5 || typeof db5 !== "object" || !db5.systems || typeof db5.systems !== "object") {
        throw new Error("DB5 file does not contain a 'systems' object at the top level.");
      }
    }

    function dm4ApplyChangeSector(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var systemId = payload.system_id;
      var oldSector = payload.old_sector_id;
      var newSector = payload.new_sector_id;

      if (!systemId) {
        var msg = "change_sector job missing system_id";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      var systems = db5.systems || {};
      if (!systems[systemId]) {
        var notFoundMsg = "System '" + systemId + "' not found in DB5; cannot change sector.";
        if (strict) throw new Error(notFoundMsg);
        return { applied: false, message: notFoundMsg };
      }

      var sysEntry = systems[systemId];
      var currentSector = sysEntry.sector;

      if (oldSector != null && currentSector !== oldSector) {
        var mismatchMsg =
          "Sector mismatch for '" +
          systemId +
          "': job expects '" +
          oldSector +
          "', DB5 has '" +
          currentSector +
          "'. No change applied.";
        if (strict) throw new Error(mismatchMsg);
        return { applied: false, message: mismatchMsg };
      }

      sysEntry.sector = newSector;

      return {
        applied: true,
        message:
          "System '" + systemId + "': sector '" + currentSector + "' -> '" + newSector + "'"
      };
    }

    function dm4ApplyEditorJobToDb5(db5, job, strict) {
      var opType = job.op_type || job.type;
      if (opType === "change_sector") {
        return dm4ApplyChangeSector(db5, job, strict);
      }
      var msg = "Unsupported op_type '" + opType + "'. Job skipped.";
      if (strict) throw new Error(msg);
      return { applied: false, message: msg };
    }

    function dm4FilterJobsForDataset(jobs, datasetId) {
      var targetId = datasetId || getCurrentDatasetId() || "main";
      return (jobs || []).filter(function (job) {
        var target = job.target_dataset || job.dataset || targetId;
        return target === targetId;
      });
    }

    function dm4ApplyJobsToDb5(db5, jobs, datasetId, strict) {
      if (strict === undefined) strict = true;
      dm4ValidateDb5Structure(db5);
      var allJobs = jobs || [];
      var applicable = dm4FilterJobsForDataset(allJobs, datasetId);
      var logs = [];
      logs.push(
        "Jobs total: " +
          allJobs.length +
          "; applicable to dataset '" +
          (datasetId || getCurrentDatasetId() || "main") +
          "': " +
          applicable.length
      );

      for (var i = 0; i < applicable.length; i++) {
        var job = applicable[i];
        try {
          var result = dm4ApplyEditorJobToDb5(db5, job, strict);
          logs.push("[job " + (i + 1) + "] " + result.message);
        } catch (e) {
          logs.push("[job " + (i + 1) + " ERROR] " + (e && e.message ? e.message : String(e)));
          if (strict) {
            throw e;
          }
        }
      }

      return logs;
    }

// Export helper
    function exportJobs(jobs) {
      try {
        var data = {
          dataset_id: getCurrentDatasetId(),
          generated_at: new Date().toISOString(),
          jobs: jobs || []
        };
        var json = JSON.stringify(data, null, 2);
        var blob = new Blob([json], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        var ts = new Date();
        var stamp =
          ts.getFullYear().toString() +
          String(ts.getMonth() + 1).padStart(2, "0") +
          String(ts.getDate()).padStart(2, "0") +
          "_" +
          String(ts.getHours()).padStart(2, "0") +
          String(ts.getMinutes()).padStart(2, "0");
        a.href = url;
        a.download = "DB5_EditorJobs_" + stamp + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 0);
      } catch (e) {
        DM4.Logger.error("[EDITOR] Failed to export jobs:", e);
      }
    }

    // Reactive render
    function render(st) {
      var editorState = st.editor || { enabled: false, jobs: [] };
      var editorOn = !!editorState.enabled;
      var jobs = editorState.jobs || [];

      modeLine.textContent = editorOn ? "EDITOR MODE: ON" : "EDITOR MODE: OFF";

      var dataset = st.dataset || {};
      var systems = dataset.systems || {};
      var selId = st.selection && st.selection.system;

      // Build a sector list from current dataset (unique, sorted)
      var sectorSet = {};
      Object.keys(systems).forEach(function (id) {
        var s = systems[id];
        var sec = s && s.sector;
        if (sec && typeof sec === "string") {
          sectorSet[sec] = true;
        }
      });
      var sectorList = Object.keys(sectorSet).sort();

      // Find latest pending sector change for selected system, if any
      var pendingSector = null;
      if (selId) {
        for (var i = jobs.length - 1; i >= 0; i--) {
          var j = jobs[i];
          if (
            j &&
            j.op_type === "change_sector" &&
            j.payload &&
            j.payload.system_id === selId
          ) {
            pendingSector =
              j.payload.new_sector_id || j.payload.newSector || null;
            break;
          }
        }
      }

      // SYSTEM SECTION
      sysContent.innerHTML = "";

      if (!selId || !systems[selId]) {
        var noSel = document.createElement("div");
        noSel.classList.add("dm4-editor-line", "dm-text-body");
        noSel.textContent = "No system selected. Click a system marker to begin.";
        sysContent.appendChild(noSel);
      } else {
        var sys = systems[selId];
        var name = sys.name || selId;
        var sector = sys.sector || "Unknown Sector";
        var grid = (sys.grid && sys.grid.grid) || "UNSPECIFIED";

        var headerLine = document.createElement("div");
        headerLine.classList.add("dm4-editor-line", "dm-text-body");
        headerLine.textContent = "System: " + name + " (" + selId + ")";
        sysContent.appendChild(headerLine);

        var gridLine = document.createElement("div");
        gridLine.classList.add("dm4-editor-line", "dm-text-body");
        gridLine.textContent = "Grid: " + grid;
        sysContent.appendChild(gridLine);

        var sectorLine = document.createElement("div");
        sectorLine.classList.add("dm4-editor-line", "dm-text-body");
        sectorLine.textContent = "Sector: ";
        sysContent.appendChild(sectorLine);

        var sectorSelect = document.createElement("select");
        sectorSelect.classList.add("dm4-editor-select");
        // Current sector first so it is always available even if not in sectorList
        var seen = {};
        function addOption(label) {
          if (!label || seen[label]) return;
          var opt = document.createElement("option");
          opt.value = label;
          opt.textContent = label;
          sectorSelect.appendChild(opt);
          seen[label] = true;
        }
        addOption(sector);
        sectorList.forEach(function (secName) {
          addOption(secName);
        });
        sectorSelect.value = sector;
        sectorLine.appendChild(sectorSelect);

        if (pendingSector && pendingSector !== sector) {
          var pendingLine = document.createElement("div");
          pendingLine.classList.add("dm4-editor-line", "dm-text-body");
          pendingLine.textContent = "Pending sector: " + pendingSector;
          sysContent.appendChild(pendingLine);
        }

        var controlsLine = document.createElement("div");
        controlsLine.classList.add("dm4-editor-line", "dm-text-body");
        sysContent.appendChild(controlsLine);

        var applyBtn = document.createElement("button");
        applyBtn.type = "button";
        applyBtn.textContent = "Reassign Sector";
        applyBtn.classList.add("dm4-editor-button");
        controlsLine.appendChild(applyBtn);

        applyBtn.addEventListener("click", function () {
          var newSector = sectorSelect.value || "";
          if (!newSector || newSector === sector) {
            return;
          }
          var datasetId = getCurrentDatasetId();
          var job = {
            target_dataset: datasetId,
            op_type: "change_sector",
            payload: {
              system_id: selId,
              old_sector_id: sector,
              new_sector_id: newSector
            },
            created_at: new Date().toISOString()
          };
          if (
            state &&
            state.actions &&
            typeof state.actions.addEditorJob === "function"
          ) {
            state.actions.addEditorJob(job);
          } else {
            DM4.Logger.warn(
              "[EDITOR] addEditorJob action not available; job not recorded."
            );
          }
        });
      }

      // JOBS SECTION
      jobsContent.innerHTML = "";

      if (!jobs.length) {
        var none = document.createElement("div");
        none.classList.add("dm4-editor-line", "dm-text-body");
        none.textContent = "No pending edits recorded.";
        jobsContent.appendChild(none);
      } else {
        var maxShow = 8;
        for (var k = 0; k < jobs.length && k < maxShow; k++) {
          var jobLine = document.createElement("div");
          jobLine.classList.add("dm4-editor-line", "dm-text-body");
          jobLine.textContent = describeJob(jobs[k]);
          jobsContent.appendChild(jobLine);
        }
        if (jobs.length > maxShow) {
          var moreLine = document.createElement("div");
          moreLine.classList.add("dm4-editor-line", "dm-text-small");
          moreLine.textContent =
            "+ " + (jobs.length - maxShow) + " more edit(s) not shown.";
          jobsContent.appendChild(moreLine);
        }

        var controls = document.createElement("div");
        controls.classList.add("dm4-editor-line", "dm-text-body");
        jobsContent.appendChild(controls);

        var exportBtn = document.createElement("button");
        exportBtn.type = "button";
        exportBtn.textContent = "Export Edit Batch";
        exportBtn.classList.add("dm4-editor-button");
        controls.appendChild(exportBtn);

        exportBtn.addEventListener("click", function () {
          exportJobs(jobs);
        });

        var clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.textContent = "Clear";
        clearBtn.classList.add("dm4-editor-button");
        controls.appendChild(clearBtn);

        
        clearBtn.addEventListener("click", function () {
          if (
            state &&
            state.actions &&
            typeof state.actions.clearEditorJobs === "function"
          ) {
            state.actions.clearEditorJobs();
          }
        });

        var buildBtn = document.createElement("button");
        buildBtn.type = "button";
        buildBtn.textContent = "Build Patched Dataset";
        buildBtn.classList.add("dm4-editor-button", "dm4-editor-build-btn");
        controls.appendChild(buildBtn);

        buildBtn.addEventListener("click", function () {
          var st = state.getState ? state.getState() : null;
          if (!st || !st.editor) {
            alert("No editor state available to build patch.");
            return;
          }
          var editorState = st.editor || { jobs: [] };
          var jobs = editorState.jobs || [];
          if (!jobs.length) {
            alert("No pending editor jobs to apply.");
            return;
          }

          var datasetId = getCurrentDatasetId();
          var currentDb5 = st.dataset || {};
          // Clone dataset so we don't mutate state directly if patch fails
          var db5;
          try {
            db5 = JSON.parse(JSON.stringify(currentDb5));
          } catch (e) {
            DM4.Logger.error("[EDITOR] Failed to clone dataset for patch:", e);
            alert("Failed to clone dataset for patch. See console for details.");
            return;
          }

          var logs;
          try {
            logs = dm4ApplyJobsToDb5(db5, jobs, datasetId, true);
          } catch (e) {
            DM4.Logger.error("[EDITOR] Patch failed:", e);
            alert("Patch failed: " + (e && e.message ? e.message : String(e)));
            return;
          }

          // Apply patched dataset to viewer state
          if (state.actions && typeof state.actions.setDataset === "function") {
            state.actions.setDataset(db5);
          }

          // Also update in-memory DM4_DATASETS cache for this session if present
          try {
            if (
              typeof window !== "undefined" &&
              window.DM4_DATASETS &&
              window.DM4_DATASETS[datasetId]
            ) {
              window.DM4_DATASETS[datasetId] = db5;
            }
          } catch (e) {
            DM4.Logger.warn("[EDITOR] Failed to update DM4_DATASETS cache:", e);
          }

          // Clear editor jobs after successful patch
          if (
            state.actions &&
            typeof state.actions.clearEditorJobs === "function"
          ) {
            state.actions.clearEditorJobs();
          }

          // Download patched DB5 as a JSON file
          try {
            var blob = new Blob([JSON.stringify(db5, null, 2)], {
              type: "application/json"
            });
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            var stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 13);
            var baseName = (datasetId || "main").toUpperCase();
            a.href = url;
            a.download = "DB5_" + baseName + "_Patched_" + stamp + ".json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (e) {
            DM4.Logger.error("[EDITOR] Failed to download patched DB5:", e);
          }

          if (logs && logs.length) {
            DM4.Logger.log("[EDITOR] Patch applied. Summary:");
            for (var i = 0; i < logs.length; i++) {
              DM4.Logger.log("  " + logs[i]);
            }
          }
        });

      }
    }

    const unsubscribe = state.subscribe(function (st) {
      render(st);
    });

    return {
      mount: function (host) {
        host.appendChild(root);
        render(state.getState());
      },
      unmount: function () {
        unsubscribe();
        if (root.parentNode) {
          root.parentNode.removeChild(root);
        }
      }
    };
  }
/****************************
   * DM4 PANEL REGISTRY (canonical)
   * New panels should be added here; orphaned panel factories are legacy candidates.
   ****************************/
  const DM4_PANELS = {
    identity: {
      id: "identity",
      label: "System Readout",
      factory: IdentityPanel,
      isCore: true
    },
    editor: {
      id: "editor",
      label: "Dataset Editor",
      factory: EditorPanel,
      isCore: true
    },
    test: {
      id: "test",
      label: "Test Panel",
      factory: TestPanel,
      isCore: true
    }
  };

  const DM4_PANEL_IDS = Object.keys(DM4_PANELS);

  // DM4_HELPER_FUNCTION: assertPanelContract

  function assertPanelContract(id, root) {
    if (!DM4_DEBUG) return;
    try {
      const expectedRootClass = "dm4-" + id + "-root";
      if (!root.classList.contains(expectedRootClass)) {
        DM4.Logger.warn(
          "[PANEL] Panel '" + id + "' root missing expected class:",
          expectedRootClass,
          "on",
          root
        );
      }

      // Titles should use dm-text-title
      root.querySelectorAll("h1, h2, .dm4-" + id + "-title").forEach(function (el) {
        if (!el.classList.contains("dm-text-title")) {
          DM4.Logger.warn("[PANEL] Panel '" + id + "' title without dm-text-title:", el);
        }
      });

      // Section headers should use dm-text-header
      root.querySelectorAll("[class*='-section-title']").forEach(function (el) {
        if (!el.classList.contains("dm-text-header")) {
          DM4.Logger.warn(
            "[PANEL] Panel '" + id + "' section header missing dm-text-header:",
            el
          );
        }
      });

      // Lines should at least use one of the text roles
      root.querySelectorAll("[class*='-line']").forEach(function (el) {
        if (
          !el.classList.contains("dm-text-body") &&
          !el.classList.contains("dm-text-header") &&
          !el.classList.contains("dm-text-title")
        ) {
          DM4.Logger.warn(
            "[PANEL] Panel '" + id + "' line missing any text role class:",
            el
          );
        }
      });
    } catch (err) {
      DM4.Logger.error("[PANEL] Failed panel contract check for '" + id + "':", err);
    }
  }

/****************************
   * 7) UI: PANEL REGISTRY
   ****************************/
    // DM4_CORE_FUNCTION: createPanelRegistry
    function createPanelRegistry(core, hostElement) {
    // Seed factories from canonical DM4_PANELS registry
    const factories = {};
    Object.keys(DM4_PANELS).forEach(function (id) {
      factories[id] = DM4_PANELS[id].factory;
    });

    let activePanelId = null;
    let activeInstance = null;

    // DM4_HELPER_FUNCTION: activatePanel

    function activatePanel(id) {
      if (id === activePanelId) return;

      if (activeInstance && activeInstance.unmount) {
        activeInstance.unmount();
        activeInstance = null;
      }

      const factory = factories[id];
      if (!factory) {
        DM4.Logger.warn("[PANEL] Unknown panel id:", id);
        return;
      }

      if (!isKnownPanel(id) && DM4_DEBUG) {
        DM4.Logger.warn(
          "[PANEL] Activating non-core or legacy panel id (not in DM4_PANELS):",
          id
        );
      }

      activePanelId = id;
      activeInstance = factory(core);
      activeInstance.mount(hostElement);

      // Run panel contract checks on the mounted root, if we can find it
      const mountedRoot =
        hostElement.querySelector(".dm4-" + id + "-root") || hostElement.firstElementChild;
      if (mountedRoot) {
        assertPanelContract(id, mountedRoot);
      }
    }

    return {
      registerPanel: function (id, factory) {
        if (DM4_DEBUG) {
          DM4.Logger.warn(
            "[PANEL] registerPanel used for id '" +
              id +
              "'. Prefer adding panels via DM4_PANELS for canonical registry."
          );
        }
        factories[id] = factory;
      },
      activatePanel: activatePanel,
      get activePanelId() {
        return activePanelId;
      }
    };
  }


/***********************
   * 8) UI: CONTROL BAR
   ***********************/
  // DM4_CORE_FUNCTION: initControlBar
  function initControlBar(core, root, panelRegistry) {
    const bar = document.createElement("div");
    bar.classList.add("dm-control-bar");

    const navBtn = document.createElement("button");
    navBtn.textContent = "NAVCOM";

    const stratBtn = document.createElement("button");
    stratBtn.textContent = "STRATEGIC";

    const cmdBtn = document.createElement("button");
    cmdBtn.textContent = "COMMAND";

    const editorToggle = document.createElement("button");
    editorToggle.textContent = "EDITOR";

    bar.appendChild(navBtn);
    bar.appendChild(stratBtn);
    bar.appendChild(cmdBtn);
    bar.appendChild(editorToggle);

    root.appendChild(bar);

    // DM4_HELPER_FUNCTION: setActiveButton
    function setActiveButton(mode) {
      navBtn.classList.toggle("active", mode === "navcom");
      stratBtn.classList.toggle("active", mode === "strategic");
    }

    // DM4_HELPER_FUNCTION: setEditorButton
    function setEditorButton(editorState) {
      const enabled = !!(editorState && editorState.enabled);
      editorToggle.classList.toggle("active", enabled);
    }

    navBtn.addEventListener("click", function () {
      core.state.actions.setMode("navcom");
      if (!panelRegistry.activePanelId) {
        panelRegistry.activatePanel("identity");
      }
    });

    stratBtn.addEventListener("click", function () {
      core.state.actions.setMode("strategic");
      if (!panelRegistry.activePanelId) {
        panelRegistry.activatePanel("identity");
      }
    });

    cmdBtn.addEventListener("click", function () {
      DM4.Logger.log("Command Interface test hook — activating TEST PANEL.");
      panelRegistry.activatePanel("test");
    });

    editorToggle.addEventListener("click", function () {
      const st = core.state.getState();
      const current = (st && st.editor && st.editor.enabled) || false;
      const next = !current;
      if (
        core.state.actions &&
        typeof core.state.actions.setEditorEnabled === "function"
      ) {
        core.state.actions.setEditorEnabled(next);
      }
      if (
        next &&
        panelRegistry &&
        typeof panelRegistry.activatePanel === "function"
      ) {
        panelRegistry.activatePanel("editor");
      }
    });

    const unsubscribe = core.state.subscribe(function (st) {
      setActiveButton(st.mode || "navcom");
      setEditorButton(st.editor || { enabled: false, jobs: [] });
      if (!panelRegistry.activePanelId) {
        panelRegistry.activatePanel("identity");
      }
    });

    return {
      destroy: function () {
        unsubscribe();
        if (bar.parentNode) {
          root.removeChild(bar);
        }
      }
    };
  }

/*************************
   * 9) CORE BOOTSTRAP
   *************************/
  // DM4_CORE_FUNCTION: bootstrapViewer
  function bootstrapViewer(rootElement, config, rawDataset, rawCampaign) {
    const mergedConfig = Object.assign({}, DM4_DEFAULT_CONFIG, config || {});
    const dataset = normalizeDataset(rawDataset);

    const campaign =
      rawCampaign ||
      {
        factions: [],
        systemControl: [],
        actors: [],
        assetRequests: [],
        budgets: { players: {} },
        actorTypes: [],
        assetCatalog: []
      };

    const state = createStateManager(mergedConfig, dataset, campaign);

    const core = {
      config: mergedConfig,
      state: state
    };

    // Run CSS variable contract checks once at boot
    if (typeof runStyleContractChecks === "function") {
      runStyleContractChecks();
    }
    // Log core function whitelist for cleanup tooling (debug only)
    if (typeof logCoreFunctionPresence === "function") {
      logCoreFunctionPresence();
    }

// Apply initial style profile and update on mode changes
applyStyleProfileForMode(state.getState().mode || "navcom");
state.subscribe(function (st) {
  if (st && st.mode) {
    applyStyleProfileForMode(st.mode);
  }
});


    const layout = document.createElement("div");
    layout.classList.add("dm-root-layout");

    const leftCol = document.createElement("div");
    leftCol.classList.add("dm-col-left");

    const centerCol = document.createElement("div");
    centerCol.classList.add("dm-col-center");

    const rightCol = document.createElement("div");
    rightCol.classList.add("dm-col-right");

    layout.appendChild(leftCol);
    layout.appendChild(centerCol);
    layout.appendChild(rightCol);

    // Top bar above the three-column layout
    const topBar = document.createElement("div");
    topBar.classList.add("dm-top-bar");

    // Dataset selector (host-driven, optional)
    const datasetContainer = document.createElement("div");
    datasetContainer.classList.add(
      "dm-top-bar-datasets",
      "dm-text-small",
      "dm-text-header"
    );

    const datasetLabel = document.createElement("span");
    datasetLabel.textContent = "Dataset:";

    const datasetSelect = document.createElement("select");
    datasetSelect.classList.add("dm-top-bar-dataset-select");

    // Populate dropdown options from host-provided DM4_DATASETS, if available
    try {
      if (typeof window !== "undefined" && window.DM4_DATASETS) {
        const dsMap = window.DM4_DATASETS;
        Object.keys(dsMap).forEach(function (id) {
          const meta = dsMap[id] && dsMap[id].dataset_metadata;
          const label =
            (meta && (meta.display_name || meta.name)) ||
            id;
          const opt = document.createElement("option");
          opt.value = id;
          opt.textContent = label;
          datasetSelect.appendChild(opt);
        });
      }
    } catch (e) {
      DM4.Logger.warn("Failed to build dataset selector from DM4_DATASETS:", e);
    }

    datasetSelect.addEventListener("change", function () {
      const id = datasetSelect.value;
      try {
        if (window && typeof window.DM4_startViewerWithDataset === "function") {
          window.DM4_startViewerWithDataset(id);
        }
      } catch (e) {
        DM4.Logger.error("Failed to switch dataset via DM4_startViewerWithDataset:", e);
      }
    });

    datasetContainer.appendChild(datasetLabel);
    datasetContainer.appendChild(datasetSelect);

    // Title container
    const topTitle = document.createElement("div");
    topTitle.classList.add("dm-top-bar-title", "dm-text-title");
    topTitle.textContent =
      "Dreadmarch Strategic Command Overview - ISNI Deployment Model 4.0";

    // Coordinate readout container (small crimson text via palette roles)
    const topCoords = document.createElement("div");
    topCoords.classList.add("dm-top-bar-coords", "dm-text-small", "dm-text-header");
    topCoords.textContent = "Parsec Coordinates: -,-";

    // Order: datasets (left), title (center), coords (right)
    topBar.appendChild(datasetContainer);
    topBar.appendChild(topTitle);
    topBar.appendChild(topCoords);

    // Reflect current dataset selection if known
    try {
      const currentId =
        (typeof window !== "undefined" && window.DM4_CURRENT_DATASET_ID) || "main";
      if (typeof datasetSelect !== "undefined" && datasetSelect) {
        datasetSelect.value = currentId;
      }
    } catch (e) {
      // Non-fatal; dataset selector is optional
      DM4.Logger.warn("Dataset selector state sync failed:", e);
    }

    // Expose coordinate readout on core for map layer hooks
    core.topBarCoords = topCoords;

    rootElement.appendChild(topBar);
    rootElement.appendChild(layout);

    const panelRegistry = createPanelRegistry(core, rightCol);
    core.panelRegistry = panelRegistry;
    panelRegistry.activatePanel("identity");

    const controlBar = initControlBar(core, leftCol, panelRegistry);

    const mapLayer = initMapLayer(core, centerCol);

    // Run DOM style contract checks after UI has been constructed (debug only)
    if (typeof runDomStyleContractChecks === "function") {
      runDomStyleContractChecks();
    }
    // Run class namespace checks to detect legacy or non-namespaced classes
    if (typeof runClassNamespaceChecks === "function") {
      runClassNamespaceChecks();
    }

    return {
      destroy: function () {
        mapLayer.destroy();
        controlBar.destroy();
        if (layout.parentNode) {
          rootElement.removeChild(layout);
        }
      },
      core: core,
      panelRegistry: panelRegistry
    };

  // DM4_HELPER_FUNCTION: logPanelRegistryStatus
  function logPanelRegistryStatus(core, panelRegistry) {
    if (!DM4_DEBUG) {
      return;
    }
    DM4.Logger.log("[DREADMARCH] Panel Registry Status");
    var panels = typeof DM4_PANELS !== "undefined" ? DM4_PANELS : null;
    if (!panels) {
      DM4.Logger.warn("[PANEL] DM4_PANELS registry is not defined.");
    } else {
      var ids = Object.keys(panels);
      DM4.Logger.log("[PANEL] Registered panels:", ids);
      ids.forEach(function (id) {
        var entry = panels[id];
        if (!entry || typeof entry.factory !== "function") {
          DM4.Logger.warn("[PANEL] Panel '" + id + "' has no valid factory.");
        }
      });
    }
    if (panelRegistry) {
      DM4.Logger.log(
        "[PANEL] Active panel id:",
        panelRegistry.activePanelId || "(none)"
      );
    }
  }

  // DM4_HELPER_FUNCTION: runDm4SelfTest
  function runDm4SelfTest(core, panelRegistry) {
    DM4.Logger.log("DM4 Self-Test");
    if (typeof runStyleContractChecks === "function") {
      try {
        runStyleContractChecks();
        DM4.Logger.log("[SELFTEST] Style contract check passed.");
      } catch (err) {
        DM4.Logger.error("[SELFTEST] Style contract check failed:", err);
      }
    }
    if (typeof runDomStyleContractChecks === "function") {
      try {
        runDomStyleContractChecks();
        DM4.Logger.log("[SELFTEST] DOM style contract check ran.");
      } catch (err) {
        DM4.Logger.error("[SELFTEST] DOM style contract check failed:", err);
      }
    }
    if (typeof runClassNamespaceChecks === "function") {
      try {
        runClassNamespaceChecks();
        DM4.Logger.log("[SELFTEST] Class namespace check ran.");
      } catch (err) {
        DM4.Logger.error("[SELFTEST] Class namespace check failed:", err);
      }
    }
    logPanelRegistryStatus(core, panelRegistry || null);
  }

  }

  window.DreadmarchViewer4 = {
    bootstrap: bootstrapViewer,
    selfTest: function (viewer) {
      if (!viewer || !viewer.core) {
        DM4.Logger.error(
          "[DREADMARCH] selfTest expected a viewer instance returned by DreadmarchViewer4.bootstrap()."
        );
        return;
      }
      runDm4SelfTest(viewer.core, viewer.panelRegistry || null);
    },
    logPanelRegistryStatus: function (viewer) {
      if (!viewer || !viewer.core) {
        DM4.Logger.error(
          "[DREADMARCH] logPanelRegistryStatus expected a viewer instance returned by DreadmarchViewer4.bootstrap()."
        );
        return;
      }
      logPanelRegistryStatus(viewer.core, viewer.panelRegistry || null);
    }
  };
})();
