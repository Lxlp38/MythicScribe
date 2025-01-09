import { AbstractScribeHandler } from '../handlers/AbstractScribeHandler';

export class ScribeMechanicHandler extends AbstractScribeHandler {
    static createInstance(): AbstractScribeHandler {
        return new ScribeMechanicHandler();
    }
    protected constructor() {
        super();
    }
}
