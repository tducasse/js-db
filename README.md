# js-db

[![weekend-project](https://the-weekend-project.vercel.app/api/svg)](https://tducasse.com/posts/the-weekend-project)
[![Build Status](https://travis-ci.org/tducasse/js-db.svg?branch=main)](https://travis-ci.org/tducasse/js-db)
[![Coverage Status](https://coveralls.io/repos/github/tducasse/js-db/badge.svg?branch=main)](https://coveralls.io/github/tducasse/js-db?branch=main)

A very tiny js in-memory database, using native JavaScript objects. Inspired by mongodb's syntax, even though it implements a subset of it.

## Install

```sh
npm i @tducasse/js-db
```

## Docs

We basically export _one_ object, called `db`, to which we attach collections using the `register()` function.

```js
import { db, register } from "@tducasse/js-db";

// register the "users" collection
register("users");

// now you can call `db.users`
db.users.insert({ name: "John" });

const user = db.users.findOne({ name: "John" });
console.log(user);
// { name: "John" }
```

### register()

Registers a collection on the `db` object.

```js
register("users");

// now you can access `users` on `db`
db.users.find();
// []
```

### seed()

Import initial data into the database. Also calls `register()` under the hood.

```js
const items = {
  users: [{ name: "John" }, { name: "Joe" }],
  cities: [{ name: "Paris" }],
};

seed(items);

const users = db.users.find();
// [{ name: "John" }, { name: "Joe" }]
const cities = db.cities.find();
// [{ name: "Paris" }]
```

### reset()

Just a nice helper to reset the database. I mostly use it in tests though!

```js
register("users");

// now you can access `users` on `db`
db.users.find();
// []

reset();
// db.users is now undefined
```

### collection.find()

Finds all the elements that match the query. Calling it without a query argument will just return everything.

```js
register("users");
db.users.insert([{ name: "John" }, { name: "Joe" }]);

const users = db.users.find({ name: "John" });
// [{ name: "John" }]
```

### collection.count()

Like `find()`, except it just returns the number of elements that match the query. Again, calling it without any arguments will count everything.

```js
register("users");
db.users.insert([{ name: "John" }, { name: "Joe" }]);

const count = db.users.find({ name: "John" });
// 1
```

### collection.findOne()

Finds the first (not sure about the order) element that matches the query. Calling it without a query argument will just return the first item (again, not really sure which).

```js
register("users");
db.users.insert([{ name: "John" }, { name: "Joe" }]);

const users = db.users.findOne({ name: "John" });
// { name: "John" }
```

### collection.insert()

You've seen me use it already, but it does what it looks like: inserts the item(s) in the collection. Can be either an array or a single item.

```js
register("users");
// works with an array
db.users.insert([{ name: "John" }, { name: "Joe" }]);
// or with a single element
db.users.insert({ name: "Mark" });
```

### collection.remove()

Removes all the elements that match the query.

```js
register("users");
db.users.insert([{ name: "John" }, { name: "Joe" }]);

db.users.remove({ name: "John" });
const users = db.users.find();
// [{ name: "Joe" }]
```

### collection.update()

Updates every element that matches the query. Use `$set` for single value fields, and `$push` for array fields. `$push` and `$set` don't need the key to exist, they will create it if it doesn't.

```js
register("users");
db.users.insert([{ name: "John" }, { name: "Joe", cities: [] }]);

// use $set for single value fields
db.users.update({ name: "John" }, { $set: { name: "Mark" } });
const users = db.users.find();
// [{ name: "Mark"}, { name: "Joe" }]

// and $push for array fields
db.users.update({ name: "Joe" }, { $push: { cities: "Melbourne" } });
const users = db.users.find();
// [{ name: "Mark"}, { name: "Joe", cities: ["Melbourne"] }]
```

### Note on the query/update object

You can access nested keys using the dot-notation syntax.

```js
register("users");
db.users.insert({ name: "John" });

db.users.update({ name: "John" }, { $set: { "address.city": "Melbourne" } });
const users = db.users.find();
// [{ name: "John", address: { city: "Melbourne" }}]

const user = db.users.findOne({ "address.city": "Melbourne" });
// [{ name: "John", address: { city: "Melbourne" }}]
```

## Creating a shell

You can access the database in your code, importing the `db` object, but you can also create a separate npm script to run it through a Node repl.

```js
// start a socket on 1337
net
  .createServer((socket) => {
    const r = repl.start({
      prompt: "js-db>",
      input: socket,
      output: socket,
      terminal: true,
      preview: false,
    });
    // share the `db` object with the socket
    r.context.db = db;
  })
  .listen(1337);
```

```js
// in cli.js
import net from "net";

const sock = net.connect(1337);

process.stdin.pipe(sock);
sock.pipe(process.stdout);

process.stdin.on("data", (b) => {
  if (b.length === 1 && b[0] === 4) {
    process.stdin.emit("end");
  }
});
```

```js
// in package.json
{
  "scripts:
    // I use esm, but you get the idea
    "cli": "node -r esm cli.js"
}
```

Now, when you run `npm run cli`, you get a node interactive shell (with autocompletion, etc), in which you can access `db`.
