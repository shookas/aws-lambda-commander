export class PathParameterMapper implements Commander.Mappers.Mapper<AWSLambda.APIGatewayEvent, string | undefined> {
    constructor(private parameterName: string, private required = false) { }
    Map(source: AWSLambda.APIGatewayEvent) {
        return new Promise<string | undefined>((resolve, reject) => {
            try {
                // If we have no path parameters
                if (!source.pathParameters) {
                    // If we have no required element then just return null otherwise
                    // reject
                    if (this.required) {
                        throw new Error(`No Value for ${this.parameterName} present in the path`);
                    } else {
                        resolve(undefined);
                    }
                } else {
                    if (this.parameterName in source.pathParameters) {
                        resolve(source.pathParameters[this.parameterName]);
                    } else {
                        if (this.required) {
                            throw new Error(`No Value for ${this.parameterName} present in the path`);
                        } else {
                            resolve(undefined)
                        }
                    }
                }
            } catch (err) {
                reject(err)
            }
        });
    }
}