;(function () {
  "use strict";

  if (!window.DM4) {
    window.DM4 = {};
  }
  var DM4 = window.DM4;

  // Local debug flag mirrors the core viewer's DM4_DEBUG behavior
  var DM4_DEBUG = !!(DM4 && DM4.config && DM4.config.debug);

  /**
   * STYLE CONTRACT
   *
   * This mirrors the viewer core's original DM4_STYLE_CONTRACT structure.
   * When introducing new text roles or required CSS variables, update this.
   */
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

  /**
   * STYLE PROFILES
   *
   * For now all modes map to the same Palette E2 stylesheet. This preserves
   * the original core behavior and leaves room to vary by mode later.
   */
  var DM4_STYLE_PROFILES = {
    navcom: "src/styles/dm-style-palette-e2.css",
    strategic: "src/styles/dm-style-palette-e2.css",
    intel: "src/styles/dm-style-palette-e2.css",
    command: "src/styles/dm-style-palette-e2.css"
  };

  // DM4_STYLE_CORE_FUNCTION: runStyleContractChecks
  function runStyleContractChecks(core) {
    try {
      var root = document.documentElement;
      var cs = getComputedStyle(root);

      DM4_STYLE_CONTRACT.requiredCssVars.forEach(function (name) {
        var value = cs.getPropertyValue(name).trim();
        if (!value) {
          DM4.Logger.error("[STYLE] Missing required CSS variable:", name);
        }
      });
    } catch (err) {
      DM4.Logger.error("[STYLE] Failed to run style contract checks:", err);
    }
  }

  // DM4_STYLE_CORE_FUNCTION: runDomStyleContractChecks
  function runDomStyleContractChecks(core) {
    if (!DM4_DEBUG) return;

    try {
      // 1) Inline styles are not allowed on UI elements
      document.querySelectorAll("[style]").forEach(function (el) {
        DM4.Logger.warn("[STYLE] Inline style found on element:", el);
      });

      // 2) Unknown dm-text-* classes
      var allowed = new Set(DM4_STYLE_CONTRACT.allowedTextRoles);

      document.querySelectorAll("[class*='dm-text-']").forEach(function (el) {
        el.classList.forEach(function (cls) {
          if (cls.indexOf("dm-text-") === 0 && !allowed.has(cls)) {
            DM4.Logger.warn(
              "[STYLE] Unknown text role class '" + cls + "' on element:",
              el
            );
          }
        });
      });
    } catch (err) {
      DM4.Logger.error("[STYLE] Failed to run DOM style contract checks:", err);
    }
  }

  // DM4_STYLE_CORE_FUNCTION: applyStyleProfileForMode
  function applyStyleProfileForMode(core, mode) {
    var linkId = "dm-style-profile";
    var href = DM4_STYLE_PROFILES[mode] || DM4_STYLE_PROFILES.navcom;
    if (!href) return;

    var linkEl = document.getElementById(linkId);
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

  // Attach to DM4 namespace
  DM4.style = DM4.style || {};
  DM4.style.runStyleContractChecks = runStyleContractChecks;
  DM4.style.runDomStyleContractChecks = runDomStyleContractChecks;
  DM4.style.applyStyleProfileForMode = applyStyleProfileForMode;
})();
