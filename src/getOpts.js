const PACKAGE = require('../package.json');
const getopt = require('../lib/getopts');
const configPathPath = require('../lib/configPath').path;

function set (settings) {
	getopt(['--help', '-h'], 0, () => {
		process.stdout.write(
			`Usage: ${PACKAGE.name} [OPTIONS] \n` +
			'  --no-conf, -ns           Do not use the configuration file.\n' +
			'  --no-cred, -nc           Do not use the credentials file.\n' +
			'  --no-plugins, -np        Do not load plugins specified in plugins file.\n' +
			'  --set-conf-path, -scp    Set the config folder path\n' +
			'  --get-conf-path, -gcp    Get the config folder path\n' +
			'  --cred, -c               <Auth> <Username> <Password> <Version> <Server>\n' +
			'                           Override credentials from CLI arguments.\n' +
			'  --debug                  Enable debug mode.\n' +
			'  --version, -v            Show version information.\n' +
			'  --help, -h               Show this help message.\n'
		);
		process.exit();
	});

	getopt(['--version', '-v'], 0, () => {
		process.stdout.write(`${PACKAGE.name} version: ${PACKAGE.version}\nNode version: ${process.version}\n`);
		process.exit();
	});

	getopt(['--debug'], 0, () => {
		settings.logging.debug = true;
	});

	getopt(['--set-conf-path', '-scp'], 2, (params) => {
		const { editObj } = require('../lib/editfile');
		const { resolve } = require('path');
		const { writeFileSync } = require('fs');
		const requireTOML = require('../lib/requireTOML');
		const TOML = require('@iarna/toml');

		const configPathPathc = configPathPath();

		let dir = params[1] || '';
		dir = resolve(dir);
		const data = editObj(requireTOML(configPathPathc), (data) => {
			data.path = dir;
			return data;
		});
		writeFileSync(configPathPathc, TOML.stringify(data).replace(/ {2}/g, '\t'), 'utf-8');
		process.exit();
	});

	getopt(['--get-conf-path', '-gcp'], 0, () => {
		const requireTOML = require('../lib/requireTOML');
		process.stdout.write(`Path to config: '${requireTOML(configPathPath()).path}'\n`);
		process.exit();
	});

	// Do not use the ./config/credentials.toml file for credentials
	getopt(['--no-cred', '-nc'], 0, () => {
		settings.config.enabled.cred = false;
	});

	// Do not use the ./config/config.toml file for configuration
	getopt(['--no-conf', '-ns'], 0, () => {
		settings.config.enabled.config = false;
	});

	// Do not use the ./config/plugin.toml file for configuration
	getopt(['--no-plugins', '-np'], 0, () => {
		settings.config.enabled.plugins = false;
	});

	// Get credentials from CLI arguments
	getopt(['--cred', '-c'], 6, (params) => {
		const credList = [
			'auth',
			'username',
			'password',
			'server',
			'version'
		];
		for (let i = 1; i < params.length; i++) {
			const cred = credList[i - 1];
			if (params[i] !== '!') {
				if (params[i] !== undefined && params[i] !== '') {
					settings.bot.cred[cred] = params[i];
				}
			} else settings.bot.cred[cred] = null;
		}
	});
}

module.exports = set;
