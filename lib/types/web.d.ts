export namespace Web {
    export type HeaderValue = string | boolean | number;
    export type Headers = Commander.Core.Map<HeaderValue>;
    export type HttpMethod = 'CONNECT' | 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'TRACE'
}