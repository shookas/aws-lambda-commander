import { LambdaLogger } from '../logging/LambdaLogger';

export abstract class BaseValidator<T> implements Commander.Validator<T> {
    private logger: Commander.Logging.Logger | null = null;

    get Logger() {
        if (!this.logger) {
            this.logger = new LambdaLogger();
        }
        return this.logger;
    }
    set Logger(v: Commander.Logging.Logger) {
        this.logger = v;
    }
    abstract Validate(source: T): Promise<void>;
}