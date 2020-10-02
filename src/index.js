const methods = (collection, store) => ({
  // inserts the new `item` in the `collection`
  insert: (item) => store[collection].push(...[].concat(item)),
  // gets all the elements that matches `query`
  find: (query = {}) =>
    store[collection].filter((el) =>
      Object.entries(query).every(([key, val]) =>
        [].concat(el[key]).includes(val)
      )
    ),
  // counts all the elements that matches `query`
  count: (query = {}) =>
    store[collection].filter((el) =>
      Object.entries(query).every(([key, val]) =>
        [].concat(el[key]).includes(val)
      )
    ).length,
  // gets the first element that matches `query`
  findOne: (query = {}) =>
    store[collection].find((el) =>
      Object.entries(query).every(([key, val]) =>
        [].concat(el[key]).includes(val)
      )
    ),
  // replaces `$set` in every element that matches `query`
  // pushes everything in `$push` to the corresponding nested arrays
  update: (query = {}, { $push = {}, $set = {} } = {}) =>
    store[collection].forEach((el, idx) => {
      if (
        Object.entries(query).every(([key, val]) =>
          [].concat(el[key]).includes(val)
        )
      ) {
        const push = {};
        Object.entries($push).forEach(([key, val]) => {
          push[key] = (el[key] || []).concat(val);
        });
        // eslint-disable-next-line no-param-reassign
        store[collection][idx] = { ...el, ...$set, ...push };
      }
    }),
  // removes every element that matches `query`
  remove: (query = {}) =>
    store[collection].forEach(
      (el, idx) =>
        Object.entries(query).every(([key, val]) =>
          [].concat(el[key]).includes(val)
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
