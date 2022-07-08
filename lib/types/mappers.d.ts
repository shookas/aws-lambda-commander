export namespace Mappers {
    export interface Mapper<Input, Output> {
        Map(source: Input | undefined): Promise<Output | undefined>;
    }
    export interface SyncMapper<Input, Output> {
        Map(source: Input | undefined): Output | undefined;
    }
    export interface ApiRequestMapperOptions {
        queryStringParameters?: string[];
        pathParameters?: string[];
    }
    export interface ApiRequestMapperOutput<BodyType> {
        queryStringParameters?: Commander.Core.Map<string>;
        pathParameters?: Commander.Core.Map<string>;
        body?: BodyType;
    }
}