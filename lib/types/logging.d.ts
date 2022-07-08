export namespace Logging {
    export interface Logger {
        Log(level: string, details: string | Error): Promise<void>;
        Error(details: string | Error): Promise<void>;
        Warning(details: string | Error): Promise<void>;
        WarningSync(details: string | Error): void;
        Information(details: string | Error): Promise<void>;
        Debug(details: string | Error): Promise<void>;
        Security(details: string | Error): Promise<void>;
        Alert(details: string): Promise<void>;
        WarningSync(details: string | Error): void;
    }
}