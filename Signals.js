/*
/* ------------------------------------------------------------------------------
/* ClassName: Signals JS
/* What it does: Compact library for reactive programming in JavaScript.
/* Author: Marco Fernandez (marcofdz.com)
/* Version: 1.0.1
/* License: MIT
/* Repository: https://github.com/fdz-marco/SignalsJS
/* File: Signals.js
/* ------------------------------------------------------------------------------
*/

const Signals = (() => {
  let currentObserver = null;
  let batchQueue = new Set();
  let isBatching = false;

  // -------------------------------------------
  // Core reactive functions
  // -------------------------------------------

  // Reactive Variable Reference
  // Options: persistence, history, animation
  function ref(initialValue, options = {}) {
    // Options destructuring with defaults
    const {
      persist = false,
      key = null,
      history = false,
      historySize = 100
    } = options;
    // Initialize value
    let value = initialValue;
    // Load persisted value if available
    if (persist && key) {
      const stored = localStorage.getItem(key);
      if (stored !== null && stored !== undefined) {
        try {
          value = JSON.parse(stored);
        } catch (e) {
          console.error(`Error loading persisted value for ${key}:`, e);
        }
      }
    }
    // Initialize observers set
    const observers = new Set();
    // Initialize history tracker
    const historyTracker = history ? new History(historySize) : null;
    if (history) {
      historyTracker.push(value);
    }
    // Signal function
    function signal(newValue) {
      // Getter mode
      if (arguments.length === 0) {
        if (currentObserver) {
          observers.add(currentObserver);
          currentObserver.deps.add(signal);
        }
        return value;
      }
      // Setter mode
      if (newValue !== value) {
        const oldValue = value;
        value = newValue;
        // Persist value to local storage
        if (persist && key) {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (e) {
            console.error(`Error persisting value for ${key}:`, e);
          }
        }
        // Track history
        if (history && !signal._isUndoRedo) {
          historyTracker.push(value);
        }
        // Notify observers
        if (isBatching) {
          batchQueue.add(() => notifyObservers(observers, oldValue));
        } else {
          notifyObservers(observers, oldValue);
        }
      }
    }
    // Signal properties
    signal.observers = observers;
    signal.peek = () => value;
    // History Properties
    if (history) {
      signal.undo = () => {
        const previousState = historyTracker.undo();
        if (previousState !== null && previousState !== undefined) {
          signal._isUndoRedo = true;
          signal(previousState);
          signal._isUndoRedo = false;
        }
      };

      signal.redo = () => {
        const nextState = historyTracker.redo();
        if (nextState !== null && nextState !== undefined) {
          signal._isUndoRedo = true;
          signal(nextState);
          signal._isUndoRedo = false;
        }
      };
    }

    // Debugging options
    if (options.debug) {
      signal.debug = {
        log: () => {
          console.log(`Signal value:`, value);
          console.log(`Number of observers:`, observers.size);
        },
        trace: () => {
          console.trace(`Signal update stack trace`);
          console.log(`Current value:`, value);
        },
        observers: () => {
          console.log(`Current observers:`, Array.from(observers));
        },
        history: history ? () => {
          console.log(`History state:`, {
            past: historyTracker.past,
            future: historyTracker.future
          });
        } : null
      };

      // Debugging wrapper for signal
      const originalSignal = signal;
      return function debugSignal(newValue) {
        if (arguments.length === 0) {
          console.log(`[Debug] Getting value:`, value);
          return originalSignal();
        }
        console.log(`[Debug] Setting value:`, newValue);
        const result = originalSignal(newValue);
        console.log(`[Debug] New value set:`, value);
        return result;
      };
    }

    return signal;
  }

  // Effect function
  function effect(effectFn) {
    function run(oldValue) {
      cleanup(run);
      currentObserver = run;
      run.deps = new Set();
      try {
        effectFn(oldValue);
      } finally {
        currentObserver = null;
      }
    }
    run.deps = new Set();
    run();
    return run;
  }

  // Computed value
  function computed(computeFn) {
    const signal = ref(undefined);
    effect(() => signal(computeFn()));
    return signal;
  }

  // Batch updates
  function batch(batchFn) {
    if (isBatching) return batchFn();
    isBatching = true;
    try {
      batchFn();
    } finally {
      isBatching = false;
      const tasks = Array.from(batchQueue);
      batchQueue.clear();
      tasks.forEach(task => task());
    }
  }

  // Watch function
  function watch(source, callback) {
    effect(() => callback(source()));
  }

  // Derive function
  function derive(...args) {
    const computeFn = args.pop();
    const deps = args;
    return computed(() => computeFn(...deps.map(dep => dep())));
  }

  // When function (conditional effect)
  function when(condition, callback) {
    return effect(() => {
      if (condition()) callback();
    });
  }

  // Async computed value
  function asyncComputed(computeFn) {
    const signal = ref(null);
    const loading = ref(false);
    const error = ref(null);

    effect(async () => {
      loading(true);
      error(null);
      try {
        const result = await computeFn();
        signal(result);
      } catch (e) {
        error(e);
      } finally {
        loading(false);
      }
    });

    return { signal, loading, error };
  }

  // -------------------------------------------
  // Helper functions
  // -------------------------------------------

  // Notify all observers of a signal
  function notifyObservers(observers, oldValue) {
    const observersToRun = Array.from(observers);
    observersToRun.forEach(obs => obs(oldValue));
  }

  // Cleanup function for observers
  function cleanup(observer) {
    observer.deps.forEach(dep => {
      dep.observers.delete(observer);
    });
    observer.deps.clear();
  }

  // -------------------------------------------
  // History tracking for undo/redo
  // -------------------------------------------
  class History {
    // Initialize history with a maximum size
    constructor(maxSize = 100) {
      this.past = [];
      this.future = [];
      this.maxSize = maxSize;
    }
    // Push a new state to the history
    push(state) {
      // Clone state to avoid reference issues
      const stateCopy = JSON.parse(JSON.stringify(state));
      this.past.push(stateCopy);
      if (this.past.length > this.maxSize) {
        this.past.shift();
      }
      this.future = [];
    }
    // Undo the last state change
    undo() {
      if (this.past.length <= 1) {
        return null;
      }
      const current = this.past.pop();
      this.future.push(current);
      return this.past[this.past.length - 1];
    }
    // Redo the last undone state change
    redo() {
      if (this.future.length === 0) {
        return null;
      }
      const state = this.future.pop();
      this.past.push(state);
      return state;
    }
  }

  return {
    ref,
    computed,
    effect,
    batch,
    watch,
    derive,
    when,
    asyncComputed
  };
})();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Signals;
}