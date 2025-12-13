(function (global) {
  "use strict";

  var DM4 = global.DM4 || (global.DM4 = {});
  DM4.panels = DM4.panels || {};

    function IdentityPanel(core) {
      const state = core.state;

      const root = document.createElement("div");
      root.classList.add("dm4-sr-root");

      // SYSTEM READOUT title
      const titleBar = document.createElement("h2");
      titleBar.classList.add("dm4-sr-title", "dm-text-title");
      titleBar.textContent = "SYSTEM READOUT";
      root.appendChild(titleBar);

      // Identity container
      const identityContainer = document.createElement("div");
      identityContainer.classList.add("dm4-sr-identity");
      root.appendChild(identityContainer);

      // NAVCOM PANEL
      const navcomPanel = document.createElement("div");
      navcomPanel.classList.add("dm4-nav-root");

      const navHeader = document.createElement("div");
      navHeader.classList.add("dm4-nav-header");

      const navTitle = document.createElement("div");
      navTitle.classList.add("dm4-nav-title", "dm-text-title");
      navTitle.textContent = "NAVCOM METRICS";

      navHeader.appendChild(navTitle);
      navcomPanel.appendChild(navHeader);

      const navDetails = document.createElement("div");
      navDetails.classList.add("dm4-nav-details");
      navcomPanel.appendChild(navDetails);

      root.appendChild(navcomPanel);

      // DM4_HELPER_FUNCTION: renderIdentity

      function renderIdentity(st) {
        const dataset = st.dataset || {};
        const systems = dataset.systems || {};
        const selId = st.selection && st.selection.system;

        identityContainer.innerHTML = "";

        if (!selId) {
          const placeholder = document.createElement("div");
          placeholder.classList.add("dm4-sr-placeholder", "dm-text-body");
          placeholder.textContent =
            (typeof DM_STRINGS !== "undefined" &&
              DM_STRINGS.identity &&
              DM_STRINGS.identity.placeholder) ||
            "Select a system glyph to load system data.";
          identityContainer.appendChild(placeholder);
          return;
        }

        const sys = systems[selId];
        if (!sys) {
          const placeholder = document.createElement("div");
          placeholder.classList.add("dm4-sr-placeholder", "dm-text-body");
          placeholder.textContent =
            (typeof DM_STRINGS !== "undefined" &&
              DM_STRINGS.identity &&
              DM_STRINGS.identity.notFound) ||
            "System not found in dataset.";
          identityContainer.appendChild(placeholder);
          return;
        }

        const sector = sys.sector || "Unknown Sector";
        const gridObj = sys.grid || {};
        const gridLabel = gridObj.grid || "UNSPECIFIED";
        const coords = sys.coords || [];
        const localCoords = sys.local_grid_coords || coords;
        const localX =
          typeof localCoords[0] === "number" ? Math.round(localCoords[0]) : 0;
        const localY =
          typeof localCoords[1] === "number" ? Math.round(localCoords[1]) : 0;

        // Registry code
        const sectorAbbr = (function () {
          if (!sector) return "UNKN";
          const letters = sector.toUpperCase().replace(/[^A-Z]/g, "");
          return letters ? letters.slice(0, 4) : "UNKN";
        })();

        const gridTagRaw = gridLabel || "";
        const gridTag = gridTagRaw ? gridTagRaw.replace("-", "") : "G000";
        const registryId =
          typeof coords[0] === "number" ? Math.round(coords[0]) : 0;
        const registryCode =
          gridTag + "-" + sectorAbbr + "-" + String(registryId).padStart(4, "0");

        const controlStatus = sys.control_status || "UNSPECIFIED";

        const headerName = sys.display_name || selId;

        identityContainer.classList.add("dm4-sr-identity-has-data");

        // --- System name (large, uses label selection colors) ---
        const nameLine = document.createElement("div");
        nameLine.classList.add("dm4-sr-line-name");
        nameLine.textContent = headerName;
        identityContainer.appendChild(nameLine);

        // --- Sector line (medium) ---
        const sectorLine = document.createElement("div");
        sectorLine.classList.add("dm4-sr-line-sector", "dm-text-header");
        sectorLine.textContent = sector + " Sector";
        identityContainer.appendChild(sectorLine);

        // --- Registry line (small, header-style label + value) ---
        const regLine = document.createElement("div");
        regLine.classList.add("dm4-sr-line", "dm-text-body");
        regLine.textContent = "IMPERIAL REGISTRY: " + registryCode;
        identityContainer.appendChild(regLine);

        // --- Galactic grid line (small) ---
        const galLine = document.createElement("div");
        galLine.classList.add("dm4-sr-line", "dm-text-body");
        galLine.textContent = "GALACTIC GRID: " + String(gridLabel).toUpperCase();
        identityContainer.appendChild(galLine);

        // --- Local grid line (small) ---
        const localLine = document.createElement("div");
        localLine.classList.add("dm4-sr-line", "dm-text-body");
        localLine.textContent = "LOCAL GRID: " + localX + " , " + localY;
        identityContainer.appendChild(localLine);

        // --- Control status line (small) ---
        const controlLine = document.createElement("div");
        controlLine.classList.add("dm4-sr-line", "dm-text-body");
        controlLine.textContent = "CONTROL STATUS: " + controlStatus;
        identityContainer.appendChild(controlLine);
      }

      // DM4_HELPER_FUNCTION: directionArrow

      function directionArrow(angleRad) {
        // Match old viewer's dmDirectionArrowFromAngle mapping (screen coords, Y down)
        const deg = ((angleRad * 180) / Math.PI + 360) % 360;
        if (deg >= 337.5 || deg < 22.5) return "→";
        if (deg >= 22.5 && deg < 67.5) return "↗";
        if (deg >= 67.5 && deg < 112.5) return "↑";
        if (deg >= 112.5 && deg < 157.5) return "↖";
        if (deg >= 157.5 && deg < 202.5) return "←";
        if (deg >= 202.5 && deg < 247.5) return "↙";
        if (deg >= 247.5 && deg < 292.5) return "↓";
        return "↘";
      }

      // DM4_HELPER_FUNCTION: baseDistance

      function baseDistance(a, b) {
        if (!a || !b) return null;
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        return Math.sqrt(dx * dx + dy * dy);
      }

      // DM4_HELPER_FUNCTION: functionalDistance

      function functionalDistance(distPc, routeClass) {
        if (distPc == null) return null;
        const cls = routeClass || "minor";
        if (cls === "major") return distPc * 0.25;
        if (cls === "medium") return distPc * 0.5;
        return distPc * 1.0;
      }

      // DM4_HELPER_FUNCTION: renderNavcom

      function renderNavcom(st) {
        const dataset = st.dataset || {};
        const systems = dataset.systems || {};
        const hyperlanes = dataset.hyperlanes || {};
        const routeMeta = dataset.route_metadata || {};
        const selId = st.selection && st.selection.system;

        navDetails.innerHTML = "";

        if (!selId) {
          // No system selected: hide NavCom panel completely
          navDetails.innerHTML = "";
          if (navcomPanel) {
            navcomPanel.style.display = "none";
          }
          return;
        }

        // Ensure NavCom panel is visible when a system is selected
        if (navcomPanel) {
          navcomPanel.style.display = "";
        }

        const sys = systems[selId];
        if (!sys) {
          const placeholder = document.createElement("div");
          placeholder.classList.add("dm4-nav-placeholder", "dm-text-body");
          placeholder.textContent =
            (typeof DM_STRINGS !== "undefined" &&
              DM_STRINGS.navcom &&
              DM_STRINGS.navcom.notFound) ||
            "System not found in dataset.";
          navDetails.appendChild(placeholder);
          return;
        }

        const coords = sys.coords || [];
        const baseCoord =
          typeof coords[0] === "number" && typeof coords[1] === "number"
            ? coords
            : null;

        const lines = [];

        // ROUTE CONNECTIVITY SECTION
        const neighbors = [];
        const majorNeighbors = [];
        const mediumNeighbors = [];
        const minorNeighbors = [];

        // DM4_HELPER_FUNCTION: pushNeighbor

        function pushNeighbor(routeName, cls, otherId) {
          const otherSys = systems[otherId];
          const otherCoords = otherSys && otherSys.coords;
          const dx = otherCoords && baseCoord ? otherCoords[0] - baseCoord[0] : 0;
          const dy = otherCoords && baseCoord ? otherCoords[1] - baseCoord[1] : 0;
          const rawDist = baseDistance(baseCoord, otherCoords);
          const funcDist = functionalDistance(rawDist, cls);
          const angle =
            otherCoords && baseCoord ? Math.atan2(-dy, dx) : 0;
          const arrow = directionArrow(angle);
          const name =
            (otherSys && (otherSys.display_name || otherId)) || otherId;
          const distText =
            funcDist != null
              ? Math.round(funcDist) + " flight parsecs"
              : "distance n/a";
          const entryText = arrow + " " + name + " (" + distText + ")";
          const record = { arrow: arrow, text: entryText };

          neighbors.push(record);
          if (cls === "major") {
            majorNeighbors.push(record);
          } else {
            mediumNeighbors.push(record);
          }
        }

        Object.keys(hyperlanes).forEach(function (routeName) {
          if (routeName === "minor_routes") return;
          const segs = hyperlanes[routeName] || [];
          const meta = routeMeta[routeName] || {};
          const cls = meta.route_class || "medium";
          segs.forEach(function (pair) {
            if (!Array.isArray(pair) || pair.length < 2) return;
            const a = pair[0];
            const b = pair[1];
            if (a !== selId && b !== selId) return;
            const other = a === selId ? b : a;
            pushNeighbor(routeName, cls, other);
          });
        });

        const minorSegs = hyperlanes.minor_routes || [];
        minorSegs.forEach(function (pair) {
          if (!Array.isArray(pair) || pair.length < 2) return;
          const a = pair[0];
          const b = pair[1];
          if (a !== selId && b !== selId) return;
          const other = a === selId ? b : a;
          const otherSys = systems[other];
          const otherCoords = otherSys && otherSys.coords;
          const dx2 = otherCoords && baseCoord ? otherCoords[0] - baseCoord[0] : 0;
          const dy2 = otherCoords && baseCoord ? otherCoords[1] - baseCoord[1] : 0;
          const rawDist = baseDistance(baseCoord, otherCoords);
          const funcDist = functionalDistance(rawDist, "minor");
          const angle =
            otherCoords && baseCoord ? Math.atan2(-dy2, dx2) : 0;
          const arrow = directionArrow(angle);
          const name =
            (otherSys && (otherSys.display_name || other)) || other;
          const distText =
            funcDist != null
              ? Math.round(funcDist) + " flight parsecs"
              : "distance n/a";
          const entryText = arrow + " " + name + " (" + distText + ")";
          const record = { arrow: arrow, text: entryText };
          minorNeighbors.push(record);
        });


        // Sort neighbors so that systems above the selected system appear first,
        // followed by lateral neighbors, then those below (compass-like ordering).
        function neighborSortKey(rec) {
          const arrow = rec && rec.arrow;
          // Up first, then diagonal up, then horizontal, then diagonal down, then down.
          if (arrow === "↑") return 0; // straight up
          if (arrow === "↗" || arrow === "↖") return 1; // diagonal up
          if (arrow === "→" || arrow === "←") return 2; // horizontal
          if (arrow === "↘" || arrow === "↙") return 3; // diagonal down
          if (arrow === "↓") return 4; // straight down
          return 5;
        }

        function sortNeighbors(arr) {
          arr.sort(function (a, b) {
            const ka = neighborSortKey(a);
            const kb = neighborSortKey(b);
            if (ka !== kb) return ka - kb;
            const ta = a && a.text ? a.text : "";
            const tb = b && b.text ? b.text : "";
            return ta.localeCompare(tb);
          });
        }

        sortNeighbors(majorNeighbors);
        sortNeighbors(mediumNeighbors);
        sortNeighbors(minorNeighbors);

        const navRoot = document.createElement("div");
        navRoot.classList.add("dm4-nav-inner");

        // --- ROUTE CONNECTIVITY ---
        const routeSection = document.createElement("div");
        routeSection.classList.add("dm4-nav-section");

        const routeHeader = document.createElement("div");
        routeHeader.classList.add("dm4-nav-section-title", "dm-text-header");
        routeHeader.textContent = "ROUTE CONNECTIVITY";
        routeSection.appendChild(routeHeader);

        if (neighbors.length === 0 && minorNeighbors.length === 0) {
          const emptyLine = document.createElement("div");
          emptyLine.classList.add("dm4-nav-line", "dm-text-body");
          emptyLine.textContent = "No registered hyperspace connections.";
          routeSection.appendChild(emptyLine);
        } else {
          if (majorNeighbors.length > 0) {
            const majorLabel = document.createElement("div");
            majorLabel.classList.add("dm4-nav-line-label", "dm-text-body");
            majorLabel.textContent = "Major Lanes:";
            routeSection.appendChild(majorLabel);

            majorNeighbors.forEach(function (rec) {
              const line = document.createElement("div");
              line.classList.add(
                "dm4-nav-line",
                "dm4-nav-line-major",
                "dm-text-body"
              );
              line.textContent = rec && rec.text ? rec.text : "";
              routeSection.appendChild(line);
            });
          }

          if (mediumNeighbors.length > 0) {
            const medLabel = document.createElement("div");
            medLabel.classList.add("dm4-nav-line-label", "dm-text-body");
            medLabel.textContent = "Medium Lanes:";
            routeSection.appendChild(medLabel);

            mediumNeighbors.forEach(function (rec) {
              const line = document.createElement("div");
              line.classList.add(
                "dm4-nav-line",
                "dm4-nav-line-medium",
                "dm-text-body"
              );
              line.textContent = rec && rec.text ? rec.text : "";
              routeSection.appendChild(line);
            });
          }

          if (minorNeighbors.length > 0) {
            const minorLabel = document.createElement("div");
            minorLabel.classList.add("dm4-nav-line-label", "dm-text-body");
            minorLabel.textContent = "Local Routes:";
            routeSection.appendChild(minorLabel);

            minorNeighbors.forEach(function (rec) {
              const line = document.createElement("div");
              line.classList.add(
                "dm4-nav-line",
                "dm4-nav-line-minor",
                "dm-text-body"
              );
              line.textContent = rec && rec.text ? rec.text : "";
              routeSection.appendChild(line);
            });
          }
        }

        navRoot.appendChild(routeSection);

        // --- STRATEGIC DISTANCES ---
        const allNeighborsForStrategic = neighbors
          .concat(minorNeighbors)
          .map(function (rec) {
            return rec && rec.text ? rec.text : "";
          });
        if (allNeighborsForStrategic.length > 0) {
          let minDist = null;
          let minEntry = null;
          allNeighborsForStrategic.forEach(function (entry) {
            const match = entry.match(/\((\d+) flight parsecs\)/);
            if (!match) return;
            const val = parseInt(match[1], 10);
            if (!isFinite(val)) return;
            if (minDist === null || val < minDist) {
              minDist = val;
              minEntry = entry;
            }
          });

          if (minEntry && minDist !== null) {
            const stratSection = document.createElement("div");
            stratSection.classList.add("dm4-nav-section");

            const stratHeader = document.createElement("div");
            stratHeader.classList.add("dm4-nav-section-title", "dm-text-header");
            stratHeader.textContent = "STRATEGIC DISTANCES";
            stratSection.appendChild(stratHeader);

            const line = document.createElement("div");
            line.classList.add("dm4-nav-line", "dm-text-body");
            line.textContent = "Nearest Major-Route Node: " + minEntry;
            stratSection.appendChild(line);

            navRoot.appendChild(stratSection);
          }
        }

        // --- NAVIGATION CLASSIFICATION ---
        const routes = sys.routes || {};
        const majorCount = Array.isArray(routes.major) ? routes.major.length : 0;
        const mediumCount = Array.isArray(routes.medium)
          ? routes.medium.length
          : 0;
        const minorCount =
          Array.isArray(routes.minor_neighbors)
            ? routes.minor_neighbors.length
            : Array.isArray(routes.minor)
            ? routes.minor.length
            : minorNeighbors.length;

        const totalLinks = majorCount + mediumCount + minorCount;

        let networkRole = "Isolated Node";
        if (totalLinks === 1) {
          networkRole = "Terminal Node";
        } else if (totalLinks === 2) {
          networkRole = "Waystation";
        } else if (totalLinks >= 6) {
          networkRole = "Regional Hub";
        } else if (totalLinks >= 3) {
          networkRole = "Junction Node";
        }

        const navClassSection = document.createElement("div");
        navClassSection.classList.add("dm4-nav-section");

        const navClassHeader = document.createElement("div");
        navClassHeader.classList.add("dm4-nav-section-title", "dm-text-header");
        navClassHeader.textContent = "NAVIGATION CLASSIFICATION";
        navClassSection.appendChild(navClassHeader);

        const roleLine = document.createElement("div");
        roleLine.classList.add("dm4-nav-line", "dm-text-body");
        roleLine.textContent = "Network Role: " + networkRole;
        navClassSection.appendChild(roleLine);

        const summaryLine = document.createElement("div");
        summaryLine.classList.add("dm4-nav-line", "dm-text-body");
        summaryLine.textContent =
          "Link Summary: " +
          "Maj " +
          majorCount +
          " • Med " +
          mediumCount +
          " • Loc " +
          minorCount;
        navClassSection.appendChild(summaryLine);

        navRoot.appendChild(navClassSection);

        navDetails.appendChild(navRoot);
      }

      // Memoization: Cache computed values to avoid recomputation
      let lastSelectionId = null;
      let lastDatasetVersion = null;
      let cachedNavcomData = null;

      function hasDatasetChanged(st) {
        const currentVersion = st.dataset && st.dataset.dataset_metadata && st.dataset.dataset_metadata.version;
        if (currentVersion !== lastDatasetVersion) {
          lastDatasetVersion = currentVersion;
          return true;
        }
        return false;
      }

      const unsubscribe = state.subscribe(function (st) {
        const selId = st.selection && st.selection.system;
        const datasetChanged = hasDatasetChanged(st);
        const selectionChanged = selId !== lastSelectionId;
        
        // Only re-render identity when selection changes
        if (selectionChanged) {
          renderIdentity(st);
          cachedNavcomData = null; // Invalidate cache when selection changes
        }
        
        // Only re-render navcom when selection changes or dataset changes
        if (selectionChanged || datasetChanged || !cachedNavcomData) {
          renderNavcom(st);
          cachedNavcomData = { selId, datasetVersion: lastDatasetVersion };
        }
        
        // Update last selection after rendering
        if (selectionChanged) {
          lastSelectionId = selId;
        }
      }, ['selection', 'dataset']); // Scoped subscription - only listen to selection and dataset changes

      return {
        mount: function (host) {
          host.appendChild(root);
          const st = state.getState();
          renderIdentity(st);
          renderNavcom(st);
        },
        unmount: function () {
          unsubscribe();
          if (root.parentNode) {
            root.parentNode.removeChild(root);
          }
        },
      };
    }

  DM4.panels.IdentityPanel = IdentityPanel;

})(window);
