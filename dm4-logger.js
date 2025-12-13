;(function () {
  "use strict";

  if (!window.DM4) {
    window.DM4 = {};
  }
  var DM4 = window.DM4;

  /**
   * DREADMARCH LOGGER MODULE
   *
   * Provides centralized error logging and recovery utility to standardize
   * loggable messages and fallback mechanisms across the repository.
   *
   * Methods:
   * - log: For general-purpose log messages
   * - warn: For warnings about recoverable issues
   * - error: For non-fatal errors requiring developer attention
   * - critical: For critical errors requiring fallback mechanisms in production
   */

  var Logger = {
    /**
     * General-purpose log messages
     * @param {string} message - The log message
     * @param {...*} args - Additional arguments to log
     */
    log: function (message) {
      var args = Array.prototype.slice.call(arguments, 1);
      console.log.apply(console, ["[DREADMARCH] " + message].concat(args));
    },

    /**
     * Warnings about recoverable issues
     * @param {string} message - The warning message
     * @param {...*} args - Additional arguments to log
     */
    warn: function (message) {
      var args = Array.prototype.slice.call(arguments, 1);
      console.warn.apply(console, ["[DREADMARCH] " + message].concat(args));
    },

    /**
     * Non-fatal errors requiring developer attention
     * @param {string} message - The error message
     * @param {...*} args - Additional arguments to log
     */
    error: function (message) {
      var args = Array.prototype.slice.call(arguments, 1);
      console.error.apply(console, ["[DREADMARCH] " + message].concat(args));
    },

    /**
     * Critical errors requiring fallback mechanisms in production
     * @param {string} message - The critical error message
     * @param {Function} fallbackFn - Fallback function to execute
     * @param {...*} args - Additional arguments to log
     * @returns {*} The result of the fallback function if provided
     */
    critical: function (message, fallbackFn) {
      var args = Array.prototype.slice.call(arguments, 2);
      console.error.apply(console, ["[DREADMARCH][CRITICAL] " + message].concat(args));
      
      if (typeof fallbackFn === "function") {
        try {
          return fallbackFn();
        } catch (err) {
          console.error("[DREADMARCH][CRITICAL] Fallback execution failed:", err);
          return undefined;
        }
      }
      return undefined;
    }
  };

  DM4.Logger = Logger;
})();
