type DynamoExpressions = AWS.DynamoDB.DocumentClient.ExpressionAttributeNameMap |
    AWS.DynamoDB.DocumentClient.ExpressionAttributeValueMap;
export class DynamoUtils {
    static createExpression(filter: Commander.Db.Filter[], key: keyof Commander.Db.Filter, symbol: '#' | ':'): DynamoExpressions {
        return filter.reduce((accumulator, currentV) => {
            return {
                [`${symbol}${currentV[key]}`]: currentV[key],
                ...accumulator,
            }
        }, {});
    }
    static createFilterExpression(filter: Commander.Db.Filter[], conditionalOperator: AWS.DynamoDB.DocumentClient.ConditionalOperator) {
        return filter.reduce((accumulator, current, index) => {
            accumulator = accumulator + `#${current.name} = :${current.value}`;
            if (index < filter.length - 1) {
                accumulator = accumulator + ` ${conditionalOperator} `;
            }
            return accumulator;
        }, '');
    }
}