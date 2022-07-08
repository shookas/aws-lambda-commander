export class BodyMapper<T = {}> implements Commander.Mappers.Mapper<AWSLambda.APIGatewayEvent, T> {
    async Map(source: AWSLambda.APIGatewayEvent) {
        if (!source.body) {
            throw new Error('Invalid Source');
        }
        try {
            return JSON.parse(source.body);
        } catch {
            throw new Error('Invalid Source');
        }
    }
}
