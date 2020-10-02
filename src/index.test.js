import { db, register, reset, seed } from "./index";

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
  let item = db.collection.findOne({ name: "name2" });
  expect(item).not.toBeUndefined();
  item = db.collection.findOne();
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
