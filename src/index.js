import fs from "fs";

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
    if (Array.isArray(updates[key]) && Array.isArray(current[key])) {
      // eslint-disable-next-line no-param-reassign
      current[key] = updates[key];
    } else if (
      // eslint-disable-next-line no-prototype-builtins
      !current.hasOwnProperty(key) ||
      typeof updates[key] !== "object"
    )
      // eslint-disable-next-line no-param-reassign
      current[key] = updates[key];
    else deepMerge(current[key], updates[key]);
  });
  return current;
};

const persistence = {
  config: {
    type: null,
    path: null,
  },
  write: () => {},
  reset: () => {},
};

const persist = () => {
  if (persistence.config.type) {
    persistence.write();
  }
};

const methods = (collection, store) => ({
  // inserts the new `item` in the `collection`
  insert: (item) => {
    store[collection].push(...[].concat(item));
    persist();
  },
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
          setNestedValue(set, key, val);
        });
        // eslint-disable-next-line no-param-reassign
        store[collection][idx] = deepMerge(deepMerge(el, set), push);
        persist();
      }
    }),
  // removes every element that matches `query`
  remove: (query = {}) => {
    store[collection].forEach(
      (el, idx) =>
        Object.entries(query).every(([key, val]) =>
          [].concat(getNestedValue(el, key)).includes(val)
        ) && store[collection].splice(idx, 1)
    );
    persist();
  },
});

// this is where things actually get stored
const store = {};

export const enableAutoPersistence = (config = {}) => {
  if (typeof window === "undefined") {
    if (typeof config.path === "undefined" || !config.path) {
      throw new Error("config.path is required in non browser environments");
    }

    // if file does not exist try to create it.
    // if creation is not possible log warning to console and don't enable persistence.
    if (!fs.existsSync(config.path)) {
      try {
        const handler = fs.openSync(config.path, "w");
        fs.closeSync(handler);
      } catch (error) {
        console.warn(
          "persistence not enabled due to error creating database file:",
          error.message
        );
        return;
      }
    }

    const persistedState = JSON.parse(fs.readFileSync(config.path, "utf8"));
    if (persistedState) {
      Object.keys(persistedState).forEach((key) => {
        store[key] = persistedState[key];
      });
    }

    persistence.config = {
      type: "file",
      path: config.path,
    };

    persistence.write = () => {
      fs.writeFileSync(persistence.config.path, JSON.stringify(store));
    };

    persistence.reset = () => {
      fs.unlinkSync(persistence.config.path);
    };
  } else {
    persistence.config = {
      type: "localstorage",
      path: "js-db-data",
    };

    persistence.write = () => {
      localStorage.setItem(persistence.config.path, JSON.stringify(store));
    };

    persistence.reset = () => {
      localStorage.removeItem(persistence.config.path);
    };

    const currentData = localStorage.getItem(persistence.config.path);
    if (currentData) {
      const persistedState = JSON.parse(currentData);
      if (persistedState) {
        Object.keys(persistedState).forEach((key) => {
          store[key] = persistedState[key];
        });
      }
    }
  }
};

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
  if (typeof store[collection] === "undefined") {
    store[collection] = [];
  }
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
  if (persistence.config.type) {
    persistence.reset();
  }
};
