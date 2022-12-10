function init (chat) {
	const logger = require('../lib/log');
	const { MCColor: { c2c } } = require('../lib/ansi');
	const { events } = require('../lib/commands');
	const { setInterface: promptSetInterface } = require('../lib/prompt');
	const { setSWInterface } = require('../lib/log');

	promptSetInterface(chat);
	setSWInterface(chat);

	events.on('msg', (msg, end) => {
		logger.safeWrite(c2c(msg), end);
	});
	events.on('msg_info', (msg, end) => {
		logger.info(c2c(msg), end);
	});
	events.on('msg_warn', (msg, end) => {
		logger.warn(c2c(msg), end);
	});
	events.on('msg_error', (msg, end) => {
		logger.error(c2c(msg), end);
	});
	events.on('msg_success', (msg, end) => {
		logger.success(c2c(msg), end);
	});
}

module.exports = init;
