const logger = require('../lib/log');
const ansi = require('../lib/ansi');
const parseVar = require('../lib/parseVar');
const mineflayer = require('mineflayer');
const PACKAGE = require('../package.json');
const commands = require('../lib/commands');
const getPlugins = require('./getPlugins');
const merge = require('merge');

let bot, chat, settings;

const checkForUpdates = () => {
	const getPackage = require('../lib/getPackage');
	getPackage(PACKAGE.name)
		.then(({ version }) => {
			const compareVer = require('../lib/compareVer');
			const diff = compareVer(version, PACKAGE.version);
			if (diff > 0) {
				const coloredVerSplit = version?.split('.') || [];
				coloredVerSplit[diff - 1] = logger.highLight1(coloredVerSplit[diff - 1]) + '%COLOR%';
				const coloredVerStr = coloredVerSplit.join('.');
				logger.warn(`A new version (${coloredVerStr}) of '${PACKAGE.name}' is out.\nUpdate with: npm up -g ${PACKAGE.name}`);
			} else if (diff !== 0) {
				logger.warn(`You somehow have a newer version of '${PACKAGE.name}' than the latest one available.\nConsider running: npm up -g ${PACKAGE.name}`);
			}
		})
		.catch(() => {});
};

const getCommandPrompt = (name, server) => {
	if (settings.config.config.config?.commands?.commandPrompt !== undefined) {
		return ansi.MCColor.c2c(parseVar(settings.config.config.config.commands.commandPrompt, { name, server }, '%', '%'), '&');
	} else {
		return '>';
	}
};

const connectErr = (err) => {
	logger.error('Could not connect to server.\n' + err.message, 2);
	process.exit(1);
};

function setup (BOT, CHAT, SETTINGS) {
	bot = BOT;
	chat = CHAT;
	settings = SETTINGS;
	commands.setConfig({ settings });
	commands.setbotMain(this);
}

const beforeLoginMsgs = [];
let loggedIn = false;

function onMessage (rawmsg) {
	const message = rawmsg.toMotd();
	const messageSendSafe = message.replace(/§/g, '');
	const messageColor = ansi.MCColor.c2c(message);

	logger.safeWrite(messageColor);

	const rconRegex = settings.config.config.config.RCON;
	if (rconRegex.enabled === false) {
		return;
	}
	const rcon = messageSendSafe.match(new RegExp(rconRegex.RegEx, rconRegex.RegExFlags))?.join(' ');
	if (rcon) {
		logger.info(`RCON: ${rcon}`);
		commands.commands.cmd(rcon);
	}
}

function setListeners () {
	// Detect chat messages and print them to console
	bot.on('message', (rawmsg) => {
		if (loggedIn === true) {
			onMessage(rawmsg);
			return;
		}
		beforeLoginMsgs[beforeLoginMsgs.length] = rawmsg;
	});

	// Send a message on death
	bot.on('death', () => {
		logger.warn('You died. Respawning');
	});

	// exit mc-term when disconnected
	bot.once('end', async (reason) => {
		if (reason !== 'reconnect') {
			logger.info('Exiting', 2);
			process.exit();
		}
	});

	// send disconnect reason
	bot.on('kicked', (reason) => {
		logger.warn(`Kicked from ${settings.bot.cred.server}:`, 2);
		process.stdout.write(`${ansi.MCColor.c2c(reason, undefined, true) + ansi.color.reset}\n`);
	});

	// set terminal title and movements
	bot.once('spawn', async () => {
		ansi.other.setTermTitle(`${bot.player?.username || settings.bot.cred.username} @ ${settings.bot.cred.server}`);
		const movements = merge.recursive(bot.pathfinder.movements, settings.config.config.config?.mineflayer.movements);
		if (settings.config.enabled.physics === true) {
			movements.bot.physics = merge.recursive(movements.bot.physics, settings.config.config.physics);
		}
		bot.pathfinder.setMovements(movements);
	});
}

function botMain () {
	chat.pause();
	ansi.clear.clearLine(true);
	logger.info('Loading...', 3);

	// Mineflayer bot creation options
	const options = {
		auth: settings.bot.cred.auth,
		username: settings.bot.cred.username,
		password: settings.bot.cred.password,
		host: settings.bot.cred.server,
		version: settings.bot.cred.version,
		port: settings.bot.cred.port,
		logErrors: false
	};
	commands.setConfig({ settings, options });

	// Load plugins (first pass)
	const plugins = getPlugins(settings);
	commands.loadPlugins(plugins, true);

	logger.info('Connecting...', 3);

	// Try to create bot and connect to server
	try {
		bot = mineflayer.createBot(options);
	} catch (err) {
		connectErr(err);
	}
	commands.setBot(bot);
	ansi.other.setMCVersion(bot.version);

	bot.once('error', connectErr);

	bot._client.once('connect', () => {
		bot.off('error', connectErr);
		// Set command prompt
		commands.commands.tmp.botMoving = false;
		commands.commands.tmp.botLooking = false;
		commands.commands.tmp.botAttacking = false;
		commands.commands.tmp.lookInt = undefined;
		// // script = { length: 0, msg: [] };

		// Load plugins (second pass)
		commands.loadPlugins(plugins, false);

		// Load bot plugins
		// bot.loadPlugin(pathfinder);

		logger.info('Logging in...', 3);
		chat.setPrompt(getCommandPrompt('Loading', settings.bot.cred.server));
		setListeners();
	});

	// Chat input and check for updates
	bot.once('login', async () => {
		logger.success('Logged in');
		loggedIn = true;
		chat.line = '';
		chat.resume();
		chat.prompt();
		chat.line = '';
		chat.setPrompt(getCommandPrompt(bot.username, settings.bot.cred.server));

		// Log chat messages sent before being logged in
		for (let i = 0; i < beforeLoginMsgs.length; i++) {
			onMessage(beforeLoginMsgs[i]);
		}

		// Get input
		chat.on('line', (msg) => {
			commands.commands.cmd(msg);
			chat.prompt();
		});

		// Check for updates
		checkForUpdates();
	});
}

module.exports = botMain;
module.exports.setup = setup;
