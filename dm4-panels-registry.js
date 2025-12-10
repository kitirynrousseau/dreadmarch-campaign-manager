;(function () {
  // DM4 PANELS REGISTRY MODULE
  if (!window.DM4 || !window.DM4.config) {
    console.error("[DREADMARCH][PANELS] DM4 runtime not initialized.");
    return;
  }
  var DM4 = window.DM4;
  const DM4_DEBUG = !!(DM4.config && DM4.config.debug);
  DM4.panels = DM4.panels || {};
  DM4.panels.registry = DM4.panels.registry || {};


const DM4_PANELS = {
    identity: {
      id: "identity",
      label: "System Readout",
      factory: function (core) {
        return (DM4.panels && DM4.panels.IdentityPanel)
          ? DM4.panels.IdentityPanel(core)
          : null;
      },
      isCore: true
    },
    editor: {
      id: "editor",
      label: "Dataset Editor",
      factory: function (core) { return (DM4.editor && DM4.editor.PanelFactory) ? DM4.editor.PanelFactory(core) : null; },
      isCore: true
    },
    test: {
      id: "test",
      label: "Test Panel",
      factory: function (core) {
        return (DM4.panels && DM4.panels.TestPanel)
          ? DM4.panels.TestPanel(core)
          : null;
      },
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
        console.warn(
          "[DREADMARCH][PANEL] Panel '" + id + "' root missing expected class:",
          expectedRootClass,
          "on",
          root
        );
      }

      // Titles should use dm-text-title
      root.querySelectorAll("h1, h2, .dm4-" + id + "-title").forEach(function (el) {
        if (!el.classList.contains("dm-text-title")) {
          console.warn("[DREADMARCH][PANEL] Panel '" + id + "' title without dm-text-title:", el);
        }
      });

      // Section headers should use dm-text-header
      root.querySelectorAll("[class*='-section-title']").forEach(function (el) {
        if (!el.classList.contains("dm-text-header")) {
          console.warn(
            "[DREADMARCH][PANEL] Panel '" + id + "' section header missing dm-text-header:",
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
          console.warn(
            "[DREADMARCH][PANEL] Panel '" + id + "' line missing any text role class:",
            el
          );
        }
      });
    } catch (err) {
      console.error("[DREADMARCH][PANEL] Failed panel contract check for '" + id + "':", err);
    }
  }

/****************************
   * 7) UI: PANEL REGISTRY
   ****************************/
    // Helper: check if panel id is known in canonical registry
function isKnownPanel(id) {
  try {
    var cfg =
      (window.DM4 &&
        DM4.panels &&
        DM4.panels.registry &&
        DM4.panels.registry.config) ||
      DM4_PANELS;
    if (!cfg || typeof cfg !== "object") return false;
    return Object.prototype.hasOwnProperty.call(cfg, id);
  } catch (err) {
    if (typeof DM4_DEBUG !== "undefined" && DM4_DEBUG) {
      console.warn("[DREADMARCH][PANEL] isKnownPanel check failed for id '" + id + "':", err);
    }
    return false;
  }
}

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
        console.warn("[DREADMARCH][PANEL] Unknown panel id:", id);
        return;
      }

      if (!isKnownPanel(id) && DM4_DEBUG) {
        console.warn(
          "[DREADMARCH][PANEL] Activating non-core or legacy panel id (not in DM4_PANELS):",
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
          console.warn(
            "[DREADMARCH][PANEL] registerPanel used for id '" +
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

  // Expose panel registry factory and canonical panel config on DM4 namespace
  if (typeof createPanelRegistry === "function") {
    DM4.panels.registry.createPanelRegistry = createPanelRegistry;
  } else {
    console.error("[DREADMARCH][PANELS] createPanelRegistry is not defined in dm4-panels-registry.js.");
  }
  DM4.panels.registry.config = DM4_PANELS;
})(); 
