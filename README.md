# Signals JS

**Signals JS** is a compact library for reactive programming in JavaScript. It lets you create reactive variables (signals), computed values (processed variables), and effects (triggered functions), making it easy to build interactive applications with minimal overhead.

Library is created with the purpose of have reactivity in small projects without the use of heavier libraries like React or Vue.

## Features

- **Reactive Variables (Signals):** Create reactive references using `ref()`, with optional persistence and history tracking.
- **Computed Values (processed variables):** Automatically compute values based on signals with `computed()`.
- **Effects (triggered functions):** Run side-effects whenever dependent signals change using `effect()`.
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
    persist: true, 
    key: 'mySignal',
    history: true, 
    historySize: 100
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

## `batch(batchFn)`

Groups multiple updates together so that effects run only once after all updates are complete.

### Parameters

- **`batchFn`**:  
A function that contains a series of signal updates.

### Usage Example

```javascript
// Without batch - triggers updates 3 times
counter1(counter1() + 1);
counter2(counter2() + 1);
counter3(counter3() + 1);

// With batch - triggers updates only once at the end
Signals.batch(() => {
  counter1(counter1() + 1);
  counter2(counter2() + 1);
  counter3(counter3() + 1);
});
```

`batch` is useful when you need to make multiple state changes that should trigger updates only once.

Real-world use cases for `batch`:

- Form submissions where multiple fields need to update
- Data synchronization across multiple related states
- Animation state changes where multiple  properties update together
- Bulk operations like "Select All" in a todo list


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
`watch` is helpful for side effects and reactions to state changes:

```javascript
// Track and log user actions
const userAction = Signals.ref(null);
Signals.watch(userAction, (newAction, oldAction) => {
  console.log(`User performed: ${newAction}`);
  analytics.track(newAction);
});

// API calls based on state changes
const searchQuery = Signals.ref('');
Signals.watch(searchQuery, async (newQuery) => {
  if (newQuery.length >= 3) {
    const results = await api.search(newQuery);
    searchResults(results);
  }
});
```

Real-world use cases for `watch`:

- Auto-saving functionality
- Analytics tracking
- API calls in response to state changes
- Validation and error handling
- Syncing with external systems


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

`derive` is perfect for computing values that depend on multiple reactive sources:

```javascript
// Shopping cart example
const items = Signals.ref([]);
const taxRate = Signals.ref(0.1);
const shippingCost = Signals.ref(5.99);

const cartTotal = Signals.derive(
  items,
  taxRate,
  shippingCost,
  (items, tax, shipping) => {
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const taxAmount = subtotal * tax;
    return subtotal + taxAmount + shipping;
  }
);

// Dashboard metrics example
const revenue = Signals.ref(0);
const costs = Signals.ref(0);
const overhead = Signals.ref(0);

const profitMargin = Signals.derive(
  revenue,
  costs,
  overhead,
  (rev, cost, oh) => {
    const totalCosts = cost + oh;
    return ((rev - totalCosts) / rev) * 100;
  }
);
```

Real-world use cases for `derive`:

- Financial calculations involving multiple factors
- Data visualization where multiple data points create one view
- Game state calculations (e.g., player health + buffs + debuffs)
- Form validation combining multiple field states
- Dashboard metrics that depend on multiple data sources

# Differences between `computed` and `derive`

## 1. Number of Dependencies

`computed` typically works with a single computation function that may access multiple signals within it.
`derive` explicitly declares its dependencies as arguments before the computation function.

```javascript
// Computed: Dependencies are implicit in the function
const total = Signals.computed(() => {
    return price() + tax() + shipping();  // Dependencies discovered during execution
});

// Derive: Dependencies are explicit arguments
const total = Signals.derive(
    price,
    tax, 
    shipping,
    (p, t, s) => p + t + s  // Dependencies declared upfront
);
```
## 2. Dependency Declaration

```javascript
// Computed style - dependencies are "hidden" in the function
const fullName = Signals.computed(() => {
    return `${firstName()} ${lastName()}`;
});

// Derive style - dependencies are clearly visible
const fullName = Signals.derive(
    firstName,
    lastName,
    (first, last) => `${first} ${last}`
);
```

## 3. Main Use Cases

`computed` is better for:
- Simple transformations of a single signal
- When dependencies might change based on conditions
- When you want more flexibility in how dependencies are accessed

```javascript
// Computed works well with conditional dependencies
const displayText = Signals.computed(() => {
    if (isMetric()) {
        return `${weight()}kg`;
    } else {
        return `${weight() * 2.2}lbs`;
    }
});
```

`derive` is better for:
- When you want to make dependencies explicit and clear
- When combining multiple independent signals
- When you want to enforce a specific dependency structure

```javascript
// Derive makes dependencies clear and ensures proper structure
const cartMetrics = Signals.derive(
    items,
    taxRate,
    discounts,
    shipping,
    (items, tax, discounts, shipping) => ({
        subtotal: calculateSubtotal(items),
        taxAmount: calculateTax(items, tax),
        discountAmount: applyDiscounts(items, discounts),
        total: calculateTotal(items, tax, discounts, shipping)
    })
);
```

## 4. Error Handling and Debugging

- With `derive`, it's easier to debug dependency issues because they're explicitly declared
- With `computed`, dependencies are discovered at runtime, which can make debugging more challenging

```javascript
// Easier to spot missing dependencies with derive
const userProfile = Signals.derive(
    userData,
    userPreferences,
    userSettings,  // If this is missing, you'll get an immediate error
    (data, prefs, settings) => ({ ...data, ...prefs, ...settings })
);

// Dependencies are less obvious with computed
const userProfile = Signals.computed(() => {
    // Missing dependencies might only be discovered during execution
    return { ...userData(), ...userPreferences(), ...userSettings() };
});
```

## 5. Code Organization

```javascript
// Derive enforces a more structured approach
const dashboardMetrics = Signals.derive(
    revenue,
    expenses,
    userCount,
    activeUsers,
    (rev, exp, users, active) => ({
        profit: rev - exp,
        userGrowth: users / active,
        revenuePerUser: rev / users,
        expensePerUser: exp / users
    })
);

// Computed allows more flexible organization
const dashboardMetrics = Signals.computed(() => {
    const rev = revenue();
    const exp = expenses();
    // Can interleave calculations with signal access
    const profit = rev - exp;
    const users = userCount();
    // More flexible but potentially harder to maintain
    return {
        profit,
        userGrowth: users / activeUsers(),
        revenuePerUser: rev / users,
        expensePerUser: exp / users
    };
});
```

In practice, you might use both in different situations:

- Use derive when you want to be explicit about dependencies and create more maintainable code
- Use computed when you need more flexibility or when the computation logic is more complex and dynamic

The choice often comes down to code style preferences and specific use cases. `derive` promotes more explicit and potentially more maintainable code, while `computed` offers more flexibility in how dependencies are handled.