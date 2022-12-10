#!/usr/bin/env node

// Set global settings
const settings = new (require('./settings'))();

// Check if the 'configPath.toml' file exists if not create it
require('./configPath');

// Parse cmd args
require('./getOpts')(settings);

const logger = require('../lib/log');

// Loading
logger.info('Loading...', 3);

// Generate and update config
require('./updateConfig');

// Load config
settings.config.config = require('./loadConfig')(settings);

// Override credentials
require('./overrideCred')(settings);

// Import and cache modules
const { EventEmitter } = require('node:events');
EventEmitter.defaultMaxListeners = 0;
const botMain = require('./botMain');
const readline = require('readline');
const commands = require('../lib/commands');
const path = require('path');

// Set uncaught exception message
require('./uncaughtExcep')(settings.logging.debug);

// Setup chat and input
const chat = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
chat.setPrompt('');
chat.once('close', async () => {
	process.stdout.write('\n');
	process.exit();
});

require('./initChat')(chat);

(
	async () => {
		// Prompt for credentials and modify them
		await require('./promptCred')(settings, chat);

		// set the port
		const port = settings.bot.cred.server.match(/(?<=:)\d+/)?.[0];
		if (port) {
			settings.bot.cred.server = settings.bot.cred.server.match(/^[^:]+/)?.[0];
			settings.bot.cred.port = port;
		}

		// Start the bot
		let bot;
		botMain.setup(bot, chat, settings);
		botMain();
		commands.commands.tasks(path.join(require('../lib/configPath')().path, 'tasks.toml'));
	}
)();
