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
      if (stored !== null) {
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
        if (history) {
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
        if (previousState !== null) {
          signal(previousState);
        }
      };

      signal.redo = () => {
        const nextState = historyTracker.redo();
        if (nextState !== null) {
          signal(nextState);
        }
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
  function batch(fn) {
    if (isBatching) return fn();
    isBatching = true;
    try {
      fn();
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
      this.past.push(state);
      if (this.past.length > this.maxSize) {
        this.past.shift();
      }
      this.future = [];
    }
    // Undo the last state change
    undo() {
      if (this.past.length > 0) {
        const current = this.past.pop();
        this.future.push(current);
        return this.past[this.past.length - 1];
      }
      return null;
    }
    // Redo the last undone state change
    redo() {
      if (this.future.length > 0) {
        const state = this.future.pop();
        this.past.push(state);
        return state;
      }
      return null;
    }
  }

  return {
    ref,
    computed,
    effect,
    batch,
    watch,
    derive
  };
})();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Signals;
}