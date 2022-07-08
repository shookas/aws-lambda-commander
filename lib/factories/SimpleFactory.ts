import { S3, SQS, DynamoDB, CloudFront } from "aws-sdk";
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { NotFoundError } from '../errors/errors';


export const DynamoClient = () => new DynamoDB.DocumentClient({});
export const S3client = () => new S3();

export const SQSclient = () => new SQS({
    apiVersion: '2012-11-05'
});

export const CloudfrontClient = () => new CloudFront({
    apiVersion: '2019-03-26'
});
export const Secret = async<T>(key: string, baseValues: Partial<T> = {}) => {
    const manager = new SecretsManagerClient({ region: 'eu-west-2' });
    const data = await manager.send(
        new GetSecretValueCommand({
            SecretId: key,
        })
    );
    if (!data.SecretString) {
        throw new NotFoundError(`Secret ${key} not found`);
    } else {
        return {
            ...baseValues,
            ...(JSON.parse(data.SecretString) as T),
        }
    }
}