import {
  db,
  deepMerge,
  enableAutoPersistence,
  getNestedValue,
  register,
  reset,
  seed,
  setNestedValue,
} from "./index";

afterEach(() => {
  reset();
});

test("exports export something", () => {
  expect(db).not.toBeUndefined();
  expect(register).not.toBeUndefined();
  expect(seed).not.toBeUndefined();
  expect(typeof seed).toBe("function");
  expect(typeof register).toBe("function");
  expect(typeof db).toBe("object");
});

test("register adds the collection to the db object", () => {
  expect(db).not.toHaveProperty("collection");
  register("collection");
  expect(db).toHaveProperty("collection");
  ["find", "count", "findOne", "update", "remove"].forEach((key) =>
    expect(db.collection).toHaveProperty(key)
  );
});

test("reset removes everything in the db", () => {
  register("collection");
  expect(db.collection).not.toBeUndefined();
  expect(db.getStore().collection).not.toBeUndefined();
  reset();
  expect(db.collection).toBeUndefined();
  expect(db.getStore().collection).toBeUndefined();
});

test("insert a new object in the collection", () => {
  register("collection");
  db.collection.insert({ name: "name" });
  expect(db.getStore().collection).toHaveLength(1);
});

test("insert multiple objects it the collection", () => {
  register("collection");
  db.collection.insert([{ name: "name" }, { name: "name2" }]);
  expect(db.getStore().collection).toHaveLength(2);
});

test("remove an object from a collection", () => {
  register("collection");
  db.collection.insert([{ name: "name" }, { name: "name2" }]);
  expect(db.getStore().collection).toHaveLength(2);
  db.collection.remove({ name: "name2" });
  expect(db.getStore().collection).toHaveLength(1);
  expect(db.getStore().collection[0]).toMatchObject({ name: "name" });
});

test("findOne finds an object in a collection", () => {
  register("collection");
  db.collection.insert([{ name: "name" }, { name: "name2" }]);
  const item = db.collection.findOne({ name: "name2" });
  expect(item).not.toBeUndefined();
});

test("findOne works with nested fields", () => {
  register("collection");
  db.collection.insert([
    { name: "name", deep: { field: "something" } },
    { name: "name2" },
  ]);
  const item = db.collection.findOne({ "deep.field": "something" });
  expect(item).not.toBeUndefined();
});

test("find finds multiple objects in a collection", () => {
  register("collection");
  db.collection.insert([{ name: "name" }, { name: "name" }, { name: "name2" }]);
  let items = db.collection.find({ name: "name" });
  expect(items).toHaveLength(2);
  items = db.collection.find();
  expect(items).toHaveLength(3);
});

test("find works with nested fields", () => {
  register("collection");
  db.collection.insert([
    { name: "name", nested: { field: "value" } },
    { name: "name", nested: { field: "value" } },
    { name: "name2" },
  ]);
  let items = db.collection.find({ name: "name", "nested.field": "value" });
  expect(items).toHaveLength(2);
  items = db.collection.find();
  expect(items).toHaveLength(3);
});

test("update with $set on multiple objects in a collection", () => {
  register("collection");
  db.collection.insert([{ name: "name" }, { name: "name" }, { name: "name2" }]);
  db.collection.update({ name: "name" }, { $set: { newProp: "something" } });
  const items = db.collection.find({ name: "name" });
  items.forEach((item) => {
    expect(item).toHaveProperty("newProp");
    expect(item.newProp).toBe("something");
  });
});

test("update with $set works with nested fields", () => {
  register("collection");
  db.collection.insert([{ name: "name" }, { name: "name" }, { name: "name2" }]);
  db.collection.update(
    { name: "name" },
    { $set: { "newProp.nested": "something" } }
  );
  const items = db.collection.find({ name: "name" });
  items.forEach((item) => {
    expect(item).toHaveProperty("newProp");
    expect(item.newProp).toHaveProperty("nested");
    expect(item.newProp.nested).toBe("something");
  });
  db.collection.update(
    { name: "name2" },
    { $set: { "newProp.nested1": "something" } }
  );
  let item = db.collection.findOne({ name: "name2" });
  expect(item.newProp.nested1).toBe("something");
  db.collection.update(
    { name: "name2" },
    { $set: { "newProp.nested2": "something else" } }
  );
  item = db.collection.findOne({ name: "name2" });
  expect(item.newProp.nested1).toBe("something");
  expect(item.newProp.nested2).toBe("something else");
  db.collection.update(
    { name: "name2" },
    { $set: { "newProp.nested2": "something else again" } }
  );
  item = db.collection.findOne({ name: "name2" });
  expect(item.newProp.nested1).toBe("something");
  expect(item.newProp.nested2).toBe("something else again");
});

test(`update with $set doesn't merge arrays`, () => {
  register("collection");
  db.collection.insert([{ nested: { array: [1, 2] } }]);
  db.collection.update({}, { $set: { "nested.array": [3, 4] } });
  const item = db.collection.findOne();
  expect(item.nested.array).toHaveLength(2);
  expect(item.nested.array).toContain(3);
  expect(item.nested.array).toContain(4);
  db.collection.update(
    {},
    { $set: { "nested.array": item.nested.array.filter((el) => el !== 3) } }
  );
  const newItem = db.collection.findOne();
  expect(newItem.nested.array).toHaveLength(1);
  expect(newItem.nested.array).toContain(4);
});

test("update with $push on multiple objects in a collection", () => {
  register("collection");
  db.collection.insert([
    { name: "name", array: ["thingo"] },
    { name: "name" },
    { name: "name2" },
  ]);
  db.collection.update({ name: "name" }, { $push: { array: "something" } });
  const items = db.collection.find({ name: "name" });
  items.forEach((item) => {
    expect(item).toHaveProperty("array");
    expect(item.array).toContain("something");
  });
});

test("update with $push works with nested fields", () => {
  register("collection");
  db.collection.insert([
    { name: "name", array: ["thingo"] },
    { name: "name" },
    { name: "name2" },
  ]);
  db.collection.update(
    { name: "name" },
    { $push: { "newProp.nested": "something" } }
  );
  const items = db.collection.find({ name: "name" });
  items.forEach((item) => {
    expect(item).toHaveProperty("newProp");
    expect(item.newProp).toHaveProperty("nested");
    expect(item.newProp.nested).toContain("something");
  });
});

test("count the items in a collection", () => {
  register("collection");
  db.collection.insert([{ name: "name" }, { name: "name" }, { name: "name2" }]);
  let nb = db.collection.count({ name: "name" });
  expect(nb).toBe(2);
  nb = db.collection.count();
  expect(nb).toBe(3);
});

test("seed initialises data", () => {
  const seeds = {
    collection1: [{ name: "name" }, { name: "name2" }],
    collection2: [{ prop: "prop" }, { prop: "prop2" }],
  };
  seed(seeds);
  const store = db.getStore();
  expect(store).toHaveProperty("collection1");
  expect(store).toHaveProperty("collection2");
});

test("getNestedValue works with nested values and standard values", () => {
  const item = { nested: { field: "nested value" }, standard: "value" };
  let value = getNestedValue(item, "nested.field");
  expect(value).toBe("nested value");
  value = getNestedValue(item, "standard");
  expect(value).toBe("value");
});

test("setNestedValue works with nested values and standard values", () => {
  const item = {
    nested: { field: "nested value" },
    standard: "value",
  };
  setNestedValue(item, "nested.field", "new nested value");
  expect(item.nested.field).toBe("new nested value");
  setNestedValue(item, "standard", "new value");
  expect(item.standard).toBe("new value");
  setNestedValue(item, "completely.new.nested.key", "super nested value");
  expect(item.completely.new.nested.key).toBe("super nested value");
  setNestedValue(item, "nested.otherField", "in a nested key");
  expect(item.nested.otherField).toBe("in a nested key");
  expect(item.nested.field).toBe("new nested value");
});

test(`setNestedValue doesn't override existing nested values`, () => {
  const item = {
    nested: {
      first: {
        value: 1,
      },
      second: {
        value: 2,
      },
    },
  };
  const first = "first";
  setNestedValue(item, `nested.${first}.value`, "one");
  expect(item.nested.first.value).toBe("one");
  expect(item.nested.second.value).toBe(2);
});

test(`deepMerge merges nested properties`, () => {
  const a = {
    b: {
      c: 1,
    },
  };
  const z = {
    b: {
      d: 2,
    },
  };
  const result = deepMerge(a, z);
  expect(result.b.c).toBe(1);
  expect(result.b.d).toBe(2);
});

test(`deepMerge doesn't merge arrays`, () => {
  const a = {
    b: [1, 2],
  };

  const z = {
    b: [3, 4],
  };

  const result = deepMerge(a, z);
  expect(result.b).toHaveLength(2);
  expect(result.b).toContain(3);
  expect(result.b).toContain(4);
});

test(`insert persists to localStorage`, () => {
  enableAutoPersistence();
  register("collection");
  db.collection.insert({ name: "name" });
  expect(localStorage.getItem("js-db-data")).toEqual(
    '{"collection":[{"name":"name"}]}'
  );
});

test(`enableAutoPersistence loads from localStorage`, () => {
  localStorage.setItem("js-db-data", '{"collection":[{"name":"name"}]}');
  enableAutoPersistence();
  register("collection");
  expect(db.getStore().collection).toHaveLength(1);
});

test(`update persists to localStorage`, () => {
  localStorage.setItem("js-db-data", '{"collection":[{"name":"name"}]}');
  enableAutoPersistence();
  register("collection");
  db.collection.update({ name: "name" }, { $set: { name: "new name" } });
  expect(localStorage.getItem("js-db-data")).toEqual(
    '{"collection":[{"name":"new name"}]}'
  );
});

test(`remove persists to localStorage`, () => {
  localStorage.setItem(
    "js-db-data",
    '{"collection":[{"name":"name"},{"name":"another name"}]}'
  );
  enableAutoPersistence();
  register("collection");
  db.collection.remove({ name: "name" });
  expect(localStorage.getItem("js-db-data")).toEqual(
    '{"collection":[{"name":"another name"}]}'
  );
});

test(`reset persists to localStorage`, () => {
  localStorage.setItem("js-db-data", '{"collection":[{"name":"name"}]}');
  enableAutoPersistence();
  register("collection");
  db.collection.insert({ name: "another name" });
  reset();
  expect(localStorage.getItem("js-db-data")).toEqual(null);
});
