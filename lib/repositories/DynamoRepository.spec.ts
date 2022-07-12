import { HttpRequestError } from "@commander/errors/Errors";
import AWS = require("aws-sdk");
import { DynamoRepository } from "./DynamoRepository";

type Test = {
    id: string;
    name: string;
};
describe('Dynamo Repository', () => {
    let repository: DynamoRepository<Test>;
    let client: AWS.DynamoDB.DocumentClient;
    let scanMock: jest.SpyInstance<AWS.Request<AWS.DynamoDB.DocumentClient.ScanOutput, AWS.AWSError>>;
    const setMock = (data: AWS.DynamoDB.DocumentClient.ScanOutput) => {
        scanMock.mockImplementation((param, callback) => {
            callback(null, data);
            return {} as AWS.Request<AWS.DynamoDB.DocumentClient.ScanOutput, AWS.AWSError>
        });
    }
    beforeEach(() => {
        client = new AWS.DynamoDB.DocumentClient();
        repository = new DynamoRepository(client, 'Test');
        scanMock = jest.spyOn(client, 'scan')
    })
    it('should be constructable', () => {
        expect(repository).toBeInstanceOf(DynamoRepository);
    });
    describe('Scan', () => {
        it('Should throw an error if the request fails', async () => {
            scanMock.mockImplementation((param, callback) => {
                callback(new HttpRequestError(400, 'GET', 'Error from AWS'), {});
                return {} as AWS.Request<AWS.DynamoDB.DocumentClient.ScanOutput, AWS.AWSError>
            });
            try {
                await repository.Scan({
                    name: 'testName',
                    value: 'testValue',
                });
            } catch (err) {
                expect(scanMock).toHaveBeenCalledWith(
                    {
                        ExpressionAttributeValues: { ':filter': 'testValue' },
                        FilterExpression: 'testName = :filter',
                        TableName: 'Test',
                    }, expect.anything())
                expect(err.message).toEqual('Error from AWS');
            }
        });
        it('should throw an error if the list is empty', async () => {
            const data = { Items: [] };
            setMock(data)
            try {
                await repository.Scan({
                    name: 'testName',
                    value: 'testValue',
                });
            } catch (err) {
                expect(scanMock).toHaveBeenCalledWith({
                    ExpressionAttributeValues: { ':filter': 'testValue' },
                    FilterExpression: 'testName = :filter',
                    TableName: 'Test',
                }, expect.anything())
                expect(err.message).toEqual('');
            }
        });
        it('Should return a list of objects', async () => {
            const data = {
                Items: [{
                    id: 'id',
                    name: 'name',
                }],
            }
            setMock(data)
            const res = await repository.Scan({
                name: 'testName',
                value: 'testValue',
            });
            expect(scanMock).toHaveBeenCalledWith({
                ExpressionAttributeValues: { ':filter': 'testValue' },
                FilterExpression: 'testName = :filter',
                TableName: 'Test',
            }, expect.anything());
            expect(res).toEqual(data.Items)
        });

        it('should return a list of objects with the provided key', async () => {
            const data = {
                Items: [
                    {
                        id: 'id',
                    }]
            };
            setMock(data)
            const res = await repository.Scan(
                {
                    name: 'testName',
                    value: 'testValue',
                },
                ['id']
            );

            expect(scanMock).toHaveBeenCalledWith({
                ExpressionAttributeNames: { '#id': 'id' },
                ExpressionAttributeValues: { ':filter': 'testValue' },
                FilterExpression: 'testName = :filter',
                ProjectionExpression: '#id',
                TableName: 'Test',
            }, expect.anything());
            expect(res).toEqual(data.Items)
        });
        it('should return a list of objects with the provided keys', async () => {
            const data = {
                Items: [
                    {
                        id: 'id',
                        name: 'name'
                    }]
            };
            setMock(data)
            const res = await repository.Scan(
                {
                    name: 'testName',
                    value: 'testValue'
                },
                ['id', 'name']

            );
            expect(scanMock).toHaveBeenCalledWith({
                ExpressionAttributeNames: { '#id': 'id', '#name': 'name' },
                ExpressionAttributeValues: { ':filter': 'testValue' },
                FilterExpression: 'testName = :filter',
                ProjectionExpression: '#id,#name',
                TableName: 'Test',
            }, expect.anything());
            expect(res).toEqual(data.Items)
        });
    })
    describe('List', () => {
        it('Should throw an error if the request fails', async () => {
            scanMock.mockImplementation((param, callback) => {
                callback(new HttpRequestError(400, 'GET', 'Error from AWS'), {});
                return {} as AWS.Request<AWS.DynamoDB.DocumentClient.ScanOutput, AWS.AWSError>
            });
            try {
                await repository.List();
            } catch (err) {
                expect(scanMock).toHaveBeenCalledWith(
                    {
                        TableName: 'Test',
                    }, expect.anything())
                expect(err.message).toEqual('Error from AWS');
            }
        })

        it('Should throw an error if the list is empty', async () => {
            const data = {
                Items: []
            };
            setMock(data)
            try {
                await repository.List();
            } catch (err) {
                expect(scanMock).toHaveBeenCalledWith({
                    TableName: 'Test',
                }, expect.anything())
                expect(err.message).toEqual('');
            }
        })
        it('Should return a list of objects', async () => {

            const data = {
                Items: [{
                    id: 'id',
                    name: 'name'
                }]
            };
            setMock(data)
            const res = await repository.List();
            expect(scanMock).toHaveBeenCalledWith({
                TableName: 'Test',
            }, expect.anything())
            expect(res).toEqual(data.Items);
        })
        it('should return a list of objects with the provided key', async () => {

            const data = {
                Items: [{
                    id: 'id',
                }]
            };
            setMock(data)
            const res = await repository.List(['id']);
            expect(scanMock).toHaveBeenCalledWith({
                ExpressionAttributeNames: { '#id': 'id' },
                ProjectionExpression: '#id',
                TableName: 'Test',
            }, expect.anything())
            expect(res).toEqual(data.Items);
        })

        it('should return a list of objects with the provided keys', async () => {
            const data = {
                Items: [{
                    id: 'id',
                    name: 'name',
                }]
            };
            setMock(data)
            const res = await repository.List(['id', 'name']);
            expect(scanMock).toHaveBeenCalledWith({
                ExpressionAttributeNames: { '#id': 'id', '#name': 'name' },
                ProjectionExpression: '#id,#name',
                TableName: 'Test',
            }, expect.anything())
            expect(res).toEqual(data.Items);
        })
    })
});