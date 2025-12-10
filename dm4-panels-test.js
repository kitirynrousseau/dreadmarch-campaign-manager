(function (global) {
  "use strict";

  var DM4 = global.DM4 || (global.DM4 = {});
  DM4.panels = DM4.panels || {};

    function TestPanel(core) {
        const state = core.state;

        const root = document.createElement("div");
        root.classList.add("dm4-test-root");

        const inner = document.createElement("div");
        inner.classList.add("dm4-test-inner");
        root.appendChild(inner);

        // Title – uses dm-text-title (crimson)
        const titleEl = document.createElement("h2");
        titleEl.classList.add("dm4-test-title", "dm-text-title");
        titleEl.textContent = "TEST PANEL";
        inner.appendChild(titleEl);

        // Header – uses dm-text-header (crimson)
        const headerEl = document.createElement("div");
        headerEl.classList.add("dm4-test-header", "dm-text-header");
        headerEl.textContent = "TEST HEADER";
        inner.appendChild(headerEl);

        // Body container + 3 body lines
        const bodyContainer = document.createElement("div");
        bodyContainer.classList.add("dm4-test-body");
        inner.appendChild(bodyContainer);

        // DM4_HELPER_FUNCTION: makeBodyLine

        function makeBodyLine(text) {
          const line = document.createElement("div");
          line.classList.add("dm4-test-line", "dm-text-body");
          line.textContent = text;
          return line;
        }

        const lineSelected = makeBodyLine("");
        const lineMetricA = makeBodyLine("Body metric A: placeholder");
        const lineMetricB = makeBodyLine("Body metric B: placeholder");

        bodyContainer.appendChild(lineSelected);
        bodyContainer.appendChild(lineMetricA);
        bodyContainer.appendChild(lineMetricB);

        // Simple reactive render: tracks current selected system name
        // DM4_HELPER_FUNCTION: render
        function render(st) {
          const dataset = st.dataset || {};
          const systems = dataset.systems || {};
          const selId = st.selection && st.selection.system;

          if (!selId || !systems[selId]) {
            lineSelected.textContent = "Selected system: (none)";
          } else {
            const sys = systems[selId];
            const name = sys.name || selId;
            lineSelected.textContent = "Selected system: " + name;
          }
        }

        const unsubscribe = state.subscribe(render);

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

  DM4.panels.TestPanel = TestPanel;

})(window);
