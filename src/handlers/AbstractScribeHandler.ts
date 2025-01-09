import * as vscode from 'vscode';

export abstract class AbstractScribeHandler {
    static context: vscode.ExtensionContext;
    private static instances: Map<string, AbstractScribeHandler> = new Map();

    static getInstance<T extends AbstractScribeHandler>(): T {
        let instance = this.instances.get(this.name);
        if (!instance) {
            instance = this.createInstance();
            this.instances.set(this.name, instance);
        }
        return instance as T;
    }

    protected static createInstance(): AbstractScribeHandler {
        throw new Error('Must be implemented by subclass');
    }

    protected constructor() {}
}
