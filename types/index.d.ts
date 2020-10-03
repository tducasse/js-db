export interface Record {
  [propName: string]: any;
}

export interface Collection {
  [index: number]: Record;
}

export interface Store {
  [propName: string]: Collection;
}

type QueryExpression = Record;
type Records = Collection;

export interface UpdateExpression {
  $set?: QueryExpression;
  $push?: QueryExpression;
}

export interface RegisteredCollection {
  find(query?: QueryExpression): Records;
  findOne(query?: QueryExpression): Record;
  count(query?: QueryExpression): number;
  insert(items: Record | Records): void;
  update(query?: QueryExpression, update?: UpdateExpression): void;
  remove(query?: QueryExpression): void;
}

export interface DBFunc {
  getStore(): Store;
}

export type DB = DBFunc & {
  [collectionName: string]: RegisteredCollection;
};

/**
 * Register a collection in the database
 * @param collection The name of the collection to register
 */
export function register(collection: string): void;

/**
 * Resets the global objects (db, store)
 */
export function reset(): boolean;

/**
 * Initialise the database with seed data
 * @param seeds An object that looks like {collection:[{}, {}, ...], ...}
 */
export function seed(seeds: Store): boolean;

/**
 * This is the convenience database object we export
 */
export const db: DB;
