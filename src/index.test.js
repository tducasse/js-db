import {
  db,
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
