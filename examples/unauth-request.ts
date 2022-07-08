import { FromEnvironment } from '@commander/configuration/from-environment';
import { DynamoClient } from '@commander/factories/SimpleFactory';
import { BaseHandler } from '@commander/handlers/BaseHandler';
import { PathParameterMapper } from '@commander/mappers/PathParameterMapper';
import { DynamoRepository } from '@commander/repositories/DynamoRepository';
import { RegexValidator } from '../lib/validators/RegexValidator';
import { TestCommand } from './TestCommand';
const dynamoClient = DynamoClient();
export const handle = new BaseHandler(
    new TestCommand(
        new DynamoRepository<{ id: string }>(dynamoClient, FromEnvironment('DYNAMODB_ASSETS_TABLE')),
    ),
    new PathParameterMapper('id')
).AddInputValidator(new RegexValidator(/.*/)).handle;