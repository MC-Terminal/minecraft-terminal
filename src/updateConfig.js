const betterMerge = require('../lib/mergeObj');
const { readdirSync } = require('fs');
const TOML = require('@iarna/toml');
const logger = require('../lib/log');
const { join } = require('path');
const mainPath = require('../lib/mainPath');
const configPath = require('../lib/configPath')().path;

const MP = mainPath();

const onlyKeepKeys = require('../lib/onlyKeepKeys');

readdirSync(join(MP, 'default_config')).forEach(file => {
	const { writeFileSync, readFileSync } = require('fs');
	const filePath = join(configPath, file);
	const defaultconfigPath = join(MP, 'default_config', file);
	try {
		require.resolve(filePath);
	} catch {
		try {
			const { cpSync } = require('fs');
			cpSync(defaultconfigPath, filePath);
		} catch (e) {
			logger.error(`An error occurred trying to update configuration files.\n${e}`);
			process.exit(1);
		}
		return;
	}
	let out;
	try {
		const config = readFileSync(filePath, 'UTF8');
		const defaultConfig = readFileSync(defaultconfigPath, 'UTF8');
		const parsedDefaultConfig = TOML.parse(defaultConfig);
		const modifiedRmParsedDefaultConfig = Object.assign({}, parsedDefaultConfig);
		let parsedConfig = TOML.parse(config);

		// Please find a better way of doing this
		if (file === 'plugins.toml') {
			betterMerge(modifiedRmParsedDefaultConfig, { settings: parsedConfig.settings }, { mutate: true });
		}
		if (file === 'config.toml') {
			betterMerge(modifiedRmParsedDefaultConfig, { commands: { commandAliases: parsedConfig.commands.commandAliases } }, { mutate: true });
		}
		if (file !== 'tasks.toml') {
			parsedConfig = onlyKeepKeys(parsedConfig, modifiedRmParsedDefaultConfig);
		}

		//
		const modifiedAddParsedDefaultConfig = Object.assign({}, parsedDefaultConfig);
		if (file === 'config.toml') {
			delete modifiedAddParsedDefaultConfig.commands.commandAliases;
		}
		out = betterMerge(modifiedAddParsedDefaultConfig, parsedConfig);
	} catch {
		return;
	}

	let TOMLString;
	try {
		TOMLString = TOML.stringify(out).replace(/ {2}/g, '\t');
	} catch (e) {
		logger.error(`An error occurred while trying to parse ${file}.\n${e.message}`);
		process.exit(1);
	}

	try {
		writeFileSync(filePath, TOMLString, 'utf-8');
	} catch (e) {
		logger.error(`An error occurred while trying to update ${file}.\n${e.message}`);
	}
});
