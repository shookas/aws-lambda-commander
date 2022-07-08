export class Currencies {
    static Format(value: number | string, decimalPlaces =
        2): string {
        return Number(value).toLocaleString('en-GB', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        });
    }
}
