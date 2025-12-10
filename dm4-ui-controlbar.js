;(function () {
  "use strict";

  if (!window.DM4) {
    window.DM4 = {};
  }
  var DM4 = window.DM4;

  if (!DM4.ui) {
    DM4.ui = {};
  }

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
        console.log("[DREADMARCH] Command Interface test hook — activating TEST PANEL.");
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



  DM4.ui.initControlBar = initControlBar;
})();