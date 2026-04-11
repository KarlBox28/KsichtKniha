import {Logger} from "./logger.mjs"

export default async function loggingMiddleware(req, res, next) {
    const logger = new Logger("");

    logger.log("RequestData: " + req.url + " " + req.method + " " + JSON.stringify(req.body) + "\n");

    const oldSend = res.send;
    const oldJson = res.json;
    const oldEnd = res.end;

    let body;

    res.send = function (data) {
        body = data;
        return oldSend.call(this, data);
    };

    res.json = function (data) {
        body = data;
        return oldJson.call(this, data);
    };

    res.end = function (data) {
        if (data) body = data;
        return oldEnd.call(this, data);
    };

    res.on("finish", () => {
        logger.log(`RESPONSE: ${res.statusCode} ${body}`);
    });

    try {
        await next();
    } catch (error) {
        logger.log(error.message);
    }
}