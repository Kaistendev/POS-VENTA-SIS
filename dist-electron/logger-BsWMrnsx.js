import pino from "pino";
//#region src/shared/logger.ts
var logger = pino({
	level: "info",
	timestamp: pino.stdTimeFunctions.isoTime
});
//#endregion
export { logger as t };
