export default class ScriptComposer {
    protected readonly separator = '-----------------' as const;

    protected callbacks: (() => void)[] = [];
    protected name: string;

    constructor({ callbacks, name }: { callbacks: (() => void)[], name?: string }) {
        this.callbacks = callbacks;
        this.name = name || 'Unnamed Script Composer';
    }

    public run() {
        console.log(this.separator);
        console.log(`Running ${this.name}...`);
        for (const callback of this.callbacks) {
            console.log(`${this.name}: Executing ${callback.name}...`);
            try {
                callback();
            } catch (error) {
                console.error(`${this.name}: Error executing ${callback.name}`);
                throw error;
            }
            console.log(this.separator);
        }
    }
}

