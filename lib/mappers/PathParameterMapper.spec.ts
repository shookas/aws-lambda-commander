import { PathParameterMapper } from './PathParameterMapper';
describe('Path parameter Mapper', () => {
    const emptyApiGatewayEvent = {} as AWSLambda.APIGatewayEvent;
    it('should thow an error with a required parameter in the absence of all path parameters', async () => {
        const mapperValue = new PathParameterMapper('testItem', true);
        await expect(mapperValue.Map(emptyApiGatewayEvent)).rejects.toEqual(new Error('No Value for testItem present in the path'));
    });
    it('should map to undefined with an optional parameter in the absence of all path parameters', async () => {
        const mapperValue = new PathParameterMapper('testItem', false);
        await expect(mapperValue.Map(emptyApiGatewayEvent)).resolves.toEqual(undefined);
    });
    it('Required should default to false', async () => {
        const mapperValue = new PathParameterMapper('testItem');
        await expect(mapperValue.Map(emptyApiGatewayEvent)).resolves.toEqual(undefined);
    });
    it('should successfully map where parameter present', async () => {
        const mapperValue = new PathParameterMapper('testItem', false);
        const event = { ...emptyApiGatewayEvent, pathParameters: { testItem: 'testValue' } };
        await expect(mapperValue.Map(event)).resolves.toEqual('testValue');
    });
    it('Should map to undefined where parameter not present or required', async () => {
        const mapperValue = new PathParameterMapper('testItem', false);
        const event = { ...emptyApiGatewayEvent, pathParameters: { testItem2: 'testValue' } };
        expect(mapperValue.Map(event)).resolves.toEqual(undefined);
    });
    it('Should throw an error where parameter not present and required', async () => {
        const mapperValue = new PathParameterMapper('testItem4', true);
        const event = { ...emptyApiGatewayEvent, pathParameters: { testItem2: 'testValue' } };
        await expect(mapperValue.Map(event)).rejects.toEqual(new Error('No Value for testItem4 present in the path'));
    });
});
