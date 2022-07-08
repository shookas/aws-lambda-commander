export class HeadersMapper implements Commander.Mappers.Mapper<AWSLambda.APIGatewayEvent, Commander.Web.Headers> {
    async Map(source: AWSLambda.APIGatewayEvent) {
        if (!source.headers) {
            throw new Error('Invalid Source');
        }
        return source.headers;
    }
}
