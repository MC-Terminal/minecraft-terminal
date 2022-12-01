const mineflayer = require('mineflayer');
const { EventEmitter } = require('events');

const serverVersion = '1.8.9';
const serverPort = 12345;
const serverHost = '0.0.0.0';
const username = 'testBot_1234';

let ended = false;
async function waitForBotToEnd (bot) {
	if (!bot || ended === true) {
		return;
	}
	ended = true;
	return await new Promise((resolve) => bot.once('end', resolve));
}

let spawned = false;
async function waitForBotToSpawn (bot) {
	if (!bot || spawned === true) {
		return;
	}
	spawned = true;
	return await new Promise((resolve) => bot.once('spawn', resolve));
};

let bot = new EventEmitter();

async function beforeEverything () {
	bot = mineflayer.createBot({
		host: serverHost,
		port: serverPort,
		username,
		version: serverVersion
	});

	const connectErr = () => {
		console.log('Could not connect to server');
		process.exit(1);
	};

	bot.once('error', connectErr);

	await waitForBotToSpawn(bot);

	bot.off('error', connectErr);
	return bot;
};

module.exports = {
	waitForBotToEnd,
	waitForBotToSpawn,
	beforeEverything
};
