import { LambdaLogger } from '../logging/LambdaLogger';
export abstract class Command<Input, Output> {
    private logger: Commander.Logging.Logger | null = null;
    get Logger() {
        if (!this.logger) {
            this.logger = new LambdaLogger();
        }
        return this.logger;
    }
    set Logger(logger: Commander.Logging.Logger) {
        this.logger = logger
    }

    abstract Run(source?: Input): Promise<Output>;
    
    Clean() {
        this.logger = null;
    }
    /**
    * Authorise Function on the base command does nothing base are accessible
    * anonymously
    *
    * @param {string} header The header containing credentials
    * @returns nothing
    * @memberof Command
    */
    Authenticate(event: AWSLambda.APIGatewayEvent): Promise<void> {
        return Promise.resolve();
    }
}