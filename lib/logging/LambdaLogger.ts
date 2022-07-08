import { SNS } from 'aws-sdk';
import { FromEnvironment } from '../configuration/from-environment';

export class LambdaLogger implements Commander.Logging.Logger {
    async Error(details: string | Error): Promise<void> {
        this.Log('ERROR', details);
    }
    async Warning(details: string | Error): Promise<void> {
        this.Log('WARNING', details);
    }
    WarningSync(details: string | Error) {
        this.Log('WARNING', details);
    }
    async Information(details: string | Error): Promise<void> {
        this.Log('INFO', details);
    }
    async Debug(details: string | Error): Promise<void> {
        this.Log('DEBUG', details);
    }
    async Security(details: string | Error): Promise<void> {
        this.Log('SECURITY', details);
    }
    async Log(level: string, details: string | Error) {
        this.LogSync(level, details);
    }
    async Alert(message: string) {
        return new Promise<void>((resolve, reject) => {
            const snsClient: AWS.SNS = new SNS();
            snsClient.publish(
                {
                    Message: message,
                    Subject: FromEnvironment('CRITICAL_SNS_SUBJECT'),
                    TopicArn: FromEnvironment('CRITICAL_SNS'),
                },
                (err, data) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                }
            );
        });
    }

    private LogSync(level: string, details: string | Error) {
        const message = details instanceof Error ? details : details;
        console.log(`${level} : ${details}`);
    }
}
