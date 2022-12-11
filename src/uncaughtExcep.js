const { error, warn } = require('../lib/log');
const PACKAGE = require('../package.json');

function set (debug) {
	let onUncaughtException;
	if (debug === false) {
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
		process.stdout.write(err.stack);
	};

	process.on('uncaughtException', onUncaughtException);
}

module.exports = set;
