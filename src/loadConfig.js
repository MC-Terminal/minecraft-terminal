const { error, warn, info, highLight1 } = require('../lib/log');
const requireTOML = require('../lib/requireTOML');
const { join } = require('path');
const configPath = require('../lib/configPath')().path;

const readErr = (file, errorMsg) => {
	if (errorMsg) {
		error(`An error occurred while trying to read ${file}.\n${errorMsg}`);
	} else {
		error(`An error occurred while trying to read ${file}`);
	}
	process.exit(1);
};

function load (settings) {
	const config = {};
	if (settings.config.enabled.plugins === true) {
		try {
			config.plugins = requireTOML(join(configPath, 'plugins.toml'));
		} catch (e) {
			readErr('plugins.toml', e.message);
		}
	} else {
		warn('Not using plugins');
	}

	if (settings.config.enabled.config === true) {
		try {
			config.config = requireTOML(join(configPath, 'config.toml'));
		} catch (e) {
			readErr('config.toml', e.message);
		}
	} else {
		warn('Using default config');
	}

	let physics;
	try {
		physics = requireTOML(`${configPath}/physics.toml`);
		if (physics.usePhysicsConfig === true) {
			warn(`Using custom physics. this will result in a ${highLight1('ban')}%COLOR% in most servers!`);
			info('You can disable it by editing usePhysicsConfig in physics.toml');
			settings.config.enabled.physics = true;
			delete physics.usePhysicsConfig;
			config.physics = physics;
		}
	} catch (e) {
		readErr('physics.toml', e.message);
	}

	if (settings.config.enabled.cred === true) {
		try {
			config.cred = {
				...{
					auth: undefined,
					username: undefined,
					password: undefined,
					server: undefined,
					version: undefined
				},
				...requireTOML(join(configPath, 'credentials.toml'))
			};
		} catch (e) {
			readErr('credentials.toml', e.message);
		}
	}

	return config;
}

module.exports = load;
