import * as vscode from 'vscode';
//import { getLogger } from './loggerProvider';

export class CallbackProvider<K extends string = 'default', A = void, R = void> {
    private callbacks = {} as Record<K, Map<symbol, (arg: A) => R>>;
    private volatileCallbacks = new Set<symbol>();

    getCallbacks(key: K): ReadonlyMap<symbol, (arg: A) => R> | undefined {
        return this.callbacks[key];
    }
    getCallback(key: K, symbol: symbol): ((arg: A) => R) | undefined {
        return this.callbacks[key]?.get(symbol);
    }

    registerCallback(
        key: K,
        callback: (arg: A) => R,
        symbol?: symbol,
        unregisterAfter?: boolean
    ): symbol {
        if (!this.callbacks[key]) {
            this.callbacks[key] = new Map();
        }
        const id = symbol || Symbol();
        this.callbacks[key].set(id, callback);
        if (unregisterAfter) {
            this.volatileCallbacks.add(id);
        }
        return id;
    }
    registerCallbacksFromArray(
        key: K,
        callbacks: Array<(arg: A) => R>,
        unregisterAfter?: boolean
    ): symbol[] {
        const symbols: symbol[] = [];
        for (const callback of callbacks) {
            symbols.push(this.registerCallback(key, callback, undefined, unregisterAfter));
        }
        return symbols;
    }

    unregisterCallback(key: K, symbol: symbol): void {
        if (this.callbacks[key]) {
            this.callbacks[key].delete(symbol);
        }
        this.volatileCallbacks.delete(symbol);
    }
    unregisterCallbacksForKey(key: K): void {
        if (this.callbacks[key]) {
            for (const symbol of this.callbacks[key].keys()) {
                this.volatileCallbacks.delete(symbol);
            }
            this.callbacks[key].clear();
        }
    }
    unregisterAllCallbacks(): void {
        for (const key in this.callbacks) {
            this.callbacks[key].clear();
        }
        this.volatileCallbacks.clear();
    }

    runCallbacks(key: K, arg: A): R[] {
        const results: R[] = [];
        if (this.callbacks[key]) {
            for (const [symbol, callback] of this.callbacks[key].entries()) {
                try {
                    results.push(callback(arg));

                    if (this.volatileCallbacks.has(symbol)) {
                        this.unregisterCallback(key, symbol);
                        this.volatileCallbacks.delete(symbol);
                    }
                } catch {
                    //getLogger().error(error, `Error executing callback for key ${key}:`);
                }
            }
        }
        return results;
    }
}

export class PromiseCallbackProvider<K extends string = 'default', V = void> {
    private promises: Partial<Record<K, Promise<V>>> = {};
    private resolvers: Partial<Record<K, (value: V) => void>> = {};
    private resolvedValues = new Map<K, V>();

    register(key: K): Promise<V> {
        // Already resolved → return value immediately
        if (this.resolvedValues.has(key)) {
            return Promise.resolve(this.resolvedValues.get(key)!);
        }

        // Create promise if it doesn't exist
        if (!this.promises[key]) {
            this.promises[key] = new Promise<V>((resolve) => {
                this.resolvers[key] = resolve;
            });
        }

        return this.promises[key]!;
    }

    run(key: K, value: V): void {
        // Idempotent: ignore repeated calls
        if (this.resolvedValues.has(key)) {
            return;
        }

        this.resolvedValues.set(key, value);
        this.resolvers[key]?.(value);

        delete this.resolvers[key];
        delete this.promises[key];
    }
}

type activationCallbackType = 'pre-activation' | 'post-activation';
export const globalCallbacks = {
    activation: new CallbackProvider<activationCallbackType, vscode.ExtensionContext>(),
};
