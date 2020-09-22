/**
 * ログのコントロールを容易にするlogger
 *
 * cloud watchではログをデフォルトでは色付けできないので、下記chrome拡張を導入するとよい
 * https://github.com/ilhan-mstf/colorize_cloudwatch_logs
 */

import * as log4js from 'log4js';

const logger = log4js.getLogger();
logger.level = 'all';

export default logger;
