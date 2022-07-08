export const FromEnvironment = function (variable: string, defaultValue?: string): string {
    const result = process.env[variable];
    if (result !== undefined) {
        return result;
    }
    if (defaultValue) {
        return defaultValue;
    }
    // This isn't nice but I think it's the best way to handle missed configuration safely
    // in the short term. It will not function in exactly the same way as it did before -
    // we're returning an empty string rather than undefined but should cover most cases
    // TODO: Remove this once we're confident that we're not seeing any in production over a span of a month (20/09/2020)
    // eslint-disable-next-line no-console
    console.log(`ERROR: Unable to find environment variable ${variable} [Environment Configuration Failure]`);
    return '';
};