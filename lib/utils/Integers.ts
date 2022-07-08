export class Integers {
    static Check(input: string | number | null | undefined): boolean {
        const x = Number(input);
        if (isNaN(x)) {
            return false;
        }
        return (x | 0) === x;
    }
    static Pad(value: number, length: number): string {
        let result = value.toString();
        while (result.length < length) {
            result = '0' + result;
        }
        return result;
    }

    static Format(value: number | string) {
        return Number(value).toLocaleString('en-GB');
    }
}
