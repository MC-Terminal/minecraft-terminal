#!/usr/bin/env node

const { error } = require('./lib/mccinfo');
const pkg = require('./package.json');

const getopt = require('./lib/getopts');

let DEBUG = false;
getopt(['--debug'], 0, () => {
	DEBUG = true;
});

let onUncaughtException;

if (DEBUG === false) {
	onUncaughtException = (err) => {
		if (typeof err !== 'object') {
			error(`An unexpected error occured.\n${err}`);
			return;
		}
		const stack = err.stack?.split('\n');
		let relevant = '';
		if (stack[0]) relevant = `${stack[0]}\n`;
		if (stack[1]) relevant = `${stack[1]}`;
		error(`An unexpected error occured.\n${err.message}\n${relevant}`);
		warn(`Please open a bug report on github: ${pkg.bugs.url}`);
		process.exit(1);
	};
} else {
	onUncaughtException = (err) => {
		process.stdout.write(err.stack);
	};
}

process.on('uncaughtException', onUncaughtException);

// Get help
getopt(['--help', '-h'], 0, () => {
	process.stdout.write(`Usage:
   --no-conf, -nc           Do not use the configuration file.
   --no-cred, -ns           Do not use the credentials file.
   --no-plugins, -np        Do not load plugins specified in plugins file.
   --set-conf-path, -scp    Set the config folder path
   --get-conf-path, -gcp    Get the config folder path
   --gen-conf, -gc          Generate configuration files
   --cred, -c               <Auth> <Username> <Password> <Version> <Server>
   --debug                  Enable debug mode
                            Override credentials from CLI arguments.
   --help, -h               Show this help message.
   --version, -v            Show version information.\n`);
	process.exit();
});

// Get version
getopt(['--version', '-v'], 0, () => {
	process.stdout.write(`MC-Term version: ${pkg.version}\nNode version: ${process.version}\n`);
	process.exit();
});

const { join } = require('path');

getopt(['--gen-conf', '-gc'], 2, (params) => {
	const { cpSync } = require('fs');
	let dir = params[1] || '';
	if (!dir.match(/^[/~]/m)) {
		dir = join(process.cwd(), dir);
	}
	cpSync(join(__dirname, 'config'), dir, { recursive: true });
	process.exit();
});

let dir;
if (process.platform === 'win32') dir = __dirname;
else dir = join(require('os').homedir(), '.config', 'mc-term');
const configPathPath = join(dir, '.configpath.json');
try {
	require.resolve(configPathPath);
} catch (error) {
	const { writeFileSync } = require('fs');
	if (!require('fs').existsSync(dir)) {
		const { mkdirSync } = require('fs');
		mkdirSync(dir, { recursive: true });
	}
	let defaultPath;
	if (process.platform !== 'win32') defaultPath = dir;
	else defaultPath = 'NOT_SET_YET';
	writeFileSync(configPathPath, JSON.stringify({ configpath: defaultPath }), (err) => {
		if (err) error(err);
	});
}

const configpath = require(configPathPath).configpath;

getopt(['--set-conf-path', '-scp'], 2, (params) => {
	const { editJSON } = require('./lib/editfile');
	let dir = params[1] || '';
	if (!dir.match(/^[/~]/m)) {
		dir = join(process.cwd(), dir);
	}
	editJSON(configPathPath, configPathPath, (data) => {
		data.configpath = dir;
		return data;
	});
	process.exit();
});

getopt(['--get-conf-path', '-gcp'], 0, () => {
	process.stdout.write(`Path to config: '${configpath}'\n`);
	process.exit();
});

const readline = require('readline');
const chat = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const { safeWrite, setSWInterface, info, warn, success } = require('./lib/mccinfo');

/**
 * 0.auth
 * 1.username
 * 2.password
 * 3.server
 * 4.version
 * 5.port
 * 6.nocred
 * 7.noconf
 * 8.accept
*/
let cred = [];

// Do not use the ./config/credentials.json file for credentials
let bcofnc;
getopt(['--no-cred', '-nc'], 1, (params) => {
	cred[6] = true;
	bcofnc = params[0];
});

// Do not use the ./config/conf.json file for configuration
let bcofns;
getopt(['--no-conf', '-ns'], 1, (params) => {
	cred[7] = true;
	bcofns = params[0];
});

// Do not use the ./config/conf.json file for configuration
let bcofnp;
getopt(['--no-plugins', '-np'], 1, (params) => {
	cred[8] = true;
	bcofnp = params[0];
});

const progress = require('./lib/progress');
progress(0, 15, 'Loading: ');

let YESPLUG = false;
if (cred[8] !== true) {
	try {
		if (require.resolve(join(configpath, 'plugins.json'))) YESPLUG = true;
	} catch (e) {
		process.stdout.write('\r');
		warn('File "plugins.json" not found. Using default settings');
		progress(0, 15, 'Loading: ');
	}
} else {
	process.stdout.write('\r');
	warn(`Not using plugins because of '${bcofnp}'`);
	progress(0, 15, 'Loading: ');
}

let YESCONF = false;
if (cred[7] !== true) {
	try {
		if (require.resolve(join(configpath, 'config.json'))) YESCONF = true;
	} catch (e) {
		process.stdout.write('\r');
		warn('File "config.json" not found. Using default settings');
		progress(0, 15, 'Loading: ');
	}
} else {
	process.stdout.write('\r');
	warn(`Not using "config.json" because of '${bcofns}'`);
	progress(0, 15, 'Loading: ');
}

if (cred[6] !== true) {
	try {
		if (require.resolve(`${configpath}/credentials.json`)) {
			cred = Object.values(Object.assign({
				auth: undefined,
				username: undefined,
				password: undefined,
				server: undefined,
				version: undefined
			}, require(`${configpath}/credentials.json`)));
		}
	} catch (e) {
		process.stdout.write('\r');
		warn('File "credentials.json" not found. Using default settings');
		progress(0, 15, 'Loading: ');
	}
} else {
	process.stdout.write('\r');
	warn(`Not using "credentials.json" because of '${bcofnc}'`);
	progress(0, 15, 'Loading: ');
}

// Get credentials from CLI arguments
getopt(['--cred', '-c'], 6, (params) => {
	for (let i = 1; i < params.length; i++) {
		if (params[i] !== '!' && params[i] !== undefined) {
			cred[i - 1] = params[i];
		} else if (cred[i - 1] === '' || cred[i - 1] === undefined) cred[i - 1] = null;
	}
});

require('events').EventEmitter.defaultMaxListeners = 0;

let YESPS;
let physics;
try {
	if (require.resolve(`${configpath}/physics.json`)) {
		physics = require(`${configpath}/physics.json`);
		if (physics.usePhysicsJSON === true) {
			process.stdout.write('\r');
			warn('Using custom physics. this will result in a ban in most servers!');
			info('You can disable it by editing usePhysicsJSON in physics.json');
			progress(0, 15, 'Loading: ');
			YESPS = true;
		}
	}
} catch (e) {
	process.stdout.write('\r');
	warn('File "physics.json" not found. Using default settings');
	progress(0, 15, 'Loading: ');
}

let bot;

const ansi = require('./lib/ansi');
const merge = require('merge');
progress(20, 15, '\rLoading: ');

const { pathfinder, Movements } = require('mineflayer-pathfinder');
progress(50, 15, '\rLoading: ');

const mineflayer = require('mineflayer');
progress(90, 15, '\rLoading: ');

const { commands, setBot, setbotMain, setChat, loadPlugins } = require('./lib/commands');
const { prompt, load: promptLoad } = require('./lib/prompt');
const sleep = require('./lib/sleep');

promptLoad(chat);
setSWInterface(chat);
setChat(chat);

(
	async () => {
		// Prompt if not defined or null
		if (cred[0] === '' || cred[0] === undefined) cred[0] = await prompt('Auth :');
		if (cred[0]?.toLowerCase() === 'mojang') {
			warn('Mojang auth servers no longer accept mojang accounts to login.\nThat means you can no longer use mojang accounts');
			chat.close();
			return;
		};
		if (cred[1] === '' || cred[1] === undefined) cred[1] = await prompt('Login :');
		if (cred[0] === 'microsoft' && (cred[1] === '' || cred[1] === null)) {
			warn('When using a Microsoft auth you must specify a password and username');
			chat.close();
			return;
		}
		if (cred[0]?.toLowerCase() === 'microsoft' && (cred[2] === '' || cred[2] === undefined)) cred[2] = await prompt('Password :');
		if (cred[0] === 'microsoft' && (cred[2] === '' || cred[2] === null)) {
			warn('When using a Microsoft auth you must specify a password and username');
			chat.close();
			return;
		}
		if (cred[3] === '' || cred[3] === undefined) cred[3] = await prompt('Server :');
		if (cred[4] === '' || cred[4] === undefined) cred[4] = await prompt('Version :');

		// Set defaults
		if (!cred[1]) cred[1] = 'Player123';
		if (!cred[2]) cred[2] = '';
		if (!cred[3]) cred[3] = 'localhost';
		if (!cred[4]) cred[4] = '1.12.2';
		if (!cred[5]) cred[5] = '25565';
		await sleep(3);
		if (chat.closed === true) {
			info('Exiting');
			return;
		}
		chat.line = '';
		botMain();
		process.once('exit', () => {
			ansi.other.setTermTitle('Terminal');
			info('Exiting', 2);
			ansi.clear.clearLine(true);
		});
	}
)();

async function botMain () {
	chat.once('close', async () => {
		bot.quit();
	});
	chat.setPrompt('>');
	const connectErr = (err) => {
		error('Could not connect to server.\n' + err.message);
		process.exit(1);
	};
	ansi.clear.clearLine(true);
	info('Connecting...', 1);

	// get port then create bot
	try {
		if (cred[3]?.match(/:/)) cred[5] = cred[3].match(/(?<=:)\d+/)[0];
		bot = mineflayer.createBot({
			auth: cred[0],
			username: cred[1],
			password: cred[2],
			host: cred[3],
			version: cred[4],
			port: cred[5],
			logErrors: false
		});
	} catch (err) {
		connectErr(err);
	}

	bot.once('error', connectErr);

	ansi.clear.clearLine(true);
	success('Connected.');

	// Initialize commands
	setBot(bot);
	setbotMain(botMain);

	commands.tmp.botMoving = false;
	commands.tmp.botLooking = false;
	commands.tmp.botAttacking = false;
	commands.tmp.lookInt = undefined;
	// script = { length: 0, msg: [] };

	// Chat input and check for updates
	bot.once('login', async () => {
		chat.line = '';
		updateChat();
		bot.off('error', connectErr);
		bot.loadPlugin(pathfinder);
		const mcData = require('minecraft-data')(bot.version);
		const movement = new Movements(bot, mcData);
		if (YESCONF) {
			const conf = require(`${configpath}/config.json`);
			if (YESPS === true) merge.recursive(movement, { bot: { physics } });
			merge.recursive(movement, conf);
		}
		bot.pathfinder.setMovements(movement);
		chat.on('line', (msg) => {
			commands.cmd(msg);
			updateChat();
		});
		chat.on('pause', () => {
			chat.prompt(true);
		});

		// Check for updates
		const getPackage = require('./lib/getPackage');
		getPackage(`${require('./package.json').name}`)
			.catch(() => {})
			.then(({ version }) => {
				const compareVer = require('./lib/compareVer');
				const diff = compareVer(version, pkg.version);
				if (diff > 0) {
					let importance = 'PATCH';
					if (diff === 1) importance = 'MAJOR';
					if (diff === 2) importance = 'MINOR';
					warn(`A new ${importance} version of '${pkg.name}' is out.\nUpdate with: npm up -g ${pkg.name}`);
				} else if (diff !== 0) {
					warn(`You somehow have a newer version of '${pkg.name}' than the latest one available.\nConsider running: npm up -g ${pkg.name}`);
				}
			});
	});

	bot.on('entityHurt', (entity) => {
		if (entity.username === bot.entity.username) {
			bot.stopDigging();
		}
	});

	// Detect chat messages and print them to console and RCON
	bot.on('message', (rawmsg) => {
		const message = rawmsg.toMotd();
		const messageColor = ansi.MCColor.c2c(message);
		safeWrite(messageColor);
		if (message.match(/!#/)) {
			const botSendSafe = message.match(/(?<=!#)[^!]+/)[0].replace(/§./, '');
			safeWrite(`${ansi.color.dim}[RCON] ${ansi.color.reset + botSendSafe}`);
			commands.cmd(botSendSafe);
		}
	});

	// send a message upon death
	bot.on('death', () => {
		info('You died. Respawning');
	});

	// exit program when disconnected
	bot.once('end', async (reason) => {
		if (reason !== 'reconnect') {
			process.exit();
		}
	});

	// send disconnect reason
	bot.on('kicked', (reason) => {
		info(`Kicked from ${cred[3]}:`);
		safeWrite(`${ansi.MCColor.c2c(JSON.parse(reason).text) + ansi.color.reset}`);
		process.stdout.write('\r');
	});

	// send a message when a window opens
	bot.on('windowOpen', () => {
		info('Container #1 opened\n[MCC] Use ".inventory 1" to interact with it');
	});

	// set terminal title
	bot.once('spawn', async () => {
		ansi.other.setTermTitle(`${bot.player?.username || cred[1]} @ ${cred[3]}`);
		if (YESPLUG === true) {
			loadPlugins(require(`${configpath}/plugins.json`));
		}
	});
}

function updateChat () {
	chat.pause();
	chat.resume();
}
