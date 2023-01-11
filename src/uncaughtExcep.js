const { error, warn } = require('../lib/log');
const ansi = require('easy-ansi');
const PACKAGE = require('../package.json');

function set (debug) {
	let onUncaughtException;
	process.on('uncaughtException', (err) => {
		onUncaughtException(err);
	});

	if (debug !== true) {
		onUncaughtException = (err) => {
			const stack = err.stack?.split('\n');
			let relevant = '';
			if (stack[1]) relevant = '\n' + stack[1];
			if (stack[2]) relevant += '\n' + stack[2];
			err.message = err.message.split('\n')[0];
			error(`An unexpected error occurred.\n${err.message}${relevant}`);
			warn(`Please open a bug report on github: ${PACKAGE.bugs.url}`);
			process.exit(1);
		};
		return;
	}
	onUncaughtException = (err) => {
		process.stderr.write(ansi.color.rgb(255, 80, 120) + err.stack + ansi.color.reset);
	};
}

module.exports = set;
