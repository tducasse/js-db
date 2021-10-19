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

export interface PersistenceConfig {
  path?: string
}

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
 * Enables auto persistence.
 * In browser environment LocalStorage is used. Otherwise config.path is required.
 * @param config
 */
export function enableAutoPersistence(config?: PersistenceConfig): void;

/**
 * This is the convenience database object we export
 */
export const db: DB;
