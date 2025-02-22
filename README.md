# Signals JS

**Signals JS** is a compact library for reactive programming in JavaScript. It lets you create reactive variables (signals), computed values, and effects, making it easy to build interactive applications with minimal overhead.

## Features

- **Reactive Variables (Signals):** Create reactive references using `ref()`, with optional persistence and history tracking.
- **Computed Values:** Automatically compute values based on signals with `computed()`.
- **Effects:** Run side-effects whenever dependent signals change using `effect()`.
- **Batch Updates:** Group multiple updates together with `batch()` so that effects run only once after all updates.
- **Watchers:** Monitor changes to signals with `watch()`.
- **Derived Signals:** Combine multiple signals into a single derived value with `derive()`.
- **History Tracking:** Enable undo/redo functionality by tracking changes in a signal’s history.

## Installation

Include the `Signals.js` file in your project. For example, add this to your HTML:

```html
<script src="Signals.js"></script>
```


# Signals JS API Reference

This document provides a detailed reference for the Signals JS library functions.

---

## `ref(initialValue, options)`

Creates a reactive variable (signal) that you can both get and set.

### Parameters

- **`initialValue`**:  
  The initial value of the signal.

- **`options`** (optional): An object that can include:
  - **`persist`** (`boolean`): If `true`, the signal's value will be persisted to local storage.
  - **`key`** (`string`): The key to use for local storage (required if `persist` is `true`).
  - **`history`** (`boolean`): If `true`, enables history tracking for the signal (useful for undo/redo functionality).
  - **`historySize`** (`number`): Maximum number of historical states to store (default is `100`).

### Return Value

A signal function with the following properties:
- Acts as both getter and setter.
- **`signal.observers`**: A set of observers that depend on the signal.
- **`signal.peek`**: A function that returns the current value without tracking dependencies.
- If history is enabled, additional methods:
  - **`signal.undo()`** – Reverts to the previous state.
  - **`signal.redo()`** – Reapplies a reverted state.

### Usage Example

```javascript
const mySignal = Signals.ref(0, { 
    history: true, 
    persist: true, 
    key: 'mySignal' 
});
```

---

## `computed(computeFn)`

Creates a computed signal that automatically updates when its dependencies change.

### Parameters

- **`computeFn`**:  
A function that returns the computed value based on other signals.

### Return Value

A signal function that reflects the computed value.

### Usage Example

```javascript
const myComputed = Signals.computed(() => mySignal() * 2);
```

---

## `effect(effectFn)`

Runs the provided function whenever any of its dependent signals change.

### Parameters

- **`effectFn`**:  
The function to execute when dependencies update. This function can include side effects (like updating the DOM).

### Return Value

A function that re-runs the effect, if needed.

### Usage Example

```javascript
Signals.effect(() => {
  console.log('The current value is:', mySignal());
});
```

---

## `batch(fn)`

Groups multiple updates together so that effects run only once after all updates are complete.

### Parameters

- **`fn`**:  
A function that contains a series of signal updates.

### Usage Example

```javascript
Signals.batch(() => {
  mySignal(1);
  mySignal(2);
});
```

---

## `watch(source, callback)`

Watches a signal for changes and calls the provided callback with the new value.

### Parameters

- **`source`**:  
The signal to observe.

- **`callback`**:  
A function that receives the updated value each time the signal changes.

### Usage Example

```javascript
Signals.watch(mySignal, (value) => {
  console.log('Signal updated to:', value);
});
```

---

## `derive(...deps, computeFn)`

Creates a derived signal from one or more signals.

### Parameters

- **`deps`**:  
One or more signals that the derived signal depends on.

- **`computeFn`**:  
A function that receives the current values of the dependencies and returns a computed result.

### Return Value

A computed signal that automatically updates when any dependency changes.

### Usage Example

```javascript
const sum = Signals.derive(signalA, signalB, (a, b) => a + b);
```
