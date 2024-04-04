import { options } from "../options.js";

export class Log {
    enabled: boolean;

    constructor(enabled = true) {
        this.enabled = enabled;
    }

    debug(data: any) {
        if (options.debugMode) {
            console.log("DEBUG LOG: " + data);
        }
    }

    debugWarning(data: any) {
        if (options.debugMode) {
            console.warn("DEBUG LOG: " + data);
        }
    }

    debugError(data: any) {
        if (options.debugMode) {
            console.error("DEBUG LOG: " + data);
        }
    }
}

export const log = new Log();
