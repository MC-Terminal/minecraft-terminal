const { error, warn } = require('../lib/log');
const PACKAGE = require('../package.json');

function set (debug) {
	process.on('uncaughtException', (err) => {
		if (typeof err !== 'object') {
			error(`An unexpected error occurred.\n${err}`);
			return;
		}

		if (debug === false) {
			const stack = err.stack?.split('\n');
			let relevant = '';
			if (stack[1]) relevant = `\n${stack[1]}`;
			if (stack[2]) relevant = `${relevant}\n${stack[2]}`;
			err.message = err.message.split('\n')[0];
			error(`An unexpected error occurred.\n${err.message}${relevant}`);
			warn(`Please open a bug report on github: ${PACKAGE.bugs.url}`);
			process.exit(1);
		} else {
			process.stdout.write(err.stack);
		}
	});
}

module.exports = set;
