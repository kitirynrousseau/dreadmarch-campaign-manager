;(function () {
  // DM4 PANELS EDITOR MODULE
  if (!window.DM4 || !window.DM4.config) {
    console.error("[DREADMARCH][EDITOR] DM4 runtime not initialized.");
    return;
  }
  var DM4 = window.DM4;
  const DM4_DEBUG = !!(DM4.config && DM4.config.debug);
  DM4.panels = DM4.panels || {};
  DM4.editor = DM4.editor || {};


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

    // Helper: Calculate grid from coordinates
    function calculateGrid(coords, gridConfig) {
      var cellSize = (gridConfig && gridConfig.cell_size) || [1500, 1500];
      var colIndex = Math.floor(coords[0] / cellSize[0]);
      var rowIndex = Math.floor(coords[1] / cellSize[1]);
      var col = String.fromCharCode(65 + colIndex); // A=65
      var row = rowIndex + 1;
      return {
        col: col,
        row: row,
        grid: col + "-" + row
      };
    }

    // Apply: add_system
    function dm4ApplyAddSystem(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var systemId = payload.system_id;
      var coords = payload.coords;
      var sector = payload.sector || "Unknown Sector";
      var grid = payload.grid;

      if (!systemId) {
        var msg = "add_system job missing system_id";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      if (!coords || !Array.isArray(coords) || coords.length < 2) {
        var coordsMsg = "add_system job missing or invalid coords for '" + systemId + "'";
        if (strict) throw new Error(coordsMsg);
        return { applied: false, message: coordsMsg };
      }

      var systems = db5.systems || {};
      if (systems[systemId]) {
        var existsMsg = "System '" + systemId + "' already exists in DB5; cannot add.";
        if (strict) throw new Error(existsMsg);
        return { applied: false, message: existsMsg };
      }

      // Auto-calculate grid if not provided
      if (!grid || !grid.grid) {
        var gridConfig = (db5.dataset_metadata && db5.dataset_metadata.galactic_grid) || null;
        grid = calculateGrid(coords, gridConfig);
      }

      systems[systemId] = {
        coords: coords,
        grid: grid,
        sector: sector,
        routes: {
          major: [],
          medium: [],
          minor_neighbors: []
        },
        labels: {},
        editor_notes: payload.editor_notes || ""
      };

      return {
        applied: true,
        message: "Added system '" + systemId + "' at (" + coords[0] + ", " + coords[1] + ") in sector '" + sector + "'"
      };
    }

    // Apply: delete_system  
    function dm4ApplyDeleteSystem(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var systemId = payload.system_id;

      if (!systemId) {
        var msg = "delete_system job missing system_id";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      var systems = db5.systems || {};
      if (!systems[systemId]) {
        var notFoundMsg = "System '" + systemId + "' not found in DB5; cannot delete.";
        if (strict) throw new Error(notFoundMsg);
        return { applied: false, message: notFoundMsg };
      }

      delete systems[systemId];

      // Clean up hyperlane references
      var hyperlanes = db5.hyperlanes || {};
      Object.keys(hyperlanes).forEach(function (routeName) {
        if (routeName === "minor_routes") {
          var minorRoutes = hyperlanes.minor_routes || [];
          hyperlanes.minor_routes = minorRoutes.filter(function (segment) {
            return segment[0] !== systemId && segment[1] !== systemId;
          });
        } else {
          var segments = hyperlanes[routeName] || [];
          hyperlanes[routeName] = segments.filter(function (segment) {
            return segment[0] !== systemId && segment[1] !== systemId;
          });
        }
      });

      // Update routes property on connected systems
      Object.keys(systems).forEach(function (otherId) {
        var otherSys = systems[otherId];
        if (otherSys && otherSys.routes && otherSys.routes.minor_neighbors) {
          otherSys.routes.minor_neighbors = otherSys.routes.minor_neighbors.filter(function (neighbor) {
            return neighbor !== systemId;
          });
        }
      });

      return {
        applied: true,
        message: "Deleted system '" + systemId + "' and cleaned up route references"
      };
    }

    // Apply: update_system
    function dm4ApplyUpdateSystem(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var systemId = payload.system_id;
      var changes = payload.changes || {};

      if (!systemId) {
        var msg = "update_system job missing system_id";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      var systems = db5.systems || {};
      if (!systems[systemId]) {
        var notFoundMsg = "System '" + systemId + "' not found in DB5; cannot update.";
        if (strict) throw new Error(notFoundMsg);
        return { applied: false, message: notFoundMsg };
      }

      var sys = systems[systemId];
      var changesList = [];

      if (changes.coords !== undefined) {
        sys.coords = changes.coords;
        changesList.push("coords -> [" + changes.coords[0] + ", " + changes.coords[1] + "]");
        
        // Recalculate grid if coords changed and grid not explicitly provided
        if (changes.grid === undefined) {
          var gridConfig = (db5.dataset_metadata && db5.dataset_metadata.galactic_grid) || null;
          sys.grid = calculateGrid(changes.coords, gridConfig);
          changesList.push("grid auto-calculated -> " + sys.grid.grid);
        }
      }

      if (changes.grid !== undefined) {
        sys.grid = changes.grid;
        changesList.push("grid -> " + changes.grid.grid);
      }

      if (changes.editor_notes !== undefined) {
        sys.editor_notes = changes.editor_notes;
        changesList.push("editor_notes updated");
      }

      if (changes.labels !== undefined) {
        sys.labels = Object.assign({}, sys.labels || {}, changes.labels);
        changesList.push("labels updated");
      }

      return {
        applied: true,
        message: "Updated system '" + systemId + "': " + changesList.join(", ")
      };
    }

    // Apply: move_system
    function dm4ApplyMoveSystem(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var systemId = payload.system_id;
      var newCoords = payload.new_coords;

      if (!systemId) {
        var msg = "move_system job missing system_id";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      if (!newCoords || !Array.isArray(newCoords) || newCoords.length < 2) {
        var coordsMsg = "move_system job missing or invalid new_coords";
        if (strict) throw new Error(coordsMsg);
        return { applied: false, message: coordsMsg };
      }

      var systems = db5.systems || {};
      if (!systems[systemId]) {
        var notFoundMsg = "System '" + systemId + "' not found in DB5; cannot move.";
        if (strict) throw new Error(notFoundMsg);
        return { applied: false, message: notFoundMsg };
      }

      var sys = systems[systemId];
      var oldCoords = sys.coords;
      sys.coords = newCoords;

      // Recalculate grid
      var gridConfig = (db5.dataset_metadata && db5.dataset_metadata.galactic_grid) || null;
      sys.grid = calculateGrid(newCoords, gridConfig);

      return {
        applied: true,
        message: "Moved system '" + systemId + "' from (" + oldCoords[0] + ", " + oldCoords[1] + ") to (" + newCoords[0] + ", " + newCoords[1] + "), grid -> " + sys.grid.grid
      };
    }

    // ROUTE OPERATIONS

    // Apply: add_hyperlane_segment
    function dm4ApplyAddHyperlaneSegment(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var routeName = payload.route_name;
      var fromSystem = payload.from_system;
      var toSystem = payload.to_system;

      if (!routeName || !fromSystem || !toSystem) {
        var msg = "add_hyperlane_segment job missing required fields";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      var systems = db5.systems || {};
      if (!systems[fromSystem]) {
        var fromMsg = "System '" + fromSystem + "' not found in DB5";
        if (strict) throw new Error(fromMsg);
        return { applied: false, message: fromMsg };
      }
      if (!systems[toSystem]) {
        var toMsg = "System '" + toSystem + "' not found in DB5";
        if (strict) throw new Error(toMsg);
        return { applied: false, message: toMsg };
      }

      var hyperlanes = db5.hyperlanes || {};
      if (!hyperlanes[routeName]) {
        hyperlanes[routeName] = [];
        db5.hyperlanes = hyperlanes;
      }

      // Check if segment already exists
      var exists = hyperlanes[routeName].some(function (seg) {
        return (seg[0] === fromSystem && seg[1] === toSystem) ||
               (seg[0] === toSystem && seg[1] === fromSystem);
      });

      if (exists) {
        return { applied: false, message: "Segment " + fromSystem + " <-> " + toSystem + " already exists in route '" + routeName + "'" };
      }

      hyperlanes[routeName].push([fromSystem, toSystem]);

      // Update route_metadata if it doesn't exist
      var routeMeta = db5.route_metadata || {};
      if (!routeMeta[routeName]) {
        routeMeta[routeName] = { route_class: "medium" };
        db5.route_metadata = routeMeta;
      }

      return {
        applied: true,
        message: "Added segment " + fromSystem + " <-> " + toSystem + " to route '" + routeName + "'"
      };
    }

    // Apply: remove_hyperlane_segment
    function dm4ApplyRemoveHyperlaneSegment(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var routeName = payload.route_name;
      var fromSystem = payload.from_system;
      var toSystem = payload.to_system;

      if (!routeName || !fromSystem || !toSystem) {
        var msg = "remove_hyperlane_segment job missing required fields";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      var hyperlanes = db5.hyperlanes || {};
      if (!hyperlanes[routeName]) {
        var noRouteMsg = "Route '" + routeName + "' not found in DB5";
        if (strict) throw new Error(noRouteMsg);
        return { applied: false, message: noRouteMsg };
      }

      var initialLength = hyperlanes[routeName].length;
      hyperlanes[routeName] = hyperlanes[routeName].filter(function (seg) {
        return !((seg[0] === fromSystem && seg[1] === toSystem) ||
                 (seg[0] === toSystem && seg[1] === fromSystem));
      });

      if (hyperlanes[routeName].length === initialLength) {
        return { applied: false, message: "Segment " + fromSystem + " <-> " + toSystem + " not found in route '" + routeName + "'" };
      }

      return {
        applied: true,
        message: "Removed segment " + fromSystem + " <-> " + toSystem + " from route '" + routeName + "'"
      };
    }

    // Apply: create_route
    function dm4ApplyCreateRoute(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var routeName = payload.route_name;
      var routeClass = payload.route_class || "medium";
      var segments = payload.segments || [];

      if (!routeName) {
        var msg = "create_route job missing route_name";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      var hyperlanes = db5.hyperlanes || {};
      if (hyperlanes[routeName]) {
        var existsMsg = "Route '" + routeName + "' already exists in DB5";
        if (strict) throw new Error(existsMsg);
        return { applied: false, message: existsMsg };
      }

      hyperlanes[routeName] = segments;
      db5.hyperlanes = hyperlanes;

      var routeMeta = db5.route_metadata || {};
      routeMeta[routeName] = { route_class: routeClass };
      db5.route_metadata = routeMeta;

      return {
        applied: true,
        message: "Created route '" + routeName + "' with class '" + routeClass + "' and " + segments.length + " segment(s)"
      };
    }

    // Apply: delete_route
    function dm4ApplyDeleteRoute(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var routeName = payload.route_name;

      if (!routeName) {
        var msg = "delete_route job missing route_name";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      var hyperlanes = db5.hyperlanes || {};
      if (!hyperlanes[routeName]) {
        var notFoundMsg = "Route '" + routeName + "' not found in DB5";
        if (strict) throw new Error(notFoundMsg);
        return { applied: false, message: notFoundMsg };
      }

      delete hyperlanes[routeName];

      var routeMeta = db5.route_metadata || {};
      if (routeMeta[routeName]) {
        delete routeMeta[routeName];
      }

      return {
        applied: true,
        message: "Deleted route '" + routeName + "'"
      };
    }

    // Apply: update_route_metadata
    function dm4ApplyUpdateRouteMetadata(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var routeName = payload.route_name;

      if (!routeName) {
        var msg = "update_route_metadata job missing route_name";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      var routeMeta = db5.route_metadata || {};
      if (!routeMeta[routeName]) {
        routeMeta[routeName] = {};
        db5.route_metadata = routeMeta;
      }

      var changes = [];
      if (payload.route_class !== undefined) {
        routeMeta[routeName].route_class = payload.route_class;
        changes.push("route_class -> " + payload.route_class);
      }

      if (payload.display_name !== undefined) {
        routeMeta[routeName].display_name = payload.display_name;
        changes.push("display_name -> " + payload.display_name);
      }

      return {
        applied: true,
        message: "Updated route metadata for '" + routeName + "': " + changes.join(", ")
      };
    }

    // Apply: add_minor_route
    function dm4ApplyAddMinorRoute(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var fromSystem = payload.from_system;
      var toSystem = payload.to_system;

      if (!fromSystem || !toSystem) {
        var msg = "add_minor_route job missing required fields";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      var systems = db5.systems || {};
      if (!systems[fromSystem]) {
        var fromMsg = "System '" + fromSystem + "' not found in DB5";
        if (strict) throw new Error(fromMsg);
        return { applied: false, message: fromMsg };
      }
      if (!systems[toSystem]) {
        var toMsg = "System '" + toSystem + "' not found in DB5";
        if (strict) throw new Error(toMsg);
        return { applied: false, message: toMsg };
      }

      var hyperlanes = db5.hyperlanes || {};
      if (!hyperlanes.minor_routes) {
        hyperlanes.minor_routes = [];
        db5.hyperlanes = hyperlanes;
      }

      // Check if route already exists
      var exists = hyperlanes.minor_routes.some(function (seg) {
        return (seg[0] === fromSystem && seg[1] === toSystem) ||
               (seg[0] === toSystem && seg[1] === fromSystem);
      });

      if (exists) {
        return { applied: false, message: "Minor route " + fromSystem + " <-> " + toSystem + " already exists" };
      }

      hyperlanes.minor_routes.push([fromSystem, toSystem]);

      return {
        applied: true,
        message: "Added minor route " + fromSystem + " <-> " + toSystem
      };
    }

    // Apply: remove_minor_route
    function dm4ApplyRemoveMinorRoute(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var fromSystem = payload.from_system;
      var toSystem = payload.to_system;

      if (!fromSystem || !toSystem) {
        var msg = "remove_minor_route job missing required fields";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      var hyperlanes = db5.hyperlanes || {};
      if (!hyperlanes.minor_routes) {
        return { applied: false, message: "No minor_routes found in DB5" };
      }

      var initialLength = hyperlanes.minor_routes.length;
      hyperlanes.minor_routes = hyperlanes.minor_routes.filter(function (seg) {
        return !((seg[0] === fromSystem && seg[1] === toSystem) ||
                 (seg[0] === toSystem && seg[1] === fromSystem));
      });

      if (hyperlanes.minor_routes.length === initialLength) {
        return { applied: false, message: "Minor route " + fromSystem + " <-> " + toSystem + " not found" };
      }

      return {
        applied: true,
        message: "Removed minor route " + fromSystem + " <-> " + toSystem
      };
    }

    // SECTOR OPERATIONS

    // Apply: create_sector
    function dm4ApplyCreateSector(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var sectorName = payload.sector_name;

      if (!sectorName) {
        var msg = "create_sector job missing sector_name";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      var sectors = db5.sectors || {};
      if (sectors[sectorName]) {
        var existsMsg = "Sector '" + sectorName + "' already exists in DB5";
        if (strict) throw new Error(existsMsg);
        return { applied: false, message: existsMsg };
      }

      sectors[sectorName] = {};
      db5.sectors = sectors;

      return {
        applied: true,
        message: "Created sector '" + sectorName + "'"
      };
    }

    // Apply: delete_sector
    function dm4ApplyDeleteSector(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var sectorName = payload.sector_name;
      var reassignTo = payload.reassign_to;

      if (!sectorName) {
        var msg = "delete_sector job missing sector_name";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      var systems = db5.systems || {};
      var systemsInSector = [];
      Object.keys(systems).forEach(function (sysId) {
        if (systems[sysId].sector === sectorName) {
          systemsInSector.push(sysId);
        }
      });

      if (systemsInSector.length > 0 && !reassignTo) {
        var hasSystemsMsg = "Sector '" + sectorName + "' has " + systemsInSector.length + " system(s); must provide reassign_to";
        if (strict) throw new Error(hasSystemsMsg);
        return { applied: false, message: hasSystemsMsg };
      }

      // Reassign systems if needed
      if (systemsInSector.length > 0) {
        systemsInSector.forEach(function (sysId) {
          systems[sysId].sector = reassignTo;
        });
      }

      var sectors = db5.sectors || {};
      if (sectors[sectorName]) {
        delete sectors[sectorName];
      }

      return {
        applied: true,
        message: "Deleted sector '" + sectorName + "'" + (systemsInSector.length > 0 ? "; reassigned " + systemsInSector.length + " system(s) to '" + reassignTo + "'" : "")
      };
    }

    // Apply: rename_sector
    function dm4ApplyRenameSector(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};
      var oldName = payload.old_name;
      var newName = payload.new_name;

      if (!oldName || !newName) {
        var msg = "rename_sector job missing old_name or new_name";
        if (strict) throw new Error(msg);
        return { applied: false, message: msg };
      }

      var systems = db5.systems || {};
      var count = 0;
      Object.keys(systems).forEach(function (sysId) {
        if (systems[sysId].sector === oldName) {
          systems[sysId].sector = newName;
          count++;
        }
      });

      var sectors = db5.sectors || {};
      if (sectors[oldName]) {
        sectors[newName] = sectors[oldName];
        delete sectors[oldName];
      }

      return {
        applied: true,
        message: "Renamed sector '" + oldName + "' to '" + newName + "'; updated " + count + " system(s)"
      };
    }

    // METADATA OPERATIONS

    // Apply: update_dataset_metadata
    function dm4ApplyUpdateDatasetMetadata(db5, job, strict) {
      if (strict === undefined) strict = true;
      var payload = job.payload || {};

      var meta = db5.dataset_metadata || {};
      var changes = [];

      if (payload.name !== undefined) {
        meta.name = payload.name;
        changes.push("name -> " + payload.name);
      }

      if (payload.version !== undefined) {
        meta.version = payload.version;
        changes.push("version -> " + payload.version);
      }

      if (payload.description !== undefined) {
        meta.description = payload.description;
        changes.push("description updated");
      }

      db5.dataset_metadata = meta;

      return {
        applied: true,
        message: "Updated dataset metadata: " + changes.join(", ")
      };
    }



    function dm4ApplyEditorJobToDb5(db5, job, strict) {
      var opType = job.op_type || job.type;
      if (opType === "change_sector") {
        return dm4ApplyChangeSector(db5, job, strict);
      }
      if (opType === "add_system") {
        return dm4ApplyAddSystem(db5, job, strict);
      }
      if (opType === "delete_system") {
        return dm4ApplyDeleteSystem(db5, job, strict);
      }
      if (opType === "update_system") {
        return dm4ApplyUpdateSystem(db5, job, strict);
      }
      if (opType === "move_system") {
        return dm4ApplyMoveSystem(db5, job, strict);
      }
      if (opType === "add_hyperlane_segment") {
        return dm4ApplyAddHyperlaneSegment(db5, job, strict);
      }
      if (opType === "remove_hyperlane_segment") {
        return dm4ApplyRemoveHyperlaneSegment(db5, job, strict);
      }
      if (opType === "create_route") {
        return dm4ApplyCreateRoute(db5, job, strict);
      }
      if (opType === "delete_route") {
        return dm4ApplyDeleteRoute(db5, job, strict);
      }
      if (opType === "update_route_metadata") {
        return dm4ApplyUpdateRouteMetadata(db5, job, strict);
      }
      if (opType === "add_minor_route") {
        return dm4ApplyAddMinorRoute(db5, job, strict);
      }
      if (opType === "remove_minor_route") {
        return dm4ApplyRemoveMinorRoute(db5, job, strict);
      }
      if (opType === "create_sector") {
        return dm4ApplyCreateSector(db5, job, strict);
      }
      if (opType === "delete_sector") {
        return dm4ApplyDeleteSector(db5, job, strict);
      }
      if (opType === "rename_sector") {
        return dm4ApplyRenameSector(db5, job, strict);
      }
      if (opType === "update_dataset_metadata") {
        return dm4ApplyUpdateDatasetMetadata(db5, job, strict);
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
      
      if (t === "add_system") {
        return "[" + target + "] add_system: " + (payload.system_id || "?") + " at (" + (payload.coords ? payload.coords[0] : "?") + "," + (payload.coords ? payload.coords[1] : "?") + ")";
      }
      
      if (t === "delete_system") {
        return "[" + target + "] delete_system: " + (payload.system_id || "?");
      }
      
      if (t === "update_system") {
        return "[" + target + "] update_system: " + (payload.system_id || "?");
      }
      
      if (t === "move_system") {
        return "[" + target + "] move_system: " + (payload.system_id || "?") + " to (" + (payload.new_coords ? payload.new_coords[0] : "?") + "," + (payload.new_coords ? payload.new_coords[1] : "?") + ")";
      }
      
      if (t === "add_hyperlane_segment") {
        return "[" + target + "] add_hyperlane_segment: " + (payload.from_system || "?") + " ↔ " + (payload.to_system || "?") + " on " + (payload.route_name || "?");
      }
      
      if (t === "remove_hyperlane_segment") {
        return "[" + target + "] remove_hyperlane_segment: " + (payload.from_system || "?") + " ↔ " + (payload.to_system || "?") + " from " + (payload.route_name || "?");
      }
      
      if (t === "create_route") {
        return "[" + target + "] create_route: " + (payload.route_name || "?") + " (" + (payload.route_class || "medium") + ")";
      }
      
      if (t === "delete_route") {
        return "[" + target + "] delete_route: " + (payload.route_name || "?");
      }
      
      if (t === "update_route_metadata") {
        return "[" + target + "] update_route_metadata: " + (payload.route_name || "?");
      }
      
      if (t === "add_minor_route") {
        return "[" + target + "] add_minor_route: " + (payload.from_system || "?") + " ↔ " + (payload.to_system || "?");
      }
      
      if (t === "remove_minor_route") {
        return "[" + target + "] remove_minor_route: " + (payload.from_system || "?") + " ↔ " + (payload.to_system || "?");
      }
      
      if (t === "create_sector") {
        return "[" + target + "] create_sector: " + (payload.sector_name || "?");
      }
      
      if (t === "delete_sector") {
        return "[" + target + "] delete_sector: " + (payload.sector_name || "?") + (payload.reassign_to ? " → " + payload.reassign_to : "");
      }
      
      if (t === "rename_sector") {
        return "[" + target + "] rename_sector: " + (payload.old_name || "?") + " → " + (payload.new_name || "?");
      }
      
      if (t === "update_dataset_metadata") {
        return "[" + target + "] update_dataset_metadata";
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
      if (opType === "add_system") {
        return dm4ApplyAddSystem(db5, job, strict);
      }
      if (opType === "delete_system") {
        return dm4ApplyDeleteSystem(db5, job, strict);
      }
      if (opType === "update_system") {
        return dm4ApplyUpdateSystem(db5, job, strict);
      }
      if (opType === "move_system") {
        return dm4ApplyMoveSystem(db5, job, strict);
      }
      if (opType === "add_hyperlane_segment") {
        return dm4ApplyAddHyperlaneSegment(db5, job, strict);
      }
      if (opType === "remove_hyperlane_segment") {
        return dm4ApplyRemoveHyperlaneSegment(db5, job, strict);
      }
      if (opType === "create_route") {
        return dm4ApplyCreateRoute(db5, job, strict);
      }
      if (opType === "delete_route") {
        return dm4ApplyDeleteRoute(db5, job, strict);
      }
      if (opType === "update_route_metadata") {
        return dm4ApplyUpdateRouteMetadata(db5, job, strict);
      }
      if (opType === "add_minor_route") {
        return dm4ApplyAddMinorRoute(db5, job, strict);
      }
      if (opType === "remove_minor_route") {
        return dm4ApplyRemoveMinorRoute(db5, job, strict);
      }
      if (opType === "create_sector") {
        return dm4ApplyCreateSector(db5, job, strict);
      }
      if (opType === "delete_sector") {
        return dm4ApplyDeleteSector(db5, job, strict);
      }
      if (opType === "rename_sector") {
        return dm4ApplyRenameSector(db5, job, strict);
      }
      if (opType === "update_dataset_metadata") {
        return dm4ApplyUpdateDatasetMetadata(db5, job, strict);
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

  // Register Editor panel factory on DM4 namespaces
  DM4.editor.PanelFactory = EditorPanel;
  DM4.panels.EditorPanel = EditorPanel;
})(); 
