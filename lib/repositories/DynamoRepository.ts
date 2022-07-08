import { NotFoundError } from '../errors/errors';
import { Db } from '../types';
import { DynamoUtils } from '../utils/DynamoUtils';
import { Objects } from '../utils/Objects';

export class DynamoRepository<T extends Commander.Core.Identifiable> implements Commander.Repositories.Repository<T> {
    constructor(private client: AWS.DynamoDB.DocumentClient, private table: string) { }
    Query(query: string, index: Db.Index): Promise<T[]> {
        throw new Error('Method not implemented.');
    }
    /**
    * Get an item based on 'id' or indexed property if an index is specified
    * Note this will never return null | undefined
    * @param {string} query The id of the item or indexed property to search for if index is specified
    * @param {Commander. Db. Index} [index] Optional if we're using an secondary index
    * @returns Specified Item
    * @throws {Commander. Errors.NotFoundError} if the Item cannot be found
    * @throws {Error} if there are duplicate items (possible when querying on a secondary index)
    * @throws {AWSError} if there is a failure in the call to Dynamo
    *@memberof DynamoRepository
    */
    async Get(query: string, index?: Commander.Db.Index): Promise<T> {
        if (index) {
            return new Promise<T>((resolve, reject) => {
                this.client.query(
                    {
                        TableName: this.table,
                        IndexName: index.name,
                        KeyConditionExpression: `#${index.property} = query`,
                        ExpressionAttributeValues: { ':query': query },
                        ExpressionAttributeNames: { [`#${index.property}`]: index.property }
                    },
                    (err, data) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (!data.Items || data.Items.length == 0) {
                            reject(new NotFoundError());
                            return;
                        }
                        if (data.Items.length > 1) {
                            reject(new Error(`Multiple items found with ${index.property}:${query}`));
                            return;
                        }
                        resolve(data.Items as unknown as T);
                    }
                );
            })

        } else {
            return new Promise<T>((resolve, reject) => {
                this.client.get(
                    {
                        TableName: this.table,
                        Key: {
                            id: query,
                        },
                    },
                    (err, data) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (data.Item) {
                            resolve(data.Item as T);
                            return;
                        }
                        reject(new NotFoundError());
                    }
                )
            })
        }
    };

    async Exists(query: string, index?: Commander.Db.Index) {
        if (index) {
            return new Promise<boolean>((resolve, reject) => {
                this.client.query(
                    {
                        TableName: this.table,
                        IndexName: index.name,
                        KeyConditionExpression: `#${index.property} = : query`,
                        ExpressionAttributeValues: { ':query': query },
                        ExpressionAttributeNames: { [`#${index.property}`]: index.property },
                        Select: 'COUNT',
                    },
                    (err, data) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(data.Count !== undefined && data.Count > 0);
                    }
                )
            })
        } else {
            return new Promise<boolean>((resolve, reject) => {
                this.client.get(
                    {
                        TableName: this.table,
                        Key: {
                            id: query
                        }
                    },
                    (err, data) => {
                        if (err) {
                            reject(err)
                        }
                        resolve(data.Item !== undefined)
                    }
                );
            });
        }
    }

    async Count(query?: string, index?: Commander.Db.Index) {
        if (query && index) {
            return new Promise<number>((resolve, reject) => {
                this.client.query(
                    {
                        TableName: this.table,
                        IndexName: index.name,
                        KeyConditionExpression: `#${index.property} = : query`,
                        ExpressionAttributeValues: { ':query': query },
                        ExpressionAttributeNames: {
                            [`#${index.property}`]: index.property
                        },
                        Select: 'COUNT',
                    },
                    (err, data) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(data.Items ? data.Count : 0);
                    }
                )
            })
        } else {

            return new Promise<number>((resolve, reject) => {
                this.client.scan({ TableName: this.table, Select: 'COUNT' }, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(data.Count ? data.Count : 0);
                })
            })
        }
    }



    async Scan(filter: Commander.Db.Filter, columns?: string[]) {
        const options: AWS.DynamoDB.DocumentClient.ScanInput = {
            TableName: this.table,
            ExpressionAttributeValues: {
                ':filter': filter.value,
            },
            FilterExpression: `${filter.name} = :filter`,
        }
        if (columns && columns.length > 0) {
            const expressions: AWS.DynamoDB.DocumentClient.AttributeMap = {};
            columns.forEach((el) => {
                expressions[`#${el}`] = el;
            });
            options.ExpressionAttributeNames = expressions;
            options.ProjectionExpression = columns.map((key) => `#${key}`).join(',');
        }
        return new Promise<T[]>((resolve, reject) => {
            this.client.scan(options, (err, data) => {
                if (err) {
                    reject(err);
                };
                if (data.Items && data.Items.length) {
                    resolve(data.Items as T[]);
                } else {
                    reject(new NotFoundError());
                }
            });
        });
    }

    async SearchBy(filter: Commander.Db.Filter, columns?: string[]) {
        const filterExpression = filter.strict ? `#${filter.name} = :filter` : `contains(#${filter.name}, :filter)`;
        const options: AWS.DynamoDB.DocumentClient.ScanInput = {
            TableName: this.table,
            ExpressionAttributeValues: {
                ':filter': filter.value,
            },
            FilterExpression: filterExpression,
        };
        const expressions: AWS.DynamoDB.DocumentClient.AttributeMap = {};
        expressions[`#${filter.name}`] = filter.name;
        if (columns && columns.length > 0) {
            columns.forEach((el) => {
                expressions[`#${el}`] = el;
            });
            options.ExpressionAttributeNames = expressions;
            options.ProjectionExpression = columns.map((key) => `#${key}`).join(',');
        }
        return this.ScanComplete(options);
    }



    async List(columns?: string[]) {
        const options: AWS.DynamoDB.DocumentClient.ScanInput = {
            TableName: this.table,
        };
        if (columns && columns.length > 0) {
            const expressions: AWS.DynamoDB.DocumentClient.AttributeMap = {};
            columns.forEach((el) => {
                expressions[`#${el}`] = el;
            })
            options.ExpressionAttributeNames = expressions;
            options.ProjectionExpression = columns.map((key) => `#${key}`).join(',');
        }
        return this.ScanComplete(options);
    }

    async Create(item: T) {
        // Clean the incoming item of any empty string properties (which break dynamo)
        Objects.Clean(item);
        return new Promise<T>((resolve, reject) => {
            this.client.put(
                {
                    TableName: this.table,
                    Item: item,
                },
                (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(item);
                }
            );
        })
    }



    async Update(item: T): Promise<void>;
    async Update(itemId: string, delta: Commander.Repositories.Delta): Promise<void>;
    async Update(source: string | T, delta?: Commander.Repositories.Delta): Promise<void> {
        if (delta) {
            const params: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
                TableName: this.table,
                Key: {
                    id: source,
                },
                ReturnValues: 'NONE',
                UpdateExpression: 'SET',
            }
            // If we only have one property and the value is empty we need to switch
            // up the update expression
            if (Object.getOwnPropertyNames(delta).length === 1 && delta[Object.getOwnPropertyNames(delta)[0]] === '') {
                params.UpdateExpression = `REMOVE ${Object.getOwnPropertyNames(delta)[0]}`;
            } else {
                params.ExpressionAttributeNames = {};
                params.ExpressionAttributeValues = {};
                Object.getOwnPropertyNames(delta).forEach((property) => {
                    params.UpdateExpression += `${property}=:${property}, `;
                    if (params.ExpressionAttributeNames) {
                        params.ExpressionAttributeNames[`:${property}`] = property;
                    }
                    if (params.ExpressionAttributeValues) {
                        params.ExpressionAttributeValues[`:${property} `] = delta[property];
                    }
                });
            }

            if (params.UpdateExpression) {
                params.UpdateExpression = params.UpdateExpression.replace(/\s*,\s*$/, '');
            }
            return new Promise<void>((resolve, reject) => {
                this.client.update(params, (error, data) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
        } else {
            // Clean the incoming item of any empty string properties (which break dynamo)
            Objects.Clean(source as T);
            return new Promise<void>((resolve, reject) => {
                const params = { TableName: this.table, Item: source as T };
                this.client.put(params, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    return resolve();
                });
            })
        }
    }



    async Delete(index: string) {
        return new Promise<void>((resolve, reject) => {
            this.client.delete({ TableName: this.table, Key: { id: index } }, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    async ExistsOne(filters: Commander.Db.Filter[], conditionOperator: string): Promise<T[]> {
        let options: AWS.DynamoDB.DocumentClient.ScanInput = {
            TableName: this.table,
            ExpressionAttributeValues: {},
            ExpressionAttributeNames: {},
            FilterExpression: '',
        };

        const expressionAttr = filters.reduce((previous, current: Commander.Db.Filter, index: number) => {
            const filterName = `:filter${index}`;
            return Object.assign(previous, { [filterName]: current.value });
        }, {});

        const expressionAttrName = filters.reduce((previous, current: Commander.Db.Filter, index: number) => {
            const filterValue = `#field${index}`;
            return Object.assign(previous, { [filterValue]: current.name });
        }, {});

        const filterExp = filters
            .map((val: Commander.Db.Filter, index: number) => {
                const filterName = `:filter${index}`;
                const filterValue = `#field${index}`;
                const comparator = !!val.comparator ? val.comparator : '=';
                return `${filterValue} ${comparator} ${filterName}`;
            })
            .join(`${conditionOperator} `);
        options = {
            ...options,
            ExpressionAttributeValues: expressionAttr,
            ExpressionAttributeNames: expressionAttrName,
            FilterExpression: filterExp,
        }
        return await this.ScanComplete(options);
    }


    GetAllByProperty(query: string, index: Commander.Db.Index, filters: Commander.Db.Filter[], conditionOperator?: string) {
        let expressionAttrName = {
            [`#${index.property}`]: index.property
        };
        let expressionAttr = { ':query': query };
        let options: AWS.DynamoDB.DocumentClient.QueryInput = {
            TableName: this.table,
            IndexName: index.name,
            KeyConditionExpression: `#${index.property} = :query`,
            ExpressionAttributeNames: {
                [`#${index.property}`]: index.property
            },
            ExpressionAttributeValues: { ':query': query },
            FilterExpression: '',
        }
        expressionAttr = filters.reduce((previous, current: Commander.Db.Filter, i: number) => {
            const filterName = `:filter${i}`;
            return Object.assign(previous, { [filterName]: current.value });
        }, expressionAttr);

        expressionAttrName = filters.reduce((previous, current: Commander.Db.Filter, i: number) => {
            const filterValue = `#field${i}`;
            return Object.assign(previous, { [filterValue]: current.name });
        }, expressionAttrName);

        const filterExp = conditionOperator
            ? filters
                .map((val: Commander.Db.Filter, i: number) => {
                    const filterName = `:filter${i}`;
                    const filterValue = `#field${i}`;
                    return `${filterValue} = ${filterName}`;
                })
                .join(` ${conditionOperator} `)
            : filters
                .map((val: Commander.Db.Filter, i: number) => {
                    const filterName = `:filter${i}`;
                    const filterValue = `#field${i}`;
                    return `${filterValue} = ${filterName}`;
                })
                .join();
        options = {
            ...options,
            ExpressionAttributeValues: expressionAttr,
            ExpressionAttributeNames: expressionAttrName,
            FilterExpression: filterExp,
        }
        return new Promise<T[]>((resolve, reject) => {
            this.client.query(options, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (data.Items && data.Items.length) {
                    resolve(data.Items as T[]);
                } else {
                    reject(new NotFoundError());
                }
            });
        });
    }


    protected async ScanComplete(params: AWS.DynamoDB.DocumentClient.ScanInput): Promise<T[]> {
        const items: T[] = [];
        await this.ScanRecursive(params, items);
        return items;
    }

    private async ScanRecursive(params: AWS.DynamoDB.DocumentClient.ScanInput, items: T[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.client.scan(params, async (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (data.Items) {
                    items.push(... (data.Items as T[]));
                }
                if (data.LastEvaluatedKey) {
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    await this.ScanRecursive(params, items);
                }
                resolve();
            });
        });
    }


    async simpleTableFilter(filter: Commander.Db.Filter[], logicalOperator: AWS.DynamoDB.DocumentClient.ConditionalOperator) {
        const expressionAttributeNames = DynamoUtils.createExpression(filter, 'name', '#');
        const expressionAttributeValues = DynamoUtils.createExpression(filter, 'value', ':');
        const filterExpresion = DynamoUtils.createFilterExpression(filter, logicalOperator);
        return this.ScanComplete({
            TableName: this.table,
            FilterExpression: filterExpresion,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
        });
    }
}

