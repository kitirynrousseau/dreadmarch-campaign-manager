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


// DM4_CORE_FUNCTION: createGridLayer
function createGridLayer(core) {
  var svgNS = "http://www.w3.org/2000/svg";
  var config = core.config || {};
  var width = config.mapWidth || 6000;
  var height = config.mapHeight || 6000;
  
  var state = core.state;
  var dataset = state.getState().dataset || {};
  var galacticGrid = dataset.galactic_grid || {};
  var refCell = galacticGrid.reference_cell || {};
  var bounds = refCell.bounds || {};
  var cellSize = galacticGrid.cell_size || [null, null];
  
  var svg = document.createElementNS(svgNS, "svg");
  svg.classList.add("dm-layer-grid");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", "0 0 " + width + " " + height);
  
  // Extract grid parameters from dataset
  var x0 = bounds.x_min;
  var y0 = bounds.y_min;
  var cw = cellSize[0];
  var ch = cellSize[1];
  
  if (typeof x0 !== 'number' || typeof y0 !== 'number' || typeof cw !== 'number' || typeof ch !== 'number') {
    DM4.Logger.warn("[GRID] Missing galactic_grid metadata, skipping grid render");
    return { element: svg, destroy: function() {} };
  }
  
  // Draw vertical lines (columns L, M, N, O, P)
  for (var i = -2; i <= 2; i++) {
    var vx = x0 + i * cw;
    var line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", vx);
    line.setAttribute("y1", y0 - 1 * ch);
    line.setAttribute("x2", vx);
    line.setAttribute("y2", y0 + 3 * ch);
    line.setAttribute("class", "grid-major");
    svg.appendChild(line);
  }
  
  // Draw horizontal lines (rows 16, 17, 18, 19, 20)
  for (var j = -1; j <= 3; j++) {
    var hy = y0 + j * ch;
    var line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", x0 - 2 * cw);
    line.setAttribute("y1", hy);
    line.setAttribute("x2", x0 + 2 * cw);
    line.setAttribute("y2", hy);
    line.setAttribute("class", "grid-major");
    svg.appendChild(line);
  }
  
  // Draw grid cell labels
  var colOrigin = galacticGrid.col_origin || 17;
  var rowOrigin = galacticGrid.row_origin || "N";
  
  // Helper: Calculate grid cell identifier
  // Grid uses column letters (L, M, N, O, P) and row numbers (16-20)
  // Reference cell N-17 is at position (0, 0) in the offset system
  // Column N has charCode for 'N', M is 'N'-1, L is 'N'-2, O is 'N'+1, P is 'N'+2
  function getGridCellLabel(colOffset, rowOffset) {
    var colBaseCharCode = rowOrigin.charCodeAt(0);
    var colLetter = String.fromCharCode(colBaseCharCode + colOffset);
    var rowNumber = colOrigin + rowOffset;
    return colLetter + "-" + rowNumber;
  }
  
  for (var i = -2; i <= 2; i++) {
    var vx = x0 + i * cw;
    
    for (var j = -1; j <= 3; j++) {
      var hy = y0 + j * ch;
      
      var labelText = getGridCellLabel(i, j);
      var textEl = document.createElementNS(svgNS, "text");
      textEl.setAttribute("x", vx + 8);
      textEl.setAttribute("y", hy + ch - 8);
      textEl.setAttribute("class", "grid-label");
      textEl.textContent = labelText;
      svg.appendChild(textEl);
    }
  }
  
  return {
    element: svg,
    destroy: function() {}
  };
}


// DM4_CORE_FUNCTION: createRouteLayer


function createRouteLayer(core) {
  const svgNS = "http://www.w3.org/2000/svg";
  const config = core.config || {};
  const width = config.mapWidth || 6000;
  const height = config.mapHeight || 6000;

  const state = core.state;
  const dataset = state.getState().dataset || {};
  const hyperlanes = dataset.hyperlanes || {};
  const routeMeta = dataset.route_metadata || {};
  const systems = dataset.systems || {};
  const endpoints = dataset.endpoint_pixels || {};

  const endpointMeta = dataset.endpoint_metadata || {};

  // DM4_HELPER_FUNCTION: buildRouteNodes
  function buildRouteNodes(segs) {
    if (!segs || !segs.length) return [];
    
    var adj = {};
    segs.forEach(function(pair) {
      var a = pair[0];
      var b = pair[1];
      if (!adj[a]) adj[a] = [];
      if (!adj[b]) adj[b] = [];
      adj[a].push(b);
      adj[b].push(a);
    });
    
    // Find terminal node (degree 1) to start from
    var start = null;
    for (var node in adj) {
      if (adj[node].length === 1) {
        start = node;
        break;
      }
    }
    if (!start) start = segs[0][0];
    
    var routeNodes = [start];
    var prev = null;
    var current = start;
    
    while (true) {
      var neighbors = adj[current] || [];
      var nextNode = null;
      
      for (var i = 0; i < neighbors.length; i++) {
        var n = neighbors[i];
        if (n === prev) continue;
        if (routeNodes.indexOf(n) === -1) {
          nextNode = n;
          break;
        }
      }
      
      if (!nextNode) break;
      routeNodes.push(nextNode);
      prev = current;
      current = nextNode;
    }
    
    return routeNodes;
  }

  // DM4_HELPER_FUNCTION: buildCurvedPolyline
  function buildCurvedPolyline(points, curvature, samplesPerSegment) {
    if (!points || points.length < 2) return [];
    
    var pts = points.map(function(p) { return [p[0], p[1]]; });
    var curvePoints = [];
    curvePoints.push([pts[0][0], pts[0][1]]);
    
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = i > 0 ? pts[i - 1] : pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = i + 2 < pts.length ? pts[i + 2] : pts[i + 1];
      
      for (var s = 1; s <= samplesPerSegment; s++) {
        var t = s / samplesPerSegment;
        var t2 = t * t;
        var t3 = t2 * t;
        
        var c = curvature;
        var q0 = -c * t3 + 2 * c * t2 - c * t;
        var q1 = (2 - c) * t3 + (c - 3) * t2 + 1;
        var q2 = (c - 2) * t3 + (3 - 2 * c) * t2 + c * t;
        var q3 = c * t3 - c * t2;
        
        var x, y;
        if (s === samplesPerSegment) {
          x = p2[0];
          y = p2[1];
        } else {
          x = q0 * p0[0] + q1 * p1[0] + q2 * p2[0] + q3 * p3[0];
          y = q0 * p0[1] + q1 * p1[1] + q2 * p2[1] + q3 * p3[1];
        }
        
        curvePoints.push([Math.round(x), Math.round(y)]);
      }
    }
    
    return curvePoints;
  }

  // DM4_HELPER_FUNCTION: calculateTangentAngle
  // Calculate the angle of the route at an endpoint based on the curve tangent
  function calculateTangentAngle(endpointId, routeId) {
    var ENDPOINT_MATCH_TOLERANCE = 2;
    
    var segments = hyperlanes[routeId];
    if (!segments || !segments.length) return 0;
    
    var routeNodes = buildRouteNodes(segments);
    if (!routeNodes || routeNodes.length < 2) return 0;
    
    var pts = [];
    for (var i = 0; i < routeNodes.length; i++) {
      var coords = getPointCoords(routeNodes[i]);
      if (coords && Array.isArray(coords) && coords.length >= 2) {
        pts.push(coords);
      }
    }
    
    if (pts.length < 2) return 0;
    
    var rMeta = routeMeta[routeId] || {};
    var routeClass = rMeta.route_class || "medium";
    var curvature = routeClass === "major" ? 0.35 : 0.32;
    var samplesPerSegment = 12;
    var curvePoints = buildCurvedPolyline(pts, curvature, samplesPerSegment);
    
    if (!curvePoints || curvePoints.length < 2) return 0;
    
    var endCoords = endpoints[endpointId];
    if (!endCoords || endCoords.length < 2) return 0;
    
    var endX = endCoords[0];
    var endY = endCoords[1];
    
    var distToFirst = Math.sqrt(Math.pow(curvePoints[0][0] - endX, 2) + Math.pow(curvePoints[0][1] - endY, 2));
    var distToLast = Math.sqrt(Math.pow(curvePoints[curvePoints.length - 1][0] - endX, 2) + Math.pow(curvePoints[curvePoints.length - 1][1] - endY, 2));
    
    var dx, dy;
    if (distToFirst < ENDPOINT_MATCH_TOLERANCE && curvePoints.length >= 2) {
      dx = curvePoints[0][0] - curvePoints[1][0];
      dy = curvePoints[0][1] - curvePoints[1][1];
    } else if (distToLast < ENDPOINT_MATCH_TOLERANCE && curvePoints.length >= 2) {
      dx = curvePoints[curvePoints.length - 1][0] - curvePoints[curvePoints.length - 2][0];
      dy = curvePoints[curvePoints.length - 1][1] - curvePoints[curvePoints.length - 2][1];
    } else {
      if (distToFirst < distToLast && curvePoints.length >= 2) {
        dx = curvePoints[0][0] - curvePoints[1][0];
        dy = curvePoints[0][1] - curvePoints[1][1];
      } else if (curvePoints.length >= 2) {
        dx = curvePoints[curvePoints.length - 1][0] - curvePoints[curvePoints.length - 2][0];
        dy = curvePoints[curvePoints.length - 1][1] - curvePoints[curvePoints.length - 2][1];
      } else {
        return 0;
      }
    }
    
    var angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return angle;
  }

  // DM4_HELPER_FUNCTION: buildRouteEdgeMarkers
  function buildRouteEdgeMarkers() {
    var markers = [];
    Object.keys(endpoints).forEach(function (id) {
      var meta = endpointMeta[id];
      if (!meta || meta.role !== "synthetic_edge") return;

      var coords = endpoints[id];
      if (!Array.isArray(coords) || coords.length < 2) return;

      var routeId = meta.route_id;
      if (!routeId) return;

      var rMeta = routeMeta[routeId] || {};
      var routeClass = rMeta.route_class || "minor";
      if (routeClass === "minor") return;

      var tangentAngle = calculateTangentAngle(id, routeId);

      markers.push({
        id: id,
        routeId: routeId,
        routeClass: routeClass,
        x: coords[0],
        y: coords[1],
        angle: tangentAngle
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

  // Route curve configuration
  var MAJOR_ROUTE_CURVATURE = 0.35;
  var MEDIUM_ROUTE_CURVATURE = 0.32;
  var CURVE_SAMPLES_PER_SEGMENT = 12;

  // Render major and medium routes as curved polylines
  Object.keys(hyperlanes).forEach(function (routeName) {
    if (routeName === "minor_routes") return;
    
    var segments = hyperlanes[routeName] || [];
    var meta = routeMeta[routeName] || {};
    var routeClass = meta.route_class || "medium";
    var cls = routeClass === "major" ? "route-major" : "route-medium";
    
    if (!segments.length) return;
    
    // Build ordered path through route nodes
    var routeNodes = buildRouteNodes(segments);
    if (!routeNodes.length) return;
    
    // Get coordinates for each node
    var pts = [];
    for (var i = 0; i < routeNodes.length; i++) {
      var coords = getPointCoords(routeNodes[i]);
      if (coords && Array.isArray(coords) && coords.length >= 2) {
        pts.push(coords);
      }
    }
    
    if (pts.length < 2) return;
    
    // Generate curved path
    var curvature = routeClass === "major" ? MAJOR_ROUTE_CURVATURE : MEDIUM_ROUTE_CURVATURE;
    var curvePoints = buildCurvedPolyline(pts, curvature, CURVE_SAMPLES_PER_SEGMENT);
    
    if (curvePoints.length < 2) return;
    
    // Render as SVG polyline
    var polyline = document.createElementNS(svgNS, "polyline");
    var pointsAttr = curvePoints.map(function(p) {
      return p[0] + "," + p[1];
    }).join(" ");
    
    polyline.setAttribute("points", pointsAttr);
    polyline.setAttribute("class", cls);
    polyline.setAttribute("data-route-name", routeName);
    polyline.setAttribute("fill", "none");
    
    var fromSystem = routeNodes[0];
    var toSystem = routeNodes[routeNodes.length - 1];
    svg.appendChild(polyline);
    registerLine(polyline, fromSystem, toSystem);
  });

  // Minor routes stay as straight lines
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

      var angle = m.angle || 0;

      arrow.setAttribute("transform", "rotate(" + angle + " " + x + " " + y + ")");

      edgesGroup.appendChild(arrow);
    });

    svg.appendChild(edgesGroup);
  }

  // DM4_HELPER_FUNCTION: Route hover detection and labeling
  var routeHoverData = [];
  var currentHoveredRoute = null;
  var HOVER_PROXIMITY_THRESHOLD = 50;
  var HOVER_DWELL_TIME = 350; // ms before hover activates
  var hoverDelayTimer = null;
  var pendingHoverRoute = null;
  var routeHoverTooltip = null; // Fixed tooltip element

  // Build route hover data structure (major and medium routes only)
  Object.keys(hyperlanes).forEach(function (routeName) {
    if (routeName === "minor_routes") return;
    
    var segments = hyperlanes[routeName] || [];
    var meta = routeMeta[routeName] || {};
    var routeClass = meta.route_class || "medium";
    
    if (!segments.length) return;
    
    var routeNodes = buildRouteNodes(segments);
    if (!routeNodes.length) return;
    
    var pts = [];
    for (var i = 0; i < routeNodes.length; i++) {
      var coords = getPointCoords(routeNodes[i]);
      if (coords && Array.isArray(coords) && coords.length >= 2) {
        pts.push(coords);
      }
    }
    
    if (pts.length < 2) return;
    
    var curvature = routeClass === "major" ? MAJOR_ROUTE_CURVATURE : MEDIUM_ROUTE_CURVATURE;
    var curvePoints = buildCurvedPolyline(pts, curvature, CURVE_SAMPLES_PER_SEGMENT);
    
    if (curvePoints.length < 2) return;
    
    // Find the polyline element for this route by querying the SVG directly
    var polylineElement = svg.querySelector('polyline[data-route-name="' + routeName + '"]');
    
    if (polylineElement) {
      routeHoverData.push({
        name: routeName,
        curvePoints: curvePoints,
        polyline: polylineElement
      });
    }
  });

  // DM4_HELPER_FUNCTION: Calculate distance from point to line segment
  function distanceToSegment(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var lengthSquared = dx * dx + dy * dy;
    
    if (lengthSquared === 0) {
      return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }
    
    var t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    
    var closestX = x1 + t * dx;
    var closestY = y1 + t * dy;
    
    return {
      distance: Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY)),
      closestX: closestX,
      closestY: closestY,
      segmentIndex: -1,
      t: t
    };
  }

  // DM4_HELPER_FUNCTION: Find closest point on route
  function findClosestPointOnRoute(px, py, curvePoints) {
    var minDist = Infinity;
    var result = null;
    
    for (var i = 0; i < curvePoints.length - 1; i++) {
      var seg = distanceToSegment(
        px, py,
        curvePoints[i][0], curvePoints[i][1],
        curvePoints[i + 1][0], curvePoints[i + 1][1]
      );
      
      if (seg.distance < minDist) {
        minDist = seg.distance;
        result = {
          distance: seg.distance,
          closestX: seg.closestX,
          closestY: seg.closestY,
          segmentIndex: i,
          t: seg.t
        };
      }
    }
    
    return result;
  }

  // DM4_HELPER_FUNCTION: Calculate tangent angle at point on curve
  function calculateTangentAtPoint(curvePoints, segmentIndex, t) {
    if (segmentIndex < 0 || segmentIndex >= curvePoints.length - 1) return 0;
    
    var p1 = curvePoints[segmentIndex];
    var p2 = curvePoints[segmentIndex + 1];
    
    var dx = p2[0] - p1[0];
    var dy = p2[1] - p1[1];
    
    var angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Normalize angle to keep text readable (never upside down)
    if (angle > 90 || angle < -90) {
      angle = angle + 180;
    }
    
    return angle;
  }

  // DM4_HELPER_FUNCTION: Activate route hover
  function activateRouteHover(route) {
    // Add hover class to polyline
    route.polyline.classList.add("dm-route-hover");
    currentHoveredRoute = route;
    
    // Update tooltip text and make it visible
    if (routeHoverTooltip) {
      routeHoverTooltip.textContent = route.name;
      routeHoverTooltip.classList.add("dm-route-hover-tooltip-visible");
    }
  }
  
  // DM4_HELPER_FUNCTION: Deactivate route hover
  function deactivateRouteHover() {
    // Remove hover class from polyline
    if (currentHoveredRoute) {
      currentHoveredRoute.polyline.classList.remove("dm-route-hover");
      currentHoveredRoute = null;
    }
    
    // Hide tooltip
    if (routeHoverTooltip) {
      routeHoverTooltip.classList.remove("dm-route-hover-tooltip-visible");
    }
  }

  // DM4_HELPER_FUNCTION: Handle route hover
  function handleRouteHover(e) {
    // Find the map container element
    var mapContainer = svg.closest('.dm-map-container');
    if (!mapContainer) return;
    
    var rect = mapContainer.getBoundingClientRect();
    var containerX = e.clientX - rect.left;
    var containerY = e.clientY - rect.top;
    
    // Find viewport element to get transform
    var viewport = svg.parentElement;
    if (!viewport) return;
    
    var transform = viewport.style.transform || "";
    var translateMatch = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
    var scaleMatch = transform.match(/scale\(([^)]+)\)/);
    
    var translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
    var translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;
    var scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
    
    // Convert container coordinates to world coordinates (inverse transform)
    // Forward transform: screenX = worldX * scale + translateX
    // Inverse transform: worldX = (screenX - translateX) / scale
    var worldX = (containerX - translateX) / scale;
    var worldY = (containerY - translateY) / scale;
    
    var closestRoute = null;
    var closestDistance = Infinity;
    
    // Find closest route within threshold
    for (var i = 0; i < routeHoverData.length; i++) {
      var route = routeHoverData[i];
      var result = findClosestPointOnRoute(worldX, worldY, route.curvePoints);
      
      if (result && result.distance < closestDistance && result.distance <= HOVER_PROXIMITY_THRESHOLD) {
        closestDistance = result.distance;
        closestRoute = route;
      }
    }
    
    // Update hover state with dwell time
    if (closestRoute && closestRoute !== currentHoveredRoute) {
      // Don't activate immediately - start dwell timer
      if (pendingHoverRoute !== closestRoute) {
        clearTimeout(hoverDelayTimer);
        pendingHoverRoute = closestRoute;
        hoverDelayTimer = setTimeout(function() {
          activateRouteHover(closestRoute);
          pendingHoverRoute = null;
        }, HOVER_DWELL_TIME);
      }
    } else if (!closestRoute) {
      // Cursor left proximity - clear pending and active hover immediately
      clearTimeout(hoverDelayTimer);
      pendingHoverRoute = null;
      deactivateRouteHover();
    }
  }

  // Track listener target for proper cleanup
  var hoverListenerTarget = null;
  
  // DM4_HELPER_FUNCTION: attachHoverListener
  // Attach mousemove listener to map container (not SVG, which has pointer-events: none)
  function attachHoverListener() {
    var mapContainer = document.querySelector('.dm-map-container');
    if (mapContainer && !hoverListenerTarget) {
      // Create fixed tooltip element (once)
      if (!routeHoverTooltip) {
        routeHoverTooltip = document.createElement("div");
        routeHoverTooltip.className = "dm-route-hover-tooltip";
        mapContainer.appendChild(routeHoverTooltip);
      }
      
      mapContainer.addEventListener("mousemove", handleRouteHover);
      hoverListenerTarget = mapContainer;
    }
  }
  
  // Try to attach listener immediately if container exists
  attachHoverListener();
  
  // If not attached yet, retry after a short delay (during initialization)
  if (!hoverListenerTarget) {
    setTimeout(attachHoverListener, 50);
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
      // Clear hover timer
      clearTimeout(hoverDelayTimer);
      // Remove listener from the correct target (map container, not SVG)
      if (hoverListenerTarget) {
        hoverListenerTarget.removeEventListener("mousemove", handleRouteHover);
        hoverListenerTarget = null;
      }
      // Remove tooltip element
      if (routeHoverTooltip && routeHoverTooltip.parentNode) {
        routeHoverTooltip.parentNode.removeChild(routeHoverTooltip);
        routeHoverTooltip = null;
      }
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
    // Fallback: just treat 0..6000 as world
    minX = 0;
    minY = 0;
    maxX = core.config.mapWidth || 6000;
    maxY = core.config.mapHeight || 6000;
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
