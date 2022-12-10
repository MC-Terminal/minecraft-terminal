const mainPath = require('../lib/mainPath')();
const logger = require('../lib/log');
const { join } = require('path');
const { existsSync } = require('fs');

const configPathPath = require('../lib/configPath').path();

if (!existsSync(configPathPath)) {
	const { writeFileSync } = require('fs');
	const { stringify: TOMLStringify } = require('@iarna/toml');
	let dir;
	if (process.platform === 'win32') dir = join(mainPath, 'config');
	else dir = join(require('os').homedir(), '.config', 'mc-term');
	if (!existsSync(dir)) {
		const { mkdirSync } = require('fs');
		mkdirSync(dir, { recursive: true });
	}
	const defaultPath = dir;
	writeFileSync(configPathPath, TOMLStringify({ path: defaultPath }), (err) => {
		if (err) logger.error(err);
	});
}
