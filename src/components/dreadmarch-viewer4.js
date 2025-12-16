;(function () {
  "use strict";
  
  var DM4_DEBUG = !!(window.DM4 && window.DM4.config && window.DM4.config.debug);
  
  var DM4_BUNDLE_META = {
    viewerVersion: "4.0.0",
    protocolVersion: "1.6",
    bundleLabel: "ModularBootstrap",
    expectedDatasetVersion: "3.x",
    notes: "Clean bootstrap coordinator - all rendering in modular files"
  };

  var DM4_DEFAULT_CONFIG = {
    mapWidth: 6000,
    mapHeight: 6000
  };

  var DM4_STYLE_CONTRACT = {
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

  var DM4_MODES = ["navcom", "strategic"];
  var DM4_ALLOWED_CLASS_PREFIXES = ["dm-", "dm4-"];
  var DM4_ALLOWED_STANDALONE_CLASSES = new Set(["active"]);

  function isKnownMode(mode) {
    return DM4_MODES.indexOf(mode) !== -1;
  }

  function runStyleContractChecks() {
    try {
      var root = document.documentElement;
      var cs = getComputedStyle(root);
      DM4_STYLE_CONTRACT.requiredCssVars.forEach(function(name) {
        var value = cs.getPropertyValue(name).trim();
        if (!value) {
          DM4.Logger.error("[STYLE] Missing required CSS variable:", name);
        }
      });
    } catch (err) {
      DM4.Logger.error("[STYLE] Failed to run style contract checks:", err);
    }
  }

  function runClassNamespaceChecks() {
    if (!DM4_DEBUG) return;
    try {
      document.querySelectorAll("[class]").forEach(function (el) {
        el.classList.forEach(function (cls) {
          var hasAllowedPrefix = DM4_ALLOWED_CLASS_PREFIXES.some(function (prefix) {
            return cls.startsWith(prefix);
          });
          if (!hasAllowedPrefix && !DM4_ALLOWED_STANDALONE_CLASSES.has(cls)) {
            DM4.Logger.warn("[STYLE] Non-namespaced class:", cls, "on element:", el);
          }
        });
      });
    } catch (err) {
      DM4.Logger.error("[STYLE] Failed to run class namespace checks:", err);
    }
  }

  function bootstrapViewer(root, userConfig, rawDataset, campaign) {
    DM4.Logger.log("[BOOTSTRAP] Starting Dreadmarch Viewer 4.0");
    
    var config = {};
    Object.keys(DM4_DEFAULT_CONFIG).forEach(function(key) {
      config[key] = DM4_DEFAULT_CONFIG[key];
    });
    if (userConfig) {
      Object.keys(userConfig).forEach(function(key) {
        config[key] = userConfig[key];
      });
    }

    var dataset;
    try {
      if (!window.DM4 || !DM4.dataset || typeof DM4.dataset.normalize !== "function") {
        throw new Error("DM4.dataset.normalize not available");
      }
      dataset = DM4.dataset.normalize(rawDataset);
    } catch (err) {
      DM4.Logger.critical("[BOOTSTRAP] Dataset normalization failed", function() {
        return { systems: {} };
      }, err);
      dataset = { systems: {} };
    }

    var state;
    try {
      if (!window.DM4 || !DM4.state || typeof DM4.state.createStateManager !== "function") {
        throw new Error("DM4.state.createStateManager not available");
      }
      state = DM4.state.createStateManager(config, dataset, campaign);
    } catch (err) {
      DM4.Logger.error("[BOOTSTRAP] Failed to create state manager:", err);
      throw err;
    }

    var core = { config: config, state: state };

    root.innerHTML = "";
    root.classList.add("dm4-root-shell");

    var topBar = document.createElement("div");
    topBar.classList.add("dm-top-bar");
    var topBarTitle = document.createElement("div");
    topBarTitle.classList.add("dm-top-bar-title", "dm-text-title");
    topBarTitle.textContent = "DREADMARCH CAMPAIGN MANAGER";
    var topBarCoords = document.createElement("div");
    topBarCoords.classList.add("dm-top-bar-coords", "dm-text-body");
    topBarCoords.textContent = "Parsec Coordinates: ---";
    topBar.appendChild(topBarTitle);
    topBar.appendChild(topBarCoords);
    root.appendChild(topBar);
    core.topBarCoords = topBarCoords;

    var mainLayout = document.createElement("div");
    mainLayout.classList.add("dm-root-layout");
    var leftCol = document.createElement("div");
    leftCol.classList.add("dm-col-left");
    var centerCol = document.createElement("div");
    centerCol.classList.add("dm-col-center");
    var rightCol = document.createElement("div");
    rightCol.classList.add("dm-col-right");
    mainLayout.appendChild(leftCol);
    mainLayout.appendChild(centerCol);
    mainLayout.appendChild(rightCol);
    root.appendChild(mainLayout);

    try {
      if (!window.DM4 || !DM4.map || typeof DM4.map.initMapLayer !== "function") {
        throw new Error("DM4.map.initMapLayer not available");
      }
      DM4.map.initMapLayer(core, centerCol);
    } catch (err) {
      DM4.Logger.error("[BOOTSTRAP] Failed to initialize map:", err);
      throw err;
    }

    var panelRegistry;
    try {
      if (!window.DM4 || !DM4.panels || !DM4.panels.registry || 
          typeof DM4.panels.registry.createPanelRegistry !== "function") {
        throw new Error("DM4.panels.registry.createPanelRegistry not available");
      }
      panelRegistry = DM4.panels.registry.createPanelRegistry(core, rightCol);
      core.panelRegistry = panelRegistry;
    } catch (err) {
      DM4.Logger.error("[BOOTSTRAP] Failed to create panel registry:", err);
      throw err;
    }

    try {
      if (!window.DM4 || !DM4.ui || typeof DM4.ui.initControlBar !== "function") {
        throw new Error("DM4.ui.initControlBar not available");
      }
      DM4.ui.initControlBar(core, leftCol, panelRegistry);
    } catch (err) {
      DM4.Logger.error("[BOOTSTRAP] Failed to initialize control bar:", err);
      throw err;
    }

    if (panelRegistry && typeof panelRegistry.activatePanel === "function") {
      panelRegistry.activatePanel("identity");
    }

    if (DM4_DEBUG) {
      runStyleContractChecks();
      runClassNamespaceChecks();
    }

    return core;
  }

  function runDm4SelfTest() {
    DM4.Logger.log("=== DM4 Self-Test ===");
    var required = [
      { path: "DM4.dataset.normalize", name: "Dataset Core" },
      { path: "DM4.state.createStateManager", name: "State Manager" },
      { path: "DM4.map.initMapLayer", name: "Map Layers" },
      { path: "DM4.panels.registry.createPanelRegistry", name: "Panel Registry" },
      { path: "DM4.panels.IdentityPanel", name: "Identity Panel" },
      { path: "DM4.ui.initControlBar", name: "Control Bar" }
    ];

    var allPresent = true;
    required.forEach(function(item) {
      var parts = item.path.split(".");
      var obj = window;
      var found = true;
      for (var i = 0; i < parts.length; i++) {
        if (!obj || typeof obj[parts[i]] === "undefined") {
          found = false;
          break;
        }
        obj = obj[parts[i]];
      }
      if (found) {
        DM4.Logger.log("[SELF-TEST] ✅", item.name, "present");
      } else {
        DM4.Logger.error("[SELF-TEST] ❌", item.name, "MISSING");
        allPresent = false;
      }
    });
    return allPresent;
  }

  window.DreadmarchViewer4 = window.DreadmarchViewer4 || {};
  window.DreadmarchViewer4.bootstrap = bootstrapViewer;
  window.DreadmarchViewer4.selfTest = runDm4SelfTest;
  window.DreadmarchViewer4.meta = DM4_BUNDLE_META;
})();
