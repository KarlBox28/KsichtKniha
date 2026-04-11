export class Logger {
    prefix;
    constructor(logPrefix) {
        this.prefix = logPrefix;

    }

    log(message) {
        console.log(`${message}`);
    }
}