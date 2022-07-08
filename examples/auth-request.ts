import { FromEnvironment } from '@commander/configuration/from-environment';
import { DynamoClient } from '@commander/factories/SimpleFactory';
import { BaseHandler } from '@commander/handlers/BaseHandler';
import { PathParameterMapper } from '@commander/mappers/PathParameterMapper';
import { DynamoRepository } from '@commander/repositories/DynamoRepository';
import { RegexValidator } from '../lib/validators/RegexValidator';
import { TestAuthCommand } from './TestAuthCommand';
const dynamoClient = DynamoClient();
export const handle = new BaseHandler(
    new TestAuthCommand(
        new DynamoRepository<{ id: string }>(dynamoClient, FromEnvironment('DYNAMODB_ASSETS_TABLE')),
        new DynamoRepository<{ id: string, name: string }>(dynamoClient, FromEnvironment('DYNAMODB_USERS_TABLE'))
    ),
    new PathParameterMapper('id')
).AddInputValidator(new RegexValidator(/.*/)).handle;