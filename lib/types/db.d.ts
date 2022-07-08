export namespace Db {
    interface Index {
        name: string;
        property: string;
    }
    interface Filter {
        name: string;
        value: string | boolean;
        // Require the value in the name field to exactly equal the provided value
        strict?: boolean;
        comparator?: string;
    }
    interface User {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        position?: string;
        claims: string[];
        subscriptions: string[];
        issuer: string;
    }
}