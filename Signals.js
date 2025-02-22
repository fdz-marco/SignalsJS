const Signals = (() => {
  // This variable holds the current effect that's running
  let currentObserver = null;

  // Create Reference Variable: Returns a function that acts as getter/setter.
  function ref(initialValue) {
    let value = initialValue;
    const observers = new Set();

    function signal(newValue) {
      // Getter mode: register dependency if an effect is active.
      if (arguments.length === 0) {
        if (currentObserver) {
          observers.add(currentObserver);
          currentObserver.deps.add(signal);
        }
        return value;
      }
      // Setter mode: update value and re-run dependent effects.
      if (newValue !== value) {
        value = newValue;
        // Create a shallow copy of the observers set to avoid infinite loops.
        const observersToRun = Array.from(observers);
        observersToRun.forEach(obs => obs());
      }
    }

    signal.observers = observers;
    return signal;
  }

  // Helper to clear dependencies before re-running an effect
  function cleanup(observer) {
    observer.deps.forEach(dep => {
      dep.observers.delete(observer);
    });
    observer.deps.clear();
  }

  // Create Effect: Runs a function immediately and re-runs it when any dependencies change.
  function effect(effectFn) {
    function run() {
      cleanup(run);
      currentObserver = run;
      run.deps = new Set();
      effectFn();
      currentObserver = null;
    }
    run.deps = new Set();
    run();
    return run;
  }

  // Create Computed Variable: It uses an internal signal to store the computed value.
  function computed(computedFn) {
    const computedVar = ref(undefined);
    effect(() => {
      computedVar(computedFn());
    });
    return computedVar;
  }

  return { ref, effect, computed };
})();
