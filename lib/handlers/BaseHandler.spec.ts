import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { BaseError } from '@commander/errors/errors';
import { Command } from './Command';
import { BaseHandler } from './BaseHandler';
import { LambdaLogger } from '@commander/logging/LambdaLogger';
import { Validator } from '@commander/types';
jest.mock('@commander/logging/LambdaLogger')

describe('BaseHandler', () => {
    const mockInput = 'input';
    const mockMappedInput = 'mockMapperInput';
    const mockOutput = 'output';
    const mockRunOutput = 'mockRunOutput';
    const expectedDefaultHeaders = {
        'Content-Type': 'application/json',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains;',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode-block',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'Access-Control-Allow-Origin': '',
        'Access-Control-Allow-Credentials': true,
    };
    class MockCommand extends Command<string, string> {
        async Run(source: typeof mockInput): Promise<string> {
            return mockOutput;
        }
    }
    class MockEventMapper implements Commander.Mappers.Mapper<APIGatewayProxyEvent, string> {
        async Map(event: APIGatewayProxyEvent) {
            return mockMappedInput;
        }
    }
    let mockEvent: APIGatewayProxyEvent;
    let handler: BaseHandler<string, string>;
    let command: Command<string, string>;
    let mapper: Commander.Mappers.Mapper<AWSLambda.APIGatewayEvent, string>;
    beforeEach(() => {
        process.env.CORS_VALID_ORIGINS = '';
        process.env.CORS_VALID_METHODS = '';

        mockEvent = { headers: {} } as APIGatewayProxyEvent;
        command = new MockCommand();
        jest.spyOn(command, 'Run').mockResolvedValue(mockRunOutput);
        jest.spyOn(command, 'Clean');
        jest.spyOn(command, 'Authenticate');
        mapper = new MockEventMapper();
        jest.spyOn(mapper, 'Map').mockResolvedValue(mockMappedInput);
        handler = new BaseHandler(command);
    });
    afterAll(() => {
        delete process.env.CORS_VALID_ORIGINS;
        delete process.env.CORS_VALID_METHODS;
    });
    it('should be constructable', () => {
        expect(handler).toBeInstanceOf(BaseHandler);
    });
    it('should expose interface methods', () => {
        expect(typeof handler.AddInputValidator).toBe('function');
        expect(typeof handler.AddOutputValidator).toBe('function');
    });
    describe('Logger', () => {
        it('should get lambda logger if not set', () => {
            expect(handler.Logger).toBeInstanceOf(LambdaLogger);
        });
    });

    describe('Validators', () => {
        class MockValidator implements Validator<string> {
            Logger: LambdaLogger;
            async Validate(source: string) { }

        }
        let mockValidator: MockValidator;
        let validateStub: jest.SpyInstance;
        beforeEach(() => {
            mockValidator = new MockValidator();
            validateStub = jest.spyOn(mockValidator, 'Validate').mockResolvedValue();
        });
        it('should push input validator and ivoke that with event object', async () => {
            handler.AddInputValidator(mockValidator);
            await handler.handle(mockEvent, {} as Context, () => { });
            expect(validateStub).toHaveBeenCalledTimes(1);
            expect(validateStub).toHaveBeenCalledWith(mockEvent);
        });
        it('should ivoke input validator with mapped object when event mapper is given', async () => {
            handler = new BaseHandler(command as unknown as MockCommand, mapper);
            handler.AddInputValidator(mockValidator);
            await handler.handle(mockEvent, {} as Context, () => { });
            expect(validateStub).toHaveBeenCalledTimes(1);
            expect(validateStub).toHaveBeenCalledWith(mockMappedInput);
        });
        it('should push output validator and ivoke that with event object', async () => {
            handler.AddOutputValidator(mockValidator);
            await handler.handle(mockEvent, {} as Context, () => { });
            expect(validateStub).toHaveBeenCalledTimes(1);
            expect(validateStub).toHaveBeenCalledWith(mockRunOutput);
        });
    });
    describe('handle', () => {
        it('should return empty body and status code 200 if http method is OPTIONS', async () => {
            // given
            handler.Logger = new LambdaLogger();
            
            const loggerSpy = jest.spyOn(handler.Logger, 'Information');
            mockEvent = { ...mockEvent, httpMethod: 'OPTIONS' };
            // when
            const result = await handler.handle(mockEvent, {} as Context, () => { }) as APIGatewayProxyResult;
            // then
            expect(loggerSpy).toHaveBeenCalledWith('OPTIONS request')
            expect(result?.body).toEqual('');
            expect(result?.statusCode).toEqual(200);
        });
        it('should call command Run function with event', async () => {
            await handler.handle(mockEvent, {} as Context, () => { });
            expect(command.Run).toHaveBeenCalledTimes(1)
            expect(command.Run).toHaveBeenCalledWith(mockEvent);
        });
        it('should call command clean function', async () => {
            await handler.handle(mockEvent, {} as Context, () => { });
            expect(command.Clean).toHaveBeenCalledTimes(1)
            expect(command.Clean).toHaveBeenCalledWith();
        });
        it('should call command Authenticate function with event', async () => {
            await handler.handle(mockEvent, {} as Context, () => { });
            expect(command.Authenticate).toBeCalledTimes(1);
            expect(command.Authenticate).toBeCalledWith(mockEvent);
        });
        it('should call command Run function with mapped value when mapper given', async () => {
            handler = new BaseHandler(command as unknown as MockCommand, mapper);
            await handler.handle(mockEvent, {} as Context, () => { });
            expect(mapper.Map).toBeCalledWith(mockEvent);
            expect(command.Run).toBeCalledWith(mockMappedInput);
        });
        it('should return body from command Run result', async () => {
            const givenBody = { result: 'result' };
            (command.Run as jest.Mock).mockResolvedValue(givenBody);
            const result = await handler.handle(mockEvent, {} as Context, () => { }) as APIGatewayProxyResult;
            expect(result?.body).toEqual(JSON.stringify(givenBody));
        });
        it('should return status code 200', async () => {
            const result = await handler.handle(mockEvent, {} as Context, () => { }) as APIGatewayProxyResult;
            expect(result?.statusCode).toEqual(200);
        });

        describe('error handling', () => {
            class BaseCustomError extends BaseError {
                constructor(message: string) {
                    super(message);
                }
                get ErrorType(): string {
                    return 'custom error';
                }

                GenerateResponse(headers: Commander.Web.Headers): APIGatewayProxyResult {
                    return {
                        body: this.message,
                        statusCode: 400,
                        headers,
                    }
                }
            }
            it('should handle base errors', async () => {
                // given
                const expectedMessage = 'base error message';
                const expectedError = new BaseCustomError(expectedMessage);
                (command.Run as jest.Mock).mockRejectedValue(expectedError);
                handler.Logger = new LambdaLogger();
                const loggerSpy = jest.spyOn(handler.Logger, 'Log');
                // when
                const result = await handler.handle(mockEvent, {} as Context, () => { });
                // then
                expect(loggerSpy).toHaveBeenCalledWith('custom error', expectedError)
                expect(result).toEqual({
                    body: expectedMessage,
                    statusCode: 400,
                    headers: expectedDefaultHeaders,
                });
            });
            it('should handle other errors', async () => {
                // given
                const expectedMessage = 'other error message';
                const expectedError = new Error(expectedMessage);
                (command.Run as jest.Mock).mockRejectedValue(expectedError);
                handler.Logger = new LambdaLogger();
                const loggerSpy = jest.spyOn(handler.Logger, 'Error');
                // when
                const result = await handler.handle(mockEvent, {} as Context, () => { });
                // then
                expect(loggerSpy).toHaveBeenCalledWith(expectedError)
                expect(result).toEqual({
                    body: JSON.stringify({ messages: ['Internal Server Error'] }),
                    statusCode: 500,
                    headers: expectedDefaultHeaders,
                });
            });
        });

        describe('headers', () => {
            const expectedDefaultOptionsHeaders = {
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, livestream-authorization',
                'Access-Control-Allow-Methods': 'OPTIONS',
                'Access-Control-Allow-Origin': '',
                'Access-Control-Max-Age': '600',
                Vary: 'Origin',
            };
            it('should return default headers', async () => {
                const result = await handler.handle(mockEvent, {} as Context, () => { }) as APIGatewayProxyResult;
                expect(result.headers).toEqual(expectedDefaultHeaders);
            });
            it('should allow cors origin only for first element from sys variable if origin from event is not listed in sys variable',
                async () => {
                    mockEvent = { ...mockEvent, headers: { Other: 'mockHeader' } };
                    process.env.CORS_VALID_ORIGINS = 'A,B,C';
                    const expectedHeaders = { ...expectedDefaultHeaders, 'Access-Control-Allow-Origin': 'A' };
                    const result = await handler.handle(mockEvent, {} as Context, () => { }) as APIGatewayProxyResult;
                    expect(result?.headers).toEqual(expectedHeaders);
                });
            it('should allow cors origin from event if listed in sys variable', async () => {
                mockEvent = { ...mockEvent, headers: { Origin: 'B' } };
                process.env.CORS_VALID_ORIGINS = 'A,B,C';
                const expectedHeaders = { ...expectedDefaultHeaders, 'Access-Control-Allow-Origin': 'B' };
                const result = await handler.handle(mockEvent, {} as Context, () => { }) as APIGatewayProxyResult;
                expect(result?.headers).toEqual(expectedHeaders);
            });
            it('should allow cors origin from event if listed in sys variable mapped to lowercase', async () => {
                mockEvent = { ...mockEvent, headers: { origin: 'B' } };
                process.env.CORS_VALID_ORIGINS = 'A,B,C';
                const expectedHeaders = { ...expectedDefaultHeaders, 'Access-Control-Allow-Origin': 'B' };
                const result = await handler.handle(mockEvent, {} as Context, () => { }) as APIGatewayProxyResult;
                expect(result?.headers).toEqual(expectedHeaders);
            });
            it('should set default headers for OPTIONS http method', async () => {
                mockEvent = { ...mockEvent, httpMethod: 'OPTIONS' };
                const result = await handler.handle(mockEvent, {} as Context, () => { }) as APIGatewayProxyResult;
                expect(result?.headers).toEqual(expectedDefaultOptionsHeaders);
            });
            it('should set valid methods from sys variable for OPTIONS http method', async () => {
                process.env.CORS_VALID_METHODS = 'GET,POST';
                mockEvent = { ...mockEvent, httpMethod: 'OPTIONS' };
                const expectedHeaders = { ...expectedDefaultOptionsHeaders, 'Access-Control-Allow-Methods': 'GET,POST' };
                const result = await handler.handle(mockEvent, {} as Context, () => { }) as APIGatewayProxyResult;
                
                expect(result?.headers).toEqual(expectedHeaders);
            });
        });
    });
});
