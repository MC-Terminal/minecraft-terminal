const { warn } = require('../lib/log');
const prompt = require('../lib/prompt');

module.exports = async (settings, chat) => {
	prompt.setInterface(chat);
	// Prompt if not defined or null
	if (settings.bot.cred.auth === '' || settings.bot.cred.auth === undefined) settings.bot.cred.auth = await prompt('Auth :');
	if (settings.bot.cred.auth?.toLowerCase?.() === 'mojang') {
		warn('Mojang auth servers no longer accept mojang accounts to login.\nThat means you can no longer use mojang accounts', 2);
		process.exit();
		return;
	}
	if (settings.bot.cred.username === '' || settings.bot.cred.username === undefined) settings.bot.cred.username = await prompt('Login :');
	if (settings.bot.cred.auth === 'microsoft' && (settings.bot.cred.username === '' || settings.bot.cred.username === null)) {
		warn('When using a Microsoft auth you must specify a password and username', 2);
		process.exit();
		return;
	}
	if (settings.bot.cred.auth?.toLowerCase?.() === 'microsoft' && (settings.bot.cred.password === '' || settings.bot.cred.password === undefined)) settings.bot.cred.password = await prompt('Password :');
	if (settings.bot.cred.auth === 'microsoft' && (settings.bot.cred.password === '' || settings.bot.cred.password === null)) {
		warn('When using a Microsoft auth you must specify a password and username', 2);
		process.exit();
		return;
	}
	if (settings.bot.cred.server === '' || settings.bot.cred.server === undefined) settings.bot.cred.server = await prompt('Server :');
	if (settings.bot.cred.version === '' || settings.bot.cred.version === undefined) settings.bot.cred.version = await prompt('Version :');

	// Set defaults
	if (!settings.bot.cred.username) settings.bot.cred.username = 'Player123';
	if (!settings.bot.cred.password) settings.bot.cred.password = '';
	if (!settings.bot.cred.server) settings.bot.cred.server = 'localhost';
	if (!settings.bot.cred.version) settings.bot.cred.version = '1.12.2';
	if (!settings.bot.cred.port) settings.bot.cred.port = '25565';
};
