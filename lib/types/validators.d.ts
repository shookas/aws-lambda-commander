export interface Validator<T> {
    Logger: Commander.Logging.Logger;
    Validate(source: T): Promise<void>;
}
