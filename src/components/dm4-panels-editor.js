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
      var insertIndex = payload.insert_index;

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

      var newSegment = [fromSystem, toSystem];
      
      // Insert at specified position
      if (insertIndex !== undefined && insertIndex !== null && insertIndex >= 0) {
        hyperlanes[routeName].splice(insertIndex, 0, newSegment);
      } else {
        // Default: add to end
        hyperlanes[routeName].push(newSegment);
      }

      // Update route_metadata if it doesn't exist
      var routeMeta = db5.route_metadata || {};
      if (!routeMeta[routeName]) {
        routeMeta[routeName] = { route_class: "medium" };
        db5.route_metadata = routeMeta;
      }

      var positionMsg = "";
      if (insertIndex !== undefined && insertIndex !== null && insertIndex >= 0) {
        positionMsg = " at position " + insertIndex;
      }

      return {
        applied: true,
        message: "Added segment " + fromSystem + " <-> " + toSystem + " to route '" + routeName + "'" + positionMsg
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

    // Helper: derive current dataset id (for job tagging)
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

    // Editor mode indicator (when active)
    const modeIndicator = document.createElement("div");
    modeIndicator.classList.add("dm4-editor-mode-active");
    modeIndicator.style.display = "none";
    inner.appendChild(modeIndicator);

    // Tab buttons container
    const tabsContainer = document.createElement("div");
    tabsContainer.classList.add("dm4-editor-tabs");
    inner.appendChild(tabsContainer);

    var activeTab = "system";

    var tabButtons = {
      system: null,
      routes: null,
      sectors: null,
      meta: null
    };

    ["system", "routes", "sectors", "meta"].forEach(function (tabName) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.classList.add("dm4-editor-tab");
      btn.textContent = tabName.toUpperCase();
      btn.dataset.tab = tabName;
      if (tabName === activeTab) {
        btn.classList.add("active");
      }
      btn.addEventListener("click", function () {
        activeTab = tabName;
        Object.keys(tabButtons).forEach(function (key) {
          tabButtons[key].classList.remove("active");
        });
        btn.classList.add("active");
        render(state.getState());
      });
      tabButtons[tabName] = btn;
      tabsContainer.appendChild(btn);
    });

    // Tab content container
    const tabContent = document.createElement("div");
    tabContent.classList.add("dm4-editor-tab-content");
    inner.appendChild(tabContent);

    // Pending edits section
    const jobsSectionTitle = document.createElement("div");
    jobsSectionTitle.classList.add("dm4-editor-section-title", "dm-text-header");
    jobsSectionTitle.textContent = "PENDING EDITS";
    inner.appendChild(jobsSectionTitle);

    const jobsContent = document.createElement("div");
    jobsContent.classList.add("dm4-editor-section");
    inner.appendChild(jobsContent);

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

    // Reactive render
    function render(st) {
      var editorState = st.editor || { enabled: false, jobs: [], mode: null, pendingData: null };
      var editorOn = !!editorState.enabled;
      var jobs = editorState.jobs || [];
      var editorMode = editorState.mode;

      modeLine.textContent = editorOn ? "EDITOR MODE: ON" : "EDITOR MODE: OFF";

      // Show mode indicator if editor mode is active
      if (editorMode) {
        modeIndicator.style.display = "block";
        modeIndicator.textContent = "MODE: " + editorMode.toUpperCase().replace("_", " ");
      } else {
        modeIndicator.style.display = "none";
      }

      var dataset = st.dataset || {};
      var systems = dataset.systems || {};
      var hyperlanes = dataset.hyperlanes || {};
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

      // Render active tab
      tabContent.innerHTML = "";
      
      if (activeTab === "system") {
        renderSystemTab(tabContent, st, systems, selId, sectorList, jobs);
      } else if (activeTab === "routes") {
        renderRoutesTab(tabContent, st, systems, hyperlanes, jobs);
      } else if (activeTab === "sectors") {
        renderSectorsTab(tabContent, st, systems, sectorList, jobs);
      } else if (activeTab === "meta") {
        renderMetaTab(tabContent, st, dataset, systems, hyperlanes);
      }

      // JOBS SECTION (always visible)
      renderJobsSection(jobsContent, jobs);
    }

    // Render SYSTEM tab
    function renderSystemTab(container, st, systems, selId, sectorList, jobs) {
      if (!selId || !systems[selId]) {
        // No system selected
        var noSel = document.createElement("div");
        noSel.classList.add("dm4-editor-line", "dm-text-body");
        noSel.textContent = "No system selected. Click a system marker to edit.";
        container.appendChild(noSel);

        // Add system mode checkbox
        var addModeLine = document.createElement("div");
        addModeLine.classList.add("dm4-editor-line", "dm-text-body");
        container.appendChild(addModeLine);

        var addModeCheckbox = document.createElement("input");
        addModeCheckbox.type = "checkbox";
        addModeCheckbox.classList.add("dm4-editor-checkbox");
        addModeCheckbox.id = "add-system-mode-checkbox";
        var editorState = st.editor || {};
        if (editorState.mode === "add_system") {
          addModeCheckbox.checked = true;
        }
        addModeLine.appendChild(addModeCheckbox);

        var addModeLabel = document.createElement("label");
        addModeLabel.setAttribute("for", "add-system-mode-checkbox");
        addModeLabel.textContent = "Add System Mode (click on map to place)";
        addModeLine.appendChild(addModeLabel);

        addModeCheckbox.addEventListener("change", function () {
          if (addModeCheckbox.checked) {
            if (state.actions && typeof state.actions.setEditorMode === "function") {
              state.actions.setEditorMode("add_system", null);
            }
          } else {
            if (state.actions && typeof state.actions.clearEditorMode === "function") {
              state.actions.clearEditorMode();
            }
          }
        });
      } else {
        // System selected
        var sys = systems[selId];
        var name = sys.name || selId;
        var sector = sys.sector || "Unknown Sector";
        var grid = (sys.grid && sys.grid.grid) || "UNSPECIFIED";
        var coords = sys.coords || [0, 0];
        var editorNotes = sys.editor_notes || "";

        // System name (editable)
        var nameLine = document.createElement("div");
        nameLine.classList.add("dm4-editor-line", "dm-text-body");
        container.appendChild(nameLine);

        var nameLabel = document.createElement("span");
        nameLabel.textContent = "Name: ";
        nameLine.appendChild(nameLabel);

        var nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.classList.add("dm4-editor-input");
        nameInput.value = name;
        nameInput.style.width = "120px";
        nameLine.appendChild(nameInput);

        var updateNameBtn = document.createElement("button");
        updateNameBtn.type = "button";
        updateNameBtn.textContent = "Update Name";
        updateNameBtn.classList.add("dm4-editor-button");
        nameLine.appendChild(updateNameBtn);

        updateNameBtn.addEventListener("click", function () {
          var newName = nameInput.value.trim();
          if (!newName || newName === name) return;
          var datasetId = getCurrentDatasetId();
          var job = {
            target_dataset: datasetId,
            op_type: "update_system",
            payload: {
              system_id: selId,
              changes: {
                labels: { display: newName }
              }
            },
            created_at: new Date().toISOString()
          };
          if (state.actions && typeof state.actions.addEditorJob === "function") {
            state.actions.addEditorJob(job);
          }
        });

        // Coordinates display
        var coordsLine = document.createElement("div");
        coordsLine.classList.add("dm4-editor-line", "dm-text-body");
        coordsLine.textContent = "Coords: (" + coords[0] + ", " + coords[1] + ") ";
        container.appendChild(coordsLine);

        var moveBtn = document.createElement("button");
        moveBtn.type = "button";
        moveBtn.textContent = "Move on Map";
        moveBtn.classList.add("dm4-editor-button");
        coordsLine.appendChild(moveBtn);

        moveBtn.addEventListener("click", function () {
          if (state.actions && typeof state.actions.setEditorMode === "function") {
            state.actions.setEditorMode("move_system", { system_id: selId });
          }
        });

        // Grid display
        var gridLine = document.createElement("div");
        gridLine.classList.add("dm4-editor-line", "dm-text-body");
        gridLine.textContent = "Grid: " + grid;
        container.appendChild(gridLine);

        // Find latest pending sector change for selected system, if any
        var pendingSector = null;
        for (var i = jobs.length - 1; i >= 0; i--) {
          var j = jobs[i];
          if (
            j &&
            j.op_type === "change_sector" &&
            j.payload &&
            j.payload.system_id === selId
          ) {
            pendingSector = j.payload.new_sector_id || j.payload.newSector || null;
            break;
          }
        }

        // Sector dropdown
        var sectorLine = document.createElement("div");
        sectorLine.classList.add("dm4-editor-line", "dm-text-body");
        sectorLine.textContent = "Sector: ";
        container.appendChild(sectorLine);

        var sectorSelect = document.createElement("select");
        sectorSelect.classList.add("dm4-editor-select", "dm4-editor-input");
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

        var changeSectorBtn = document.createElement("button");
        changeSectorBtn.type = "button";
        changeSectorBtn.textContent = "Change Sector";
        changeSectorBtn.classList.add("dm4-editor-button");
        sectorLine.appendChild(changeSectorBtn);

        changeSectorBtn.addEventListener("click", function () {
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
          if (state.actions && typeof state.actions.addEditorJob === "function") {
            state.actions.addEditorJob(job);
          }
        });

        if (pendingSector && pendingSector !== sector) {
          var pendingLine = document.createElement("div");
          pendingLine.classList.add("dm4-editor-line", "dm-text-body");
          pendingLine.textContent = "Pending sector: " + pendingSector;
          container.appendChild(pendingLine);
        }

        // Editor notes
        var notesLine = document.createElement("div");
        notesLine.classList.add("dm4-editor-line", "dm-text-body");
        notesLine.textContent = "Editor Notes:";
        container.appendChild(notesLine);

        var notesTextarea = document.createElement("textarea");
        notesTextarea.classList.add("dm4-editor-input", "dm4-editor-textarea");
        notesTextarea.value = editorNotes;
        container.appendChild(notesTextarea);

        var saveNotesBtn = document.createElement("button");
        saveNotesBtn.type = "button";
        saveNotesBtn.textContent = "Save Notes";
        saveNotesBtn.classList.add("dm4-editor-button");
        container.appendChild(saveNotesBtn);

        saveNotesBtn.addEventListener("click", function () {
          var newNotes = notesTextarea.value;
          var datasetId = getCurrentDatasetId();
          var job = {
            target_dataset: datasetId,
            op_type: "update_system",
            payload: {
              system_id: selId,
              changes: {
                editor_notes: newNotes
              }
            },
            created_at: new Date().toISOString()
          };
          if (state.actions && typeof state.actions.addEditorJob === "function") {
            state.actions.addEditorJob(job);
          }
        });

        // Delete system button
        var deleteLine = document.createElement("div");
        deleteLine.classList.add("dm4-editor-line", "dm-text-body");
        deleteLine.style.marginTop = "0.5rem";
        container.appendChild(deleteLine);

        var deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete System";
        deleteBtn.classList.add("dm4-editor-button", "dm4-editor-delete-btn");
        deleteLine.appendChild(deleteBtn);

        deleteBtn.addEventListener("click", function () {
          if (!confirm("Delete system '" + name + "'? This will remove all route connections.")) {
            return;
          }
          var datasetId = getCurrentDatasetId();
          var job = {
            target_dataset: datasetId,
            op_type: "delete_system",
            payload: {
              system_id: selId
            },
            created_at: new Date().toISOString()
          };
          if (state.actions && typeof state.actions.addEditorJob === "function") {
            state.actions.addEditorJob(job);
          }
          // Clear selection
          if (state.actions && typeof state.actions.selectSystem === "function") {
            state.actions.selectSystem(null);
          }
        });
      }
    }

    // Render ROUTES tab
    function renderRoutesTab(container, st, systems, hyperlanes, jobs) {
      container.innerHTML = "";
      
      var routeMeta = (st.dataset && st.dataset.route_metadata) || {};
      var systemIds = Object.keys(systems).sort();
      var routeNames = Object.keys(hyperlanes).filter(function(name) {
        return name !== "minor_routes";
      }).sort();
      
      // --- NAMED HYPERLANES SECTION ---
      var hyperlaneSection = document.createElement("div");
      hyperlaneSection.classList.add("dm4-editor-subsection");
      
      var hyperlaneTitle = document.createElement("div");
      hyperlaneTitle.classList.add("dm4-editor-line", "dm-text-header");
      hyperlaneTitle.textContent = "NAMED HYPERLANES";
      hyperlaneSection.appendChild(hyperlaneTitle);
      
      // Route selector row
      var selectorRow = document.createElement("div");
      selectorRow.classList.add("dm4-editor-line", "dm-text-body");
      
      var routeSelect = document.createElement("select");
      routeSelect.classList.add("dm4-editor-select");
      
      var defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.textContent = "Select route...";
      routeSelect.appendChild(defaultOpt);
      
      routeNames.forEach(function(name) {
        var meta = routeMeta[name] || {};
        var cls = meta.route_class || "medium";
        var opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name + " (" + cls + ")";
        routeSelect.appendChild(opt);
      });
      
      // Restore previously selected route from editor state
      var editorState = st.editor || {};
      var selectedRoute = editorState.selectedRoute || "";
      if (selectedRoute && routeNames.indexOf(selectedRoute) >= 0) {
        routeSelect.value = selectedRoute;
      }
      
      selectorRow.appendChild(routeSelect);
      
      // [+ New] button
      var newRouteBtn = document.createElement("button");
      newRouteBtn.type = "button";
      newRouteBtn.textContent = "+ New";
      newRouteBtn.classList.add("dm4-editor-button");
      selectorRow.appendChild(newRouteBtn);
      
      hyperlaneSection.appendChild(selectorRow);
      
      // New route form (hidden by default)
      var newRouteForm = document.createElement("div");
      newRouteForm.classList.add("dm4-editor-new-route-form");
      newRouteForm.style.display = "none";
      
      var newRouteNameLabel = document.createElement("div");
      newRouteNameLabel.classList.add("dm4-editor-line", "dm-text-body");
      newRouteNameLabel.textContent = "Route Name: ";
      
      var newRouteNameInput = document.createElement("input");
      newRouteNameInput.type = "text";
      newRouteNameInput.classList.add("dm4-editor-input");
      newRouteNameInput.placeholder = "Enter route name";
      newRouteNameLabel.appendChild(newRouteNameInput);
      newRouteForm.appendChild(newRouteNameLabel);
      
      var newRouteClassLabel = document.createElement("div");
      newRouteClassLabel.classList.add("dm4-editor-line", "dm-text-body");
      newRouteClassLabel.textContent = "Class: ";
      
      var newRouteClassSelect = document.createElement("select");
      newRouteClassSelect.classList.add("dm4-editor-select");
      ["medium", "major"].forEach(function(cls) {
        var opt = document.createElement("option");
        opt.value = cls;
        opt.textContent = cls;
        newRouteClassSelect.appendChild(opt);
      });
      newRouteClassLabel.appendChild(newRouteClassSelect);
      
      var createRouteBtn = document.createElement("button");
      createRouteBtn.type = "button";
      createRouteBtn.textContent = "Create";
      createRouteBtn.classList.add("dm4-editor-button");
      createRouteBtn.addEventListener("click", function() {
        var newName = newRouteNameInput.value.trim();
        if (!newName) {
          alert("Please enter a route name");
          return;
        }
        if (routeNames.indexOf(newName) >= 0) {
          alert("Route '" + newName + "' already exists");
          return;
        }
        
        var datasetId = getCurrentDatasetId();
        var job = {
          target_dataset: datasetId,
          op_type: "create_route",
          payload: {
            route_name: newName,
            route_class: newRouteClassSelect.value,
            segments: []
          },
          created_at: new Date().toISOString()
        };
        
        if (state.actions && typeof state.actions.addEditorJob === "function") {
          state.actions.addEditorJob(job);
        }
        
        // Clear form and hide it
        newRouteNameInput.value = "";
        newRouteForm.style.display = "none";
        
        // Select the newly created route
        setTimeout(function() {
          routeSelect.value = newName;
          renderRouteDetails(routeDetails, newName, hyperlanes, routeMeta, systemIds, state);
        }, 100);
      });
      newRouteClassLabel.appendChild(createRouteBtn);
      newRouteForm.appendChild(newRouteClassLabel);
      
      hyperlaneSection.appendChild(newRouteForm);
      
      // Selected route details (shown when route selected)
      var routeDetails = document.createElement("div");
      routeDetails.classList.add("dm4-editor-route-details");
      hyperlaneSection.appendChild(routeDetails);
      
      container.appendChild(hyperlaneSection);
      
      // --- MINOR ROUTES SECTION ---
      var minorSection = document.createElement("div");
      minorSection.classList.add("dm4-editor-subsection");
      
      var minorTitle = document.createElement("div");
      minorTitle.classList.add("dm4-editor-line", "dm-text-header");
      minorTitle.textContent = "MINOR ROUTES";
      minorSection.appendChild(minorTitle);
      
      // Add minor route form
      var addMinorRow = document.createElement("div");
      addMinorRow.classList.add("dm4-editor-line", "dm-text-body");
      
      var minorFromSelect = document.createElement("select");
      minorFromSelect.classList.add("dm4-editor-select");
      var minorToSelect = document.createElement("select");
      minorToSelect.classList.add("dm4-editor-select");
      
      var defaultMinorFrom = document.createElement("option");
      defaultMinorFrom.value = "";
      defaultMinorFrom.textContent = "From...";
      minorFromSelect.appendChild(defaultMinorFrom);
      
      var defaultMinorTo = document.createElement("option");
      defaultMinorTo.value = "";
      defaultMinorTo.textContent = "To...";
      minorToSelect.appendChild(defaultMinorTo);
      
      systemIds.forEach(function(id) {
        var optFrom = document.createElement("option");
        optFrom.value = id;
        optFrom.textContent = id;
        minorFromSelect.appendChild(optFrom);
        
        var optTo = document.createElement("option");
        optTo.value = id;
        optTo.textContent = id;
        minorToSelect.appendChild(optTo);
      });
      
      addMinorRow.appendChild(minorFromSelect);
      addMinorRow.appendChild(document.createTextNode(" ↔ "));
      addMinorRow.appendChild(minorToSelect);
      
      var addMinorBtn = document.createElement("button");
      addMinorBtn.type = "button";
      addMinorBtn.textContent = "Add";
      addMinorBtn.classList.add("dm4-editor-button");
      addMinorBtn.addEventListener("click", function() {
        if (minorFromSelect.value && minorToSelect.value && minorFromSelect.value !== minorToSelect.value) {
          var datasetId = getCurrentDatasetId();
          state.actions.addEditorJob({
            target_dataset: datasetId,
            op_type: "add_minor_route",
            payload: { from_system: minorFromSelect.value, to_system: minorToSelect.value },
            created_at: new Date().toISOString()
          });
        }
      });
      addMinorRow.appendChild(addMinorBtn);
      minorSection.appendChild(addMinorRow);
      
      // Show existing minor routes for selected system
      var selId = st.selection && st.selection.system;
      if (selId) {
        var minorRoutes = hyperlanes.minor_routes || [];
        var connectedMinors = minorRoutes.filter(function(seg) {
          return seg[0] === selId || seg[1] === selId;
        });
        
        if (connectedMinors.length > 0) {
          var minorListTitle = document.createElement("div");
          minorListTitle.classList.add("dm4-editor-line", "dm-text-body");
          minorListTitle.textContent = "Connected to " + selId + ":";
          minorSection.appendChild(minorListTitle);
          
          connectedMinors.forEach(function(seg) {
            var other = seg[0] === selId ? seg[1] : seg[0];
            var minorLine = document.createElement("div");
            minorLine.classList.add("dm4-editor-line", "dm-text-body");
            minorLine.textContent = "  → " + other + " ";
            
            var removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.textContent = "×";
            removeBtn.classList.add("dm4-editor-button", "dm4-editor-remove-btn");
            removeBtn.addEventListener("click", function() {
              var datasetId = getCurrentDatasetId();
              state.actions.addEditorJob({
                target_dataset: datasetId,
                op_type: "remove_minor_route",
                payload: { from_system: selId, to_system: other },
                created_at: new Date().toISOString()
              });
            });
            minorLine.appendChild(removeBtn);
            minorSection.appendChild(minorLine);
          });
        }
      }
      
      container.appendChild(minorSection);
      
      // Event handlers
      routeSelect.addEventListener("change", function() {
        // Store selected route in state to preserve across re-renders
        if (state.actions && typeof state.actions.setSelectedRoute === "function") {
          state.actions.setSelectedRoute(routeSelect.value || null);
        }
        renderRouteDetails(routeDetails, routeSelect.value, hyperlanes, routeMeta, systemIds, state);
      });
      
      newRouteBtn.addEventListener("click", function() {
        newRouteForm.style.display = newRouteForm.style.display === "none" ? "block" : "none";
      });
      
      // Render route details if there's a selected route
      if (selectedRoute) {
        renderRouteDetails(routeDetails, selectedRoute, hyperlanes, routeMeta, systemIds, state);
      }
    }

    // Helper function to render route details
    function renderRouteDetails(container, routeName, hyperlanes, routeMeta, systemIds, state) {
      container.innerHTML = "";
      
      if (!routeName) return;
      
      var segments = hyperlanes[routeName] || [];
      var meta = routeMeta[routeName] || {};
      var currentClass = meta.route_class || "medium";
      
      // Route name display
      var nameRow = document.createElement("div");
      nameRow.classList.add("dm4-editor-line", "dm-text-body");
      nameRow.textContent = "Route: " + routeName;
      container.appendChild(nameRow);
      
      // Class selector
      var classRow = document.createElement("div");
      classRow.classList.add("dm4-editor-line", "dm-text-body");
      classRow.textContent = "Class: ";
      
      var classSelect = document.createElement("select");
      classSelect.classList.add("dm4-editor-select");
      ["major", "medium"].forEach(function(cls) {
        var opt = document.createElement("option");
        opt.value = cls;
        opt.textContent = cls;
        if (cls === currentClass) opt.selected = true;
        classSelect.appendChild(opt);
      });
      classRow.appendChild(classSelect);
      
      var updateClassBtn = document.createElement("button");
      updateClassBtn.type = "button";
      updateClassBtn.textContent = "Update";
      updateClassBtn.classList.add("dm4-editor-button");
      updateClassBtn.addEventListener("click", function() {
        if (classSelect.value !== currentClass) {
          var datasetId = getCurrentDatasetId();
          state.actions.addEditorJob({
            target_dataset: datasetId,
            op_type: "update_route_metadata",
            payload: { route_name: routeName, route_class: classSelect.value },
            created_at: new Date().toISOString()
          });
        }
      });
      classRow.appendChild(updateClassBtn);
      container.appendChild(classRow);
      
      // Segments list
      var segTitle = document.createElement("div");
      segTitle.classList.add("dm4-editor-line", "dm-text-body");
      segTitle.textContent = "Segments (" + segments.length + "):";
      container.appendChild(segTitle);
      
      segments.forEach(function(seg) {
        var segLine = document.createElement("div");
        segLine.classList.add("dm4-editor-line", "dm-text-body");
        segLine.textContent = "  " + seg[0] + " ↔ " + seg[1] + " ";
        
        var removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.textContent = "×";
        removeBtn.classList.add("dm4-editor-button", "dm4-editor-remove-btn");
        removeBtn.addEventListener("click", function() {
          var datasetId = getCurrentDatasetId();
          state.actions.addEditorJob({
            target_dataset: datasetId,
            op_type: "remove_hyperlane_segment",
            payload: { route_name: routeName, from_system: seg[0], to_system: seg[1] },
            created_at: new Date().toISOString()
          });
        });
        segLine.appendChild(removeBtn);
        container.appendChild(segLine);
      });
      
      // Add segment form
      var addSegTitle = document.createElement("div");
      addSegTitle.classList.add("dm4-editor-line", "dm-text-body");
      addSegTitle.textContent = "Add Segment:";
      container.appendChild(addSegTitle);
      
      // Position selector row
      var positionRow = document.createElement("div");
      positionRow.classList.add("dm4-editor-line", "dm-text-body");
      positionRow.textContent = "Position: ";
      
      var positionSelect = document.createElement("select");
      positionSelect.classList.add("dm4-editor-select");
      
      var endOpt = document.createElement("option");
      endOpt.value = "end";
      endOpt.textContent = "End";
      positionSelect.appendChild(endOpt);
      
      var startOpt = document.createElement("option");
      startOpt.value = "start";
      startOpt.textContent = "Start";
      positionSelect.appendChild(startOpt);
      
      // Add "After segment N" options
      segments.forEach(function(seg, idx) {
        var afterOpt = document.createElement("option");
        afterOpt.value = "after-" + idx;
        afterOpt.textContent = "After segment " + (idx + 1) + " (" + seg[0] + " ↔ " + seg[1] + ")";
        positionSelect.appendChild(afterOpt);
      });
      
      positionRow.appendChild(positionSelect);
      container.appendChild(positionRow);
      
      var addSegRow = document.createElement("div");
      addSegRow.classList.add("dm4-editor-line", "dm-text-body");
      
      var fromSelect = document.createElement("select");
      fromSelect.classList.add("dm4-editor-select");
      var toSelect = document.createElement("select");
      toSelect.classList.add("dm4-editor-select");
      
      var defaultFrom = document.createElement("option");
      defaultFrom.value = "";
      defaultFrom.textContent = "From...";
      fromSelect.appendChild(defaultFrom);
      
      var defaultTo = document.createElement("option");
      defaultTo.value = "";
      defaultTo.textContent = "To...";
      toSelect.appendChild(defaultTo);
      
      systemIds.forEach(function(id) {
        var optFrom = document.createElement("option");
        optFrom.value = id;
        optFrom.textContent = id;
        fromSelect.appendChild(optFrom);
        
        var optTo = document.createElement("option");
        optTo.value = id;
        optTo.textContent = id;
        toSelect.appendChild(optTo);
      });
      
      addSegRow.appendChild(fromSelect);
      addSegRow.appendChild(document.createTextNode(" ↔ "));
      addSegRow.appendChild(toSelect);
      
      var addSegBtn = document.createElement("button");
      addSegBtn.type = "button";
      addSegBtn.textContent = "Add";
      addSegBtn.classList.add("dm4-editor-button");
      addSegBtn.addEventListener("click", function() {
        if (fromSelect.value && toSelect.value && fromSelect.value !== toSelect.value) {
          var datasetId = getCurrentDatasetId();
          var position = positionSelect.value;
          var insertIndex = -1; // -1 means end
          
          if (position === "start") {
            insertIndex = 0;
          } else if (position.indexOf("after-") === 0) {
            var afterIdx = parseInt(position.substring(6), 10);
            insertIndex = afterIdx + 1;
          }
          
          state.actions.addEditorJob({
            target_dataset: datasetId,
            op_type: "add_hyperlane_segment",
            payload: { 
              route_name: routeName, 
              from_system: fromSelect.value, 
              to_system: toSelect.value,
              insert_index: insertIndex
            },
            created_at: new Date().toISOString()
          });
        }
      });
      addSegRow.appendChild(addSegBtn);
      container.appendChild(addSegRow);
      
      // Map mode checkbox
      var mapModeRow = document.createElement("div");
      mapModeRow.classList.add("dm4-editor-line", "dm-text-body");
      var mapModeCheck = document.createElement("input");
      mapModeCheck.type = "checkbox";
      mapModeCheck.classList.add("dm4-editor-checkbox");
      mapModeCheck.id = "add-segment-map-mode";
      
      // Check if map mode is active for this route
      var editorState = state.getState ? state.getState().editor : {};
      var isMapModeActive = editorState.mode === "add_segment" && 
                           editorState.pendingData && 
                           editorState.pendingData.route_name === routeName;
      mapModeCheck.checked = isMapModeActive;
      
      var mapModeLabel = document.createElement("label");
      mapModeLabel.htmlFor = "add-segment-map-mode";
      mapModeLabel.textContent = " Click on map to select systems";
      mapModeRow.appendChild(mapModeCheck);
      mapModeRow.appendChild(mapModeLabel);
      
      mapModeCheck.addEventListener("change", function() {
        if (mapModeCheck.checked) {
          state.actions.setEditorMode("add_segment", { route_name: routeName, from_system: null });
        } else {
          state.actions.clearEditorMode();
        }
      });
      container.appendChild(mapModeRow);
      
      // Delete route button
      var deleteRow = document.createElement("div");
      deleteRow.classList.add("dm4-editor-line", "dm-text-body");
      deleteRow.style.marginTop = "0.5rem";
      var deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "Delete Route";
      deleteBtn.classList.add("dm4-editor-button", "dm4-editor-delete-btn");
      deleteBtn.addEventListener("click", function() {
        if (confirm("Delete route '" + routeName + "' and all its segments?")) {
          var datasetId = getCurrentDatasetId();
          state.actions.addEditorJob({
            target_dataset: datasetId,
            op_type: "delete_route",
            payload: { route_name: routeName },
            created_at: new Date().toISOString()
          });
        }
      });
      deleteRow.appendChild(deleteBtn);
      container.appendChild(deleteRow);
    }

    // Render SECTORS tab
    function renderSectorsTab(container, st, systems, sectorList, jobs) {
      // Build sector system counts
      var sectorCounts = {};
      Object.keys(systems).forEach(function (sysId) {
        var sys = systems[sysId];
        var sec = sys.sector || "Unknown Sector";
        sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;
      });

      var headerLine = document.createElement("div");
      headerLine.classList.add("dm4-editor-line", "dm-text-body");
      headerLine.textContent = "Sectors (" + sectorList.length + "):";
      container.appendChild(headerLine);

      // List sectors
      sectorList.forEach(function (secName) {
        var secLine = document.createElement("div");
        secLine.classList.add("dm4-editor-line", "dm-text-body");
        secLine.textContent = secName + " (" + (sectorCounts[secName] || 0) + " systems)";
        container.appendChild(secLine);
      });

      // Create new sector
      var createLine = document.createElement("div");
      createLine.classList.add("dm4-editor-line", "dm-text-body");
      createLine.style.marginTop = "0.5rem";
      container.appendChild(createLine);

      var newSectorInput = document.createElement("input");
      newSectorInput.type = "text";
      newSectorInput.classList.add("dm4-editor-input");
      newSectorInput.placeholder = "New sector name";
      newSectorInput.style.width = "120px";
      createLine.appendChild(newSectorInput);

      var createBtn = document.createElement("button");
      createBtn.type = "button";
      createBtn.textContent = "Create Sector";
      createBtn.classList.add("dm4-editor-button");
      createLine.appendChild(createBtn);

      createBtn.addEventListener("click", function () {
        var newName = newSectorInput.value.trim();
        if (!newName) return;
        if (sectorList.indexOf(newName) >= 0) {
          alert("Sector '" + newName + "' already exists.");
          return;
        }
        var datasetId = getCurrentDatasetId();
        var job = {
          target_dataset: datasetId,
          op_type: "create_sector",
          payload: {
            sector_name: newName
          },
          created_at: new Date().toISOString()
        };
        if (state.actions && typeof state.actions.addEditorJob === "function") {
          state.actions.addEditorJob(job);
        }
        newSectorInput.value = "";
      });
    }

    // Render META tab
    function renderMetaTab(container, st, dataset, systems, hyperlanes) {
      var metadata = dataset.dataset_metadata || {};

      var nameLine = document.createElement("div");
      nameLine.classList.add("dm4-editor-line", "dm-text-body");
      nameLine.textContent = "Dataset Name: ";
      container.appendChild(nameLine);

      var nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.classList.add("dm4-editor-input");
      nameInput.value = metadata.name || "";
      nameInput.style.width = "150px";
      nameLine.appendChild(nameInput);

      var saveNameBtn = document.createElement("button");
      saveNameBtn.type = "button";
      saveNameBtn.textContent = "Save";
      saveNameBtn.classList.add("dm4-editor-button");
      nameLine.appendChild(saveNameBtn);

      saveNameBtn.addEventListener("click", function () {
        var newName = nameInput.value.trim();
        var datasetId = getCurrentDatasetId();
        var job = {
          target_dataset: datasetId,
          op_type: "update_dataset_metadata",
          payload: {
            changes: {
              name: newName
            }
          },
          created_at: new Date().toISOString()
        };
        if (state.actions && typeof state.actions.addEditorJob === "function") {
          state.actions.addEditorJob(job);
        }
      });

      // Version
      var versionLine = document.createElement("div");
      versionLine.classList.add("dm4-editor-line", "dm-text-body");
      versionLine.textContent = "Version: ";
      container.appendChild(versionLine);

      var versionInput = document.createElement("input");
      versionInput.type = "text";
      versionInput.classList.add("dm4-editor-input");
      versionInput.value = metadata.version || "";
      versionInput.style.width = "80px";
      versionLine.appendChild(versionInput);

      var saveVersionBtn = document.createElement("button");
      saveVersionBtn.type = "button";
      saveVersionBtn.textContent = "Save";
      saveVersionBtn.classList.add("dm4-editor-button");
      versionLine.appendChild(saveVersionBtn);

      saveVersionBtn.addEventListener("click", function () {
        var newVersion = versionInput.value.trim();
        var datasetId = getCurrentDatasetId();
        var job = {
          target_dataset: datasetId,
          op_type: "update_dataset_metadata",
          payload: {
            changes: {
              version: newVersion
            }
          },
          created_at: new Date().toISOString()
        };
        if (state.actions && typeof state.actions.addEditorJob === "function") {
          state.actions.addEditorJob(job);
        }
      });

      // Description
      var descLine = document.createElement("div");
      descLine.classList.add("dm4-editor-line", "dm-text-body");
      descLine.textContent = "Description:";
      container.appendChild(descLine);

      var descTextarea = document.createElement("textarea");
      descTextarea.classList.add("dm4-editor-input", "dm4-editor-textarea");
      descTextarea.value = metadata.description || "";
      container.appendChild(descTextarea);

      var saveDescBtn = document.createElement("button");
      saveDescBtn.type = "button";
      saveDescBtn.textContent = "Save";
      saveDescBtn.classList.add("dm4-editor-button");
      container.appendChild(saveDescBtn);

      saveDescBtn.addEventListener("click", function () {
        var newDesc = descTextarea.value;
        var datasetId = getCurrentDatasetId();
        var job = {
          target_dataset: datasetId,
          op_type: "update_dataset_metadata",
          payload: {
            changes: {
              description: newDesc
            }
          },
          created_at: new Date().toISOString()
        };
        if (state.actions && typeof state.actions.addEditorJob === "function") {
          state.actions.addEditorJob(job);
        }
      });

      // Statistics
      var statsLine = document.createElement("div");
      statsLine.classList.add("dm4-editor-line", "dm-text-body");
      statsLine.style.marginTop = "0.5rem";
      statsLine.textContent = "Statistics:";
      container.appendChild(statsLine);

      var systemCount = Object.keys(systems).length;
      var sectorSet = {};
      Object.keys(systems).forEach(function (sysId) {
        var sec = systems[sysId].sector;
        if (sec) sectorSet[sec] = true;
      });
      var sectorCount = Object.keys(sectorSet).length;

      var namedRouteCount = 0;
      var minorRouteCount = 0;
      if (hyperlanes) {
        Object.keys(hyperlanes).forEach(function (key) {
          if (key === "minor_routes") {
            minorRouteCount = (hyperlanes[key] || []).length;
          } else {
            namedRouteCount++;
          }
        });
      }

      var stat1 = document.createElement("div");
      stat1.classList.add("dm4-editor-line", "dm-text-body");
      stat1.textContent = "  Total systems: " + systemCount;
      container.appendChild(stat1);

      var stat2 = document.createElement("div");
      stat2.classList.add("dm4-editor-line", "dm-text-body");
      stat2.textContent = "  Total sectors: " + sectorCount;
      container.appendChild(stat2);

      var stat3 = document.createElement("div");
      stat3.classList.add("dm4-editor-line", "dm-text-body");
      stat3.textContent = "  Named routes: " + namedRouteCount;
      container.appendChild(stat3);

      var stat4 = document.createElement("div");
      stat4.classList.add("dm4-editor-line", "dm-text-body");
      stat4.textContent = "  Minor route connections: " + minorRouteCount;
      container.appendChild(stat4);
    }

    // Render jobs section
    function renderJobsSection(container, jobs) {
      container.innerHTML = "";

      if (!jobs.length) {
        var none = document.createElement("div");
        none.classList.add("dm4-editor-line", "dm-text-body");
        none.textContent = "No pending edits recorded.";
        container.appendChild(none);
      } else {
        var maxShow = 8;
        for (var k = 0; k < jobs.length && k < maxShow; k++) {
          var jobLine = document.createElement("div");
          jobLine.classList.add("dm4-editor-line", "dm-text-body");
          jobLine.textContent = describeJob(jobs[k]);
          container.appendChild(jobLine);
        }
        if (jobs.length > maxShow) {
          var moreLine = document.createElement("div");
          moreLine.classList.add("dm4-editor-line", "dm-text-small");
          moreLine.textContent =
            "+ " + (jobs.length - maxShow) + " more edit(s) not shown.";
          container.appendChild(moreLine);
        }

        var controls = document.createElement("div");
        controls.classList.add("dm4-editor-line", "dm-text-body");
        container.appendChild(controls);

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

        var applyBtn = document.createElement("button");
        applyBtn.type = "button";
        applyBtn.textContent = "Apply Changes";
        applyBtn.classList.add("dm4-editor-button", "dm4-editor-build-btn");
        controls.appendChild(applyBtn);

        applyBtn.addEventListener("click", function () {
          var st = state.getState ? state.getState() : null;
          if (!st || !st.editor) {
            alert("No editor state available to apply changes.");
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

          if (logs && logs.length) {
            DM4.Logger.log("[EDITOR] Changes applied. Summary:");
            for (var i = 0; i < logs.length; i++) {
              DM4.Logger.log("  " + logs[i]);
            }
            alert("Changes applied successfully! Check console for details.");
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
