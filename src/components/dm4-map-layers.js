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

  // DM4_HELPER_FUNCTION: createContinuousRoutePath
  // Generate a smooth curved path for an entire route (not just segments)
  // Constants for curve generation
  const CURVE_MAGNITUDE_RATIO = 0.25;    // Curve depth as percentage of segment distance
  const MIN_CURVE_DISTANCE = 100;        // Minimum distance to apply curves
  
  function createContinuousRoutePath(points) {
    if (!points || points.length < 2) return "";
    
    // Start at first point
    var pathData = "M " + points[0][0] + " " + points[0][1];
    
    // For routes with only 2 points, use a simple quadratic curve
    if (points.length === 2) {
      var dx = points[1][0] - points[0][0];
      var dy = points[1][1] - points[0][1];
      var dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < MIN_CURVE_DISTANCE) {
        pathData += " L " + points[1][0] + " " + points[1][1];
      } else {
        // Create smooth curve with control point
        var curveMagnitude = dist * CURVE_MAGNITUDE_RATIO;
        var perpX = -dy / dist;
        var perpY = dx / dist;
        var midX = (points[0][0] + points[1][0]) / 2;
        var midY = (points[0][1] + points[1][1]) / 2;
        var cpX = midX + perpX * curveMagnitude;
        var cpY = midY + perpY * curveMagnitude;
        
        pathData += " Q " + cpX + " " + cpY + " " + points[1][0] + " " + points[1][1];
      }
      return pathData;
    }
    
    // For multi-segment routes, use smooth cubic bezier curves
    for (var i = 1; i < points.length; i++) {
      var p0 = i > 0 ? points[i - 1] : points[i];
      var p1 = points[i];
      var p2 = i < points.length - 1 ? points[i + 1] : points[i];
      
      var dx1 = p1[0] - p0[0];
      var dy1 = p1[1] - p0[1];
      var dx2 = p2[0] - p1[0];
      var dy2 = p2[1] - p1[1];
      
      var dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      if (i === 1) {
        // First segment: use quadratic curve
        var perpX1 = -dy1 / dist1;
        var perpY1 = dx1 / dist1;
        var curveMag1 = dist1 * CURVE_MAGNITUDE_RATIO;
        var cpX1 = (p0[0] + p1[0]) / 2 + perpX1 * curveMag1;
        var cpY1 = (p0[1] + p1[1]) / 2 + perpY1 * curveMag1;
        pathData += " Q " + cpX1 + " " + cpY1 + " " + p1[0] + " " + p1[1];
      } else {
        // Subsequent segments: use smooth cubic curves
        var tangentX = (p2[0] - p0[0]) / 2;
        var tangentY = (p2[1] - p0[1]) / 2;
        
        var cp1X = p0[0] + tangentX * 0.3;
        var cp1Y = p0[1] + tangentY * 0.3;
        var cp2X = p1[0] - tangentX * 0.3;
        var cp2Y = p1[1] - tangentY * 0.3;
        
        pathData += " C " + cp1X + " " + cp1Y + " " + cp2X + " " + cp2Y + " " + p1[0] + " " + p1[1];
      }
    }
    
    return pathData;
  }

  // DM4_HELPER_FUNCTION: buildRouteSegments
  // Collect all segments for each named route to create continuous paths
  function buildRouteSegments() {
    var routeSegments = {};
    
    Object.keys(hyperlanes).forEach(function (routeName) {
      if (routeName === "minor_routes") return;
      
      var segments = hyperlanes[routeName] || [];
      if (!segments.length) return;
      
      // Collect all points in order
      var points = [];
      var pointSet = {};
      
      segments.forEach(function (pair) {
        if (!Array.isArray(pair) || pair.length < 2) return;
        var fromCoords = getPointCoords(pair[0]);
        var toCoords = getPointCoords(pair[1]);
        if (!fromCoords || !toCoords) return;
        
        var fromKey = fromCoords[0] + "," + fromCoords[1];
        var toKey = toCoords[0] + "," + toCoords[1];
        
        if (!pointSet[fromKey]) {
          points.push({ coords: fromCoords, id: pair[0] });
          pointSet[fromKey] = true;
        }
        if (!pointSet[toKey]) {
          points.push({ coords: toCoords, id: pair[1] });
          pointSet[toKey] = true;
        }
      });
      
      routeSegments[routeName] = {
        points: points.map(function(p) { return p.coords; }),
        systems: points.map(function(p) { return p.id; }),
        meta: routeMeta[routeName] || {}
      };
    });
    
    return routeSegments;
  }

  var routeSegments = buildRouteSegments();
  
  Object.keys(routeSegments).forEach(function (routeName) {
    var route = routeSegments[routeName];
    var cls = route.meta.route_class === "major" ? "route-major" : "route-medium";
    
    var path = document.createElementNS(svgNS, "path");
    var pathData = createContinuousRoutePath(route.points);
    path.setAttribute("d", pathData);
    path.setAttribute("class", cls);
    path.setAttribute("data-route-name", routeName);
    
    svg.appendChild(path);
    
    // Register path with all systems along the route
    route.systems.forEach(function(systemId) {
      registerLine(path, systemId, null);
    });
  });

  // Render minor routes individually since they're not connected
  const minorList = hyperlanes.minor_routes || [];
  minorList.forEach(function (pair) {
    if (!Array.isArray(pair) || pair.length < 2) return;
    const from = pair[0];
    const to = pair[1];

    const fromCoords = getPointCoords(from);
    const toCoords = getPointCoords(to);
    if (!fromCoords || !toCoords) return;

    const path = document.createElementNS(svgNS, "path");
    const pathData = createContinuousRoutePath([fromCoords, toCoords]);
    path.setAttribute("d", pathData);

    path.setAttribute("class", "route-minor");
    path.setAttribute("data-route-name", "minor_routes");
    path.setAttribute("data-from", from);
    path.setAttribute("data-to", to);

    svg.appendChild(path);
    registerLine(path, from, to);
  });


  const edgeMarkers = buildRouteEdgeMarkers();
  if (edgeMarkers && edgeMarkers.length) {
    const edgesGroup = document.createElementNS(svgNS, "g");
    edgesGroup.setAttribute("class", "dm4-routes-edges");

    edgeMarkers.forEach(function (m) {
      const x = m.x;
      const y = m.y;

      // Create cleaner arrow design
      const arrowSize = 12;
      const arrowWidth = 8;
      const arrow = document.createElementNS(svgNS, "path");
      arrow.setAttribute("class", "dm4-route-endpoint-arrow route-" + m.routeClass);
      
      // Triangle arrow pointing in the outward direction
      var arrowPath = "M " + x + " " + (y - arrowSize / 2) + 
                      " L " + (x + arrowWidth / 2) + " " + (y + arrowSize / 2) + 
                      " L " + (x - arrowWidth / 2) + " " + (y + arrowSize / 2) + " Z";
      arrow.setAttribute("d", arrowPath);

      // Calculate rotation based on outward direction
      let angle = 0;
      if (m.outwardX === 0 && m.outwardY > 0) {
        angle = 180;
      } else if (m.outwardX === 0 && m.outwardY < 0) {
        angle = 0;
      } else if (m.outwardX > 0 && m.outwardY === 0) {
        angle = 90;
      } else if (m.outwardX < 0 && m.outwardY === 0) {
        angle = -90;
      }

      arrow.setAttribute("transform", "rotate(" + angle + " " + x + " " + y + ")");

      // Route label with system label styling
      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("class", "dm4-route-endpoint-label");
      label.textContent = m.routeId;

      const labelOffset = 24;
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
