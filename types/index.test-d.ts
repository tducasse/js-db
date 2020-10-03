import { expectType, expectError } from "tsd";
import { db, register, seed, reset, Records, Record } from ".";

seed({ collection: [{ name: "something", key: "else" }] });
expectError(seed());
expectError(seed([]));
seed({ collection: [], collection2: [] });
expectError(seed({ collection: { key: 1 } }));

register("collection");
expectError(register());

reset();
expectError(reset("something"));

db.getStore();
expectError(db.getStore("something"));

db.collection.count();
expectError(db.collection.count("something"));

expectType<number>(db.collection.count({ name: "name" }));

db.collection.find();
expectError(db.collection.find("something"));

expectType<Records>(db.collection.find({ name: "name" }));

db.collection.findOne();
expectError(db.collection.findOne("something"));
expectType<Record>(db.collection.findOne({ name: "name" }));

db.collection.remove();
expectError(db.collection.remove("something"));
db.collection.remove({ name: "name" });

db.collection.update();
expectError(db.collection.update("something"));
db.collection.update({ name: "name" });
expectError(db.collection.update({ name: "name" }, { name: "something" }));
db.collection.update({ name: "name" }, {});
expectError(db.collection.update({ name: "name" }, { $set: "something" }));
db.collection.update({ name: "name" }, { $set: {} });
db.collection.update({ name: "name" }, { $set: { name: "something" } });
expectError(db.collection.update({ name: "name" }, { $push: "something" }));
db.collection.update({ name: "name" }, { $push: { name: "something" } });
