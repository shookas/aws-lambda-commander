export abstract class BaseError extends Error {
    abstract get ErrorType(): string;

    abstract GenerateResponse(headers: Commander.Web.Headers): AWSLambda.ProxyResult;
    constructor(message?: string,) {
        super(message);
    }
    toString(): string {
        return `${this.name}
        ${this.message}
        ${this.stack}`
    }
}
export class AuthorisationError extends BaseError {
    get ErrorType() {
        return 'SECURITY';
    }
    GenerateResponse(headersValue: Commander.Web.Headers): AWSLambda.ProxyResult {
        return {
            body: JSON.stringify({ message: this.message }),
            headers: headersValue,
            statusCode: 401,
        }
    }
}

export class NotFoundError extends BaseError {
    get ErrorType() {
        return 'INFO';
    }
    GenerateResponse(headersValue: Commander.Web.Headers): AWSLambda.ProxyResult {
        return {
            body: JSON.stringify({ message: this.message }),
            headers: headersValue,
            statusCode: 404,
        }
    }
}
export class StandardError extends BaseError {
    get ErrorType() {
        return 'ERROR';
    }
    GenerateResponse(headersValue: Commander.Web.Headers): AWSLambda.ProxyResult {
        return {
            body: JSON.stringify({ message: this.message }),
            headers: headersValue,
            statusCode: 400,
        }
    }

}

export class InputValidationError extends BaseError {
    get ErrorType() {
        return 'WARNING';
    }
    GenerateResponse(headersValue: Commander.Web.Headers): AWSLambda.ProxyResult {
        return {
            body: JSON.stringify({ message: this.message }),
            headers: headersValue,
            statusCode: 400,
        }
    }

}

export class HttpRequestError extends BaseError implements AWS.AWSError {
    time: Date;
    code: string;
    constructor(readonly statusCode: number, readonly method: string, message?: string) {
        super(message);
        this.code = statusCode.toString();
        this.time = new Date(Date.now());
    }
    get ErrorType() {
        return 'ERROR';
    }
    GenerateResponse(headersValue: Commander.Web.Headers): AWSLambda.ProxyResult {
        return {
            body: JSON.stringify({ message: this.message }),
            headers: headersValue,
            statusCode: this.statusCode,
        }
    }

}



