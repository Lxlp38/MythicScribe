export class HangingObject<T> {
    private _value: T = undefined as T;
    private isSet: boolean = false;

    get value(): T {
        if (!this.isSet) {
            throw new Error('HangingObject value accessed before being set.');
        }
        return this._value;
    }

    set value(val: T) {
        this._value = val;
        this.isSet = true;
    }
}
