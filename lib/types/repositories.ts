export namespace Repositories {
    export interface Delta {
        [key: string]: string | number | boolean | object;
    }
    export interface ReadOnlyRepository<T extends Commander.Core.Identifiable> {
        /**
        * Get an item based on 'id'
        *Note this will never return null | undefined
        *
        * @param {string} query The id of the item
        * @returns Specified Item
        * @throws {Commander. Errors.NotFoundError} if the Item cannot be found
        * @memberof ReadOnlyRepository
        **/
        Get(query: string): Promise<T>;
        /**
        * Get an item based on indexed property
        *
        *Note this will never return null | undefined
        *
        * @param {string} query The value of the indexed property to search
        * @param {Commander.Db.Index} [index] The name of the index and the indexed property to use
        * @returns Specified Item
        * @throws {Commander. Errors.NotFoundError) if the Item cannot be found
        * @throws {Error} if there are duplicate items (possible when querying on a secondary index)
        * @memberof DynamoRepository
        **/
        Get(query: string, index: Commander.Db.Index): Promise<T>;
        Exists(query: string, index?: Commander.Db.Index): Promise<boolean>;
        Count(query?: string, index?: Commander.Db.Index): Promise<number>;
        Query(query: string, index: Commander.Db.Index): Promise<T[]>;
        List(columns?: string[]): Promise<T[]>;
        Scan(filter: Commander.Db.Filter, columns?: string[]): Promise<T[]>;
    }
    export interface WriteOnlyRepository<T extends Commander.Core.Identifiable> {
        Create(item: T): Promise<T>;
    }

    export interface Repository<T extends Commander.Core.Identifiable> extends ReadOnlyRepository<T> {
        Create(item: T): Promise<T>;
        Update(item: T): Promise<void>;
        Update(id: string, delta: Delta): Promise<void>;
        Delete(id: string): Promise<void>;
        ExistsOne(filters: Commander.Db.Filter[], conditionOperator: string): Promise<T[]>;
        GetAllByProperty(query: string, index: Commander.Db.Index, filters: Commander.Db.Filter[], conditionOperator?: string): Promise<T[]>;
    }
}