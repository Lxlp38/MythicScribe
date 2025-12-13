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

type Entry<V> = {
    promise?: Promise<V>;
    resolve?: (v: V) => void;
    reject?: (e: unknown) => void;
    settled?: true;
    rejected?: true;
    value?: V;
    error?: unknown;
};

/**
 * A generic promise callback provider that manages deferred promise resolution.
 *
 * This class allows you to register promises by key and resolve or reject them
 * at a later time from external code. It's useful for decoupling promise creation
 * from promise settlement.
 *
 * @template K - The type of keys used to identify registered promises. Defaults to 'default'.
 * @template V - The type of value that the promises resolve to. Defaults to void.
 *
 * @example
 * ```typescript
 * const provider = new PromiseCallbackProvider<'request1' | 'request2', string>();
 *
 * // Register a promise
 * const promise = provider.register('request1');
 *
 * // Resolve it later
 * provider.run('request1', 'success!');
 *
 * // The promise resolves with 'success!'
 * ```
 */
export class PromiseCallbackProvider<K extends string = 'default', V = void> {
    private registry = new Map<K, Entry<V>>();

    register(key: K): Promise<V> {
        //console.log('PromiseCallbackProvider: Registering promise for key', key);
        const entry = this.registry.get(key) ?? {};
        this.registry.set(key, entry);

        if (entry.settled) {
            return entry.rejected ? Promise.reject(entry.error) : Promise.resolve(entry.value as V);
        }

        if (!entry.promise) {
            entry.promise = new Promise<V>((resolve, reject) => {
                entry.resolve = resolve;
                entry.reject = reject;
            });
        }

        return entry.promise;
    }

    run(key: K, value: V): void {
        // console.log(
        //     'PromiseCallbackProvider: Resolving promise for key',
        //     key,
        //     'with value',
        //     String(value)
        // );
        const entry = this.registry.get(key) ?? {};
        if (entry.settled) {
            return;
        }

        entry.settled = true;
        entry.value = value;
        entry.resolve?.(value);
        this.registry.set(key, entry);
    }

    reject(key: K, error: unknown): void {
        // console.log(
        //     'PromiseCallbackProvider: Rejecting promise for key',
        //     key,
        //     'with error',
        //     String(error)
        // );
        const entry = this.registry.get(key) ?? {};
        if (entry.settled) {
            return;
        }

        entry.settled = true;
        entry.rejected = true;
        entry.error = error;
        entry.reject?.(error);
        this.registry.set(key, entry);
    }

    clear(key?: K): void {
        // console.log('PromiseCallbackProvider: Clearing entries for key', key ?? 'all keys');
        if (key) {
            this.registry.delete(key);
        } else {
            this.registry.clear();
        }
    }
}

type activationCallbackType = 'pre-activation' | 'post-activation';
export const globalCallbacks = {
    activation: new CallbackProvider<activationCallbackType, vscode.ExtensionContext>(),
};
