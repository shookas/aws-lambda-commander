import { StandardError } from "@commander/errors/errors";
import { BaseValidator } from "@commander/validators/BaseValidator";

export class RegexValidator extends BaseValidator<string> {
    private regex: RegExp;
    constructor(expression: RegExp) {
        super();
        this.regex = expression;
    }
    async Validate(source: string) {
        return new Promise<void>((resolve, reject) => {
            if (this.regex.test(source)) {
                resolve();
            } else {
                this.Logger.Error(`Invald input: ${source} does not match |${this.regex.source}|`);
                reject(new StandardError('Invalid Request'));
            }
        });
    }
}