export const getNestedValue = (item, key) => {
  try {
    return key.split(".").reduce((acc, curr) => acc[curr], item);
  } catch (err) {
    return undefined;
  }
};

export const setNestedValue = (obj, path, value) => {
  let newPath = path;
  if (typeof path === "string") {
    newPath = newPath.split(".");
  }
  if (newPath.length > 1) {
    if (!obj[newPath[0]]) {
      // eslint-disable-next-line no-param-reassign
      obj[newPath[0]] = {};
    }
    setNestedValue(obj[newPath.shift()], newPath, value);
  } else {
    // eslint-disable-next-line no-param-reassign
    obj[newPath[0]] = value;
  }
};

export const deepMerge = (current, updates) => {
  Object.keys(updates).forEach((key) => {
    // eslint-disable-next-line no-prototype-builtins
    if (!current.hasOwnProperty(key) || typeof updates[key] !== "object")
      // eslint-disable-next-line no-param-reassign
      current[key] = updates[key];
    else deepMerge(current[key], updates[key]);
  });
  return current;
};

const methods = (collection, store) => ({
  // inserts the new `item` in the `collection`
  insert: (item) => store[collection].push(...[].concat(item)),
  // gets all the elements that matches `query`
  find: (query = {}) =>
    store[collection].filter((el) =>
      Object.entries(query).every(([key, val]) =>
        [].concat(getNestedValue(el, key)).includes(val)
      )
    ),
  // counts all the elements that matches `query`
  count: (query = {}) =>
    store[collection].filter((el) =>
      Object.entries(query).every(([key, val]) =>
        [].concat(getNestedValue(el, key)).includes(val)
      )
    ).length,
  // gets the first element that matches `query`
  findOne: (query = {}) =>
    store[collection].find((el) =>
      Object.entries(query).every(([key, val]) =>
        [].concat(getNestedValue(el, key)).includes(val)
      )
    ),
  // replaces `$set` in every element that matches `query`
  // pushes everything in `$push` to the corresponding nested arrays
  update: (query = {}, { $push = {}, $set = {} } = {}) =>
    store[collection].forEach((el, idx) => {
      if (
        Object.entries(query).every(([key, val]) =>
          [].concat(getNestedValue(el, key)).includes(val)
        )
      ) {
        const push = {};
        Object.entries($push).forEach(([key, val]) => {
          setNestedValue(
            push,
            key,
            (getNestedValue(el, key) || []).concat(val)
          );
        });
        const set = {};
        Object.entries($set).forEach(([key, val]) => {
          setNestedValue(push, key, val);
        });
        // eslint-disable-next-line no-param-reassign
        store[collection][idx] = deepMerge(deepMerge(el, set), push);
      }
    }),
  // removes every element that matches `query`
  remove: (query = {}) =>
    store[collection].forEach(
      (el, idx) =>
        Object.entries(query).every(([key, val]) =>
          [].concat(getNestedValue(el, key)).includes(val)
        ) && store[collection].splice(idx, 1)
    ),
});

// this is where things actually get stored
const store = {};

/**
 * Access the store directly
 */
const getStore = () => store;

// this is the convenience object we export
export const db = { getStore };

/**
 * Register a collection in the database
 * @param {String} collection The name of the collection to register
 */
export const register = (collection) => {
  store[collection] = [];
  db[collection] = methods(collection, store);
};

/**
 * Initialise the database with seed data
 * @param {Object} seeds An object that looks like {collection:[{}, {}, ...], ...}
 */
export const seed = (seeds) => {
  Object.entries(seeds).forEach(([collection, items]) => {
    register(collection);
    db[collection].insert(items);
  });
  return true;
};

const permanentProps = ["getStore"];

/**
 * Resets the global objects (db, store)
 */
export const reset = () => {
  Object.keys(db).forEach((key) => {
    if (permanentProps.includes(key)) {
      return false;
    }
    delete db[key];
    delete store[key];
    return true;
  });
};
