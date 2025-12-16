;(function () {
  // DM4 MAP & LAYERS MODULE
  if (!window.DM4 || !window.DM4.config) {
    console.error("[DREADMARCH][MAP] DM4 runtime not initialized.");
    return;
  }
  var DM4 = window.DM4;
  const DM4_DEBUG = !!(DM4.config && DM4.config.debug);
  DM4.map = DM4.map || {};


/****************************************
   * 4) MAP: SYSTEM MARKERS & ROUTE LAYER
   ****************************************/
  
  // DM4_HELPER_FUNCTION: createSpatialIndex
  // Simple grid-based spatial index for efficient viewport culling
  // NOTE: This spatial index enables future viewport-based virtualization.
  // When implemented, it will allow rendering only visible markers/labels
  // by querying the index with the current viewport bounds.
  // For datasets with 100+ systems, this provides significant performance gains.
  function createSpatialIndex(systems, cellSize) {
    const index = new Map();
    const cellSize_ = cellSize || 512; // Default cell size
    
    Object.entries(systems).forEach(function ([id, sys]) {
      const coords = sys.coords || [];
      const x = coords[0];
      const y = coords[1];
      
      if (typeof x !== "number" || typeof y !== "number") return;
      
      const cellX = Math.floor(x / cellSize_);
      const cellY = Math.floor(y / cellSize_);
      const cellKey = cellX + "," + cellY;
      
      if (!index.has(cellKey)) {
        index.set(cellKey, []);
      }
      index.get(cellKey).push({ id: id, x: x, y: y, sys: sys });
    });
    
    return {
      cellSize: cellSize_,
      index: index,
      // Query systems within a bounding box
      query: function(minX, minY, maxX, maxY) {
        const results = [];
        const cellMinX = Math.floor(minX / cellSize_);
        const cellMinY = Math.floor(minY / cellSize_);
        const cellMaxX = Math.floor(maxX / cellSize_);
        const cellMaxY = Math.floor(maxY / cellSize_);
        
        for (let cx = cellMinX; cx <= cellMaxX; cx++) {
          for (let cy = cellMinY; cy <= cellMaxY; cy++) {
            const cellKey = cx + "," + cy;
            const cell = index.get(cellKey);
            if (cell) {
              cell.forEach(function(item) {
                if (item.x >= minX && item.x <= maxX && 
                    item.y >= minY && item.y <= maxY) {
                  results.push(item);
                }
              });
            }
          }
        }
        return results;
      }
    };
  }
  
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
    // Memoized: only updates when selection actually changes
    let lastSelectedMarkerId = null;

    function renderSelection(st) {
      const selected = (st.selection && st.selection.system) || null;
      
      // Skip render if selection hasn't changed (memoization)
      if (selected === lastSelectedMarkerId) {
        return;
      }
      
      // Update previous selection marker
      if (lastSelectedMarkerId && markerById.has(lastSelectedMarkerId)) {
        markerById.get(lastSelectedMarkerId).classList.remove("dm-system-selected");
      }
      
      // Update new selection marker
      if (selected && markerById.has(selected)) {
        markerById.get(selected).classList.add("dm-system-selected");
      }
      
      lastSelectedMarkerId = selected;
    }

    buildMarkers(core.state.getState().dataset);

    // Use scoped subscription - only listen to selection changes
    unsubscribe = state.subscribe(function (st) {
      renderSelection(st);
    }, ['selection']);

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
  // Memoized: only updates when selection actually changes
  let lastSelectedLabelId = null;

  function renderSelection(st) {
    const selected = (st.selection && st.selection.system) || null;
    
    // Skip render if selection hasn't changed (memoization)
    if (selected === lastSelectedLabelId) {
      return;
    }
    
    // Update previous selection label
    if (lastSelectedLabelId && labelById.has(lastSelectedLabelId)) {
      labelById.get(lastSelectedLabelId).classList.remove("dm-system-label-selected");
    }
    
    // Update new selection label
    if (selected && labelById.has(selected)) {
      labelById.get(selected).classList.add("dm-system-label-selected");
    }
    
    lastSelectedLabelId = selected;
  }

  buildLabels(state.getState().dataset);
  // Use scoped subscription - only listen to selection changes
  unsubscribe = state.subscribe(function (st) {
    renderSelection(st);
  }, ['selection']);

  return {
    element: container,
    destroy: function () {
      if (unsubscribe) unsubscribe();
    }
  };
}


// DM4_HELPER_FUNCTION: buildCurvedPolyline
// Generates a smooth curved polyline using Catmull-Rom spline interpolation
function buildCurvedPolyline(points, curvature, samplesPerSegment) {
  if (!points || points.length < 2) return points;
  if (points.length === 2) return points; // No curve needed for single segment
  
  curvature = curvature || 0.35;
  samplesPerSegment = samplesPerSegment || 12;
  
  const result = [];
  
  // Catmull-Rom interpolation between each pair of points
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];
    
    for (let t = 0; t < samplesPerSegment; t++) {
      const u = t / samplesPerSegment;
      const u2 = u * u;
      const u3 = u2 * u;
      
      // Catmull-Rom basis functions with curvature parameter
      const c = curvature;
      const b0 = -c * u3 + 2 * c * u2 - c * u;
      const b1 = (2 - c) * u3 + (c - 3) * u2 + 1;
      const b2 = (c - 2) * u3 + (3 - 2 * c) * u2 + c * u;
      const b3 = c * u3 - c * u2;
      
      const x = b0 * p0[0] + b1 * p1[0] + b2 * p2[0] + b3 * p3[0];
      const y = b0 * p0[1] + b1 * p1[1] + b2 * p2[1] + b3 * p3[1];
      
      result.push([x, y]);
    }
  }
  
  // Add final point
  result.push(points[points.length - 1]);
  
  return result;
}

// DM4_HELPER_FUNCTION: buildRouteNodes
// Builds an ordered list of nodes for a route from its segments
function buildRouteNodes(segments, getPointCoords) {
  if (!segments || segments.length === 0) return [];
  if (segments.length === 1) {
    // Single segment route
    const pair = segments[0];
    if (!Array.isArray(pair) || pair.length < 2) return [];
    const from = getPointCoords(pair[0]);
    const to = getPointCoords(pair[1]);
    if (!from || !to) return [];
    return [from, to];
  }
  
  // Multiple segments - need to order them into a continuous path
  const nodes = [];
  const nodeIds = [];
  const used = new Set();
  
  // Start with first segment
  const first = segments[0];
  if (!Array.isArray(first) || first.length < 2) return [];
  
  nodeIds.push(first[0], first[1]);
  used.add(0);
  
  // Try to chain remaining segments
  let changed = true;
  while (changed && used.size < segments.length) {
    changed = false;
    const lastNodeId = nodeIds[nodeIds.length - 1];
    const firstNodeId = nodeIds[0];
    
    for (let i = 0; i < segments.length; i++) {
      if (used.has(i)) continue;
      const seg = segments[i];
      if (!Array.isArray(seg) || seg.length < 2) continue;
      
      // Try to attach to end
      if (seg[0] === lastNodeId) {
        nodeIds.push(seg[1]);
        used.add(i);
        changed = true;
        break;
      } else if (seg[1] === lastNodeId) {
        nodeIds.push(seg[0]);
        used.add(i);
        changed = true;
        break;
      }
      // Try to attach to beginning
      else if (seg[1] === firstNodeId) {
        nodeIds.unshift(seg[0]);
        used.add(i);
        changed = true;
        break;
      } else if (seg[0] === firstNodeId) {
        nodeIds.unshift(seg[1]);
        used.add(i);
        changed = true;
        break;
      }
    }
  }
  
  // Convert node IDs to coordinates
  for (let i = 0; i < nodeIds.length; i++) {
    const coords = getPointCoords(nodeIds[i]);
    if (coords) {
      nodes.push(coords);
    }
  }
  
  return nodes;
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

    // Build ordered node list for the entire route
    const nodes = buildRouteNodes(segments, getPointCoords);
    if (nodes.length < 2) return;

    // Generate curved polyline for major/medium routes
    const curvature = meta.route_class === "major" ? 0.35 : 0.32;
    const samplesPerSegment = 12;
    const curvedPoints = buildCurvedPolyline(nodes, curvature, samplesPerSegment);

    // Create polyline element
    const polyline = document.createElementNS(svgNS, "polyline");
    const pointsStr = curvedPoints.map(function (pt) {
      return pt[0] + "," + pt[1];
    }).join(" ");
    
    polyline.setAttribute("points", pointsStr);
    polyline.setAttribute("class", cls);
    polyline.setAttribute("data-route-name", routeName);
    
    svg.appendChild(polyline);
    
    // Register polyline for all systems in the route
    segments.forEach(function (pair) {
      if (!Array.isArray(pair) || pair.length < 2) return;
      registerLine(polyline, pair[0], pair[1]);
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
  // Memoized: only updates when selection actually changes
  let lastSelectedRouteId = null;
  let lastSelectedLines = [];

  function renderSelection(st) {
    const selected = (st.selection && st.selection.system) || null;
    
    // Skip render if selection hasn't changed (memoization)
    if (selected === lastSelectedRouteId) {
      return;
    }

    // Clear previous selection styling (only previously selected lines)
    lastSelectedLines.forEach(function (line) {
      line.classList.remove("dm-route-selected");
    });
    lastSelectedLines = [];

    if (!selected) {
      lastSelectedRouteId = null;
      return;
    }

    const list = linesBySystem.get(selected);
    if (!list || !list.length) {
      lastSelectedRouteId = selected;
      return;
    }

    // Apply new selection styling
    list.forEach(function (line) {
      line.classList.add("dm-route-selected");
      lastSelectedLines.push(line);
    });
    
    lastSelectedRouteId = selected;
  }

  // Use scoped subscription - only listen to selection changes
  const unsubscribe = state.subscribe(function (st) {
    renderSelection(st);
  }, ['selection']);

  // Initial render
  renderSelection(state.getState());

  return {
    element: svg,
    destroy: function () {
      if (unsubscribe) unsubscribe();
    }
  };
}


// DM4_CORE_FUNCTION: createGridLayer
function createGridLayer(core) {
  const svgNS = "http://www.w3.org/2000/svg";
  const config = core.config || {};
  const width = config.mapWidth || 4096;
  const height = config.mapHeight || 4096;

  const state = core.state;
  const dataset = state.getState().dataset || {};
  const gridMeta = dataset.galactic_grid || {};
  
  const svg = document.createElementNS(svgNS, "svg");
  svg.classList.add("dm-layer-grid");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", "0 0 " + width + " " + height);

  // Extract grid parameters
  const cellSize = gridMeta.cell_size || [1500, 1500];
  const cellWidth = cellSize[0];
  const cellHeight = cellSize[1];
  
  const refCell = gridMeta.reference_cell || {};
  const refBounds = refCell.bounds || {};
  
  // Reference cell N-17 bounds
  const x0 = refBounds.x_min || 3000;
  const y0 = refBounds.y_min || 1500;
  
  // Column letters: L(-2), M(-1), N(0), O(+1) relative to N
  const colNames = ["L", "M", "N", "O"];
  const colOffsets = [-2, -1, 0, 1];
  
  // Row numbers: 16(-1), 17(0), 18(+1), 19(+2) relative to 17
  const rowNumbers = [16, 17, 18, 19];
  const rowOffsets = [-1, 0, 1, 2];
  
  // Draw vertical grid lines (columns)
  colOffsets.forEach(function (offset, idx) {
    const x = x0 + offset * cellWidth;
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", x);
    line.setAttribute("y1", 0);
    line.setAttribute("x2", x);
    line.setAttribute("y2", height);
    line.setAttribute("class", "grid-major");
    svg.appendChild(line);
  });
  
  // Draw horizontal grid lines (rows)
  rowOffsets.forEach(function (offset, idx) {
    const y = y0 + offset * cellHeight;
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", 0);
    line.setAttribute("y1", y);
    line.setAttribute("x2", width);
    line.setAttribute("y2", y);
    line.setAttribute("class", "grid-major");
    svg.appendChild(line);
  });
  
  // Add grid cell labels
  colOffsets.forEach(function (colOffset, colIdx) {
    rowOffsets.forEach(function (rowOffset, rowIdx) {
      const x = x0 + colOffset * cellWidth;
      const y = y0 + rowOffset * cellHeight;
      
      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("x", x + 20);
      label.setAttribute("y", y + cellHeight - 20);
      label.setAttribute("class", "grid-label");
      label.textContent = colNames[colIdx] + "-" + rowNumbers[rowIdx];
      
      svg.appendChild(label);
    });
  });

  return {
    element: svg,
    destroy: function () {
      // No subscriptions to clean up
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

  const gridLayer = createGridLayer(core);
  const routeLayer = createRouteLayer(core);
  const systemsLayer = createSystemMarkersLayer(core);
  const labelsLayer = createSystemLabelsLayer(core);

  viewport.appendChild(gridLayer.element);
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
      gridLayer.destroy();
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



  // Expose map initializer and utilities on DM4 namespace
  if (typeof initMapLayer === "function") {
    DM4.map.initMapLayer = initMapLayer;
  } else {
    DM4.Logger.error("[MAP] initMapLayer is not defined in dm4-map-layers.js.");
  }
  
  // Expose spatial index for future virtualization features
  if (typeof createSpatialIndex === "function") {
    DM4.map.createSpatialIndex = createSpatialIndex;
  }
})(); 
