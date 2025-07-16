import * as vscode from 'vscode';
//import { getLogger } from './loggerProvider';

export class CallbackProvider<K extends string = 'default', A = void, R = void> {
    callbacks = {} as Record<K, Map<symbol, (arg: A) => R>>;
    volatileCallbacks = new Set<symbol>();

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

    unregisterCallback(key: K, symbol: symbol): void {
        if (this.callbacks[key]) {
            this.callbacks[key].delete(symbol);
        }
    }
}

type activationCallbackType = 'pre-activation' | 'post-activation';
export const globalCallbacks = {
    activation: new CallbackProvider<activationCallbackType, vscode.ExtensionContext>(),
};
