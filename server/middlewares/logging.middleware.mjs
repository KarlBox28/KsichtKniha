import {Logger} from "./logger.mjs"

export default async function loggingMiddleware(req, res, next) {
    const logger = new Logger("Request data");

    logger.log(req.url + " " + req.method + " " + JSON.stringify(req.body));

    try {
        await next();
    } catch (error) {
        logger.log(error.message);
    }
}