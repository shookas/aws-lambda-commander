/**
* Static helper methods for working with objects
* @export
* @class Objects
*/
export class Objects {
    /**
    * Clean out any empty strings or undefined properties from the object graph
    }
    * Input type is an indexed set of objects and strings, but it should be able to
    * handle any object structure.
    * @static
    * @param {(Commander.Core.Map<{} | string> | null)} input
    * @returns
    * @memberof Objects
    */
    static Clean(input: Commander.Core.Map<{} | string> | null) {
        if (!input) {
            return;
        }
        Object.keys(input).forEach((k) => {
            // Copy this out to a const so that the typeguards can take effect
            const val = input[k];
            if (val instanceof Object) {
                Objects.Clean(input[k] as { [key: string]: {} | string });
            }
            if (typeof val === 'undefined' || (typeof val === 'string' && val.length === 0)) {
                delete input[k];
            }
        });
    }
    static Clone<T>(input: T): T {
        return JSON.parse(JSON.stringify(input)) as T;
    }
}