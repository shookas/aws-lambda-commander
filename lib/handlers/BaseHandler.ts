import { APIGatewayProxyResult } from 'aws-lambda';
import { FromEnvironment } from '../configuration/from-environment';
import { BaseError } from '../errors/errors';
import { LambdaLogger } from '../logging/LambdaLogger';
import { Command } from './Command';
import { ProxyHandler } from './ProxyHandler';


export class BaseHandler<Input, Output> implements ProxyHandler {
    private static FIXED_HEADERS: Commander.Web.Headers = {
        'Content-Type': 'application/json',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains;',
        // These headers are almost certainly useless on an API but SecOps require
        // them apparently.
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode-block',
        'X-Content-Type-Options': 'nosniff',
        // Cache Control Headers
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
    };
    private inputValidators: Array<Commander.Validator<Input>> = [];
    private outputValidators: Array<Commander.Validator<Output>> = [];
    private logger: Commander.Logging.Logger | null = null;

    constructor(private command: Command<Input, Output>, private eventMapper?: Commander.Mappers.Mapper<AWSLambda.APIGatewayEvent, Input>) { }

    get Logger(): Commander.Logging.Logger {
        if (!this.logger) {
            this.logger = new LambdaLogger();
        }
        return this.logger;
    }
    set Logger(logger: Commander.Logging.Logger) {
        this.logger
    }
    AddInputValidator(validator: Commander.Validator<Input>): BaseHandler<Input, Output> {
        validator.Logger = this.Logger;
        this.inputValidators.push(validator);
        return this;
    }
    AddOutputValidator(validator: Commander.Validator<Output>): BaseHandler<Input, Output> {
        validator.Logger = this.Logger;
        this.outputValidators.push(validator);
        return this;
    }
    // Using an instance function here rather than a prototype method
    // to avoid 'this' getting lost
    // (https://github.com/Microsoft/TypeScript/wiki/'this'-in-TypeScript)
    handle: AWSLambda.ProxyHandler = async (event, context): Promise<APIGatewayProxyResult> => {
        // If this is a CORS request then handle it
        if (event.httpMethod === 'OPTIONS') {
            this.Logger.Information('OPTIONS request');
            return {
                body: '',
                headers: BaseHandler.GenerateCorsHeaders(event, true),
                statusCode: 200,
            }
        };
        try {
            // If we have an input mapper use it here
            // Alternately the Event goes as Command Input and the command has to
            // be able to have input type IEvent
            const input = this.eventMapper ? await this.eventMapper.Map(event) : event;
            // Run any input validators that we have (all validators run
            //asynchronously)
            await Promise.all(this.inputValidators.map((validator) => validator.Validate(input as Input)));
            // Clean the command
            this.command.Clean();
            // Setup the command logger
            this.command.Logger = this.Logger;
            // Run any necessary authentication
            await this.command.Authenticate(event);
            // Process the command
            const result = await this.command.Run(input as Input);
            // Run any output validators we have (all validators run
            // asynchronously)
            await Promise.all(this.outputValidators.map((validator) => validator.Validate(result)));

            // Callback with the result 
            return {
                body: JSON.stringify(result),
                headers: BaseHandler.GetHeaders(event),
                statusCode: 200
            };

        } catch (error) {
            // If the error has a method to generate a specific response use it
            // otherwise use a generic error.
            if (error instanceof BaseError) {
                this.Logger.Log((error as BaseError).ErrorType, error as Error);
                return error.GenerateResponse(BaseHandler.GetHeaders(event));
            } else {
                // Assume this is an Error and log as such
                this.Logger.Error(error);
                // Callback with the result
                return {
                    body: JSON.stringify({ messages: ['Internal Server Error'] }),
                    headers: BaseHandler.GetHeaders(event),
                    statusCode: 500,
                }
            }
        }
    }
    private static GetHeaders(event: AWSLambda.APIGatewayEvent): Commander.Web.Headers {
        return Object.assign(BaseHandler.FIXED_HEADERS, this.GenerateCorsHeaders(event));
    }


    private static GenerateCorsHeaders(event: AWSLambda.APIGatewayEvent, preflight = false): Commander.Web.Headers {
        const headers: Commander.Web.Headers = {};
        const origin = this.GetHeader('Origin', event.headers).toString();
        const allowedOrigins: string[] = FromEnvironment('CORS_VALID_ORIGINS').split(',');
        headers['Access-Control-Allow-Origin'] = allowedOrigins.indexOf(origin) >= 0 ? origin : allowedOrigins[0];
        headers['Access-Control-Allow-Credentials'] = true;
        if (preflight) {
            // There's something not right here - a number of methods on management stack don't have CORS_VALID_METHODS set.
            // Therefore they return just OPTIONS, however the subsequent POSTS Succeed (?!)
            // TODO: Needs more investigation
            headers['Access-Control-Allow-Methods'] = FromEnvironment('CORS_VALID_METHODS') ? FromEnvironment('CORS_VALID_METHODS') : 'OPTIONS';
            headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, livestream-authorization';
            headers['Access-Control-Max-Age'] = '600';
            headers.Vary = 'Origin';
        }
        return headers;
    }
    /**
    * Pull headers from the request exists because different browsers
    use different capitalisation on the CORS headers. It looks first for
    * the all lower-case ones (which is what good browsers use) and then
    will attempt to find the variants that some IElls use.
    * @private
    * @param {string} name Note must be the upper-case version of the header name
    * @param {Commander.Web.Headers} headers The collection of headers from the event
    * @returns The value of the header is found empty string if not
    * @memberof BaseHandler
    */
    private static GetHeader(name: string, headers: Commander.Web.Headers) {
        if (headers.hasOwnProperty(name.toLocaleLowerCase())) {
            return headers[name.toLocaleLowerCase()];
        }
        if (headers.hasOwnProperty(name)) {
            return headers[name];
        }
        return '';
    }
}