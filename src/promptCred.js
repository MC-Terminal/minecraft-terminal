const { warn } = require('../lib/log');
const prompt = require('../lib/prompt');

module.exports = async (settings, chat) => {
	// Set prompt interface
	prompt.setInterface(chat);

	// Check if auth is defined or null
	if (!settings.bot.cred.auth && settings.bot.cred.auth !== null) {
		settings.bot.cred.auth = await prompt('Auth :');
		if (settings.bot.cred.auth?.toLowerCase() === 'mojang') {
			warn('Mojang auth servers no longer accept mojang accounts to login.\nThat means you can no longer use mojang accounts', 2);
			process.exit(1);
		}
	}

	// Check if username is defined or null
	if (!settings.bot.cred.username && settings.bot.cred.username !== null) {
		settings.bot.cred.username = await prompt('Login :');
		if (settings.bot.cred.auth?.toLowerCase() === 'microsoft' && !settings.bot.cred.username) {
			warn('When using a Microsoft auth you must specify a password and username', 2);
			process.exit(1);
		}
	}

	// Check if password is defined or null
	if (settings.bot.cred.auth?.toLowerCase() === 'microsoft' && !settings.bot.cred.password && settings.bot.cred.password !== null) {
		settings.bot.cred.password = await prompt('Password :');
		if (!settings.bot.cred.password) {
			warn('When using a Microsoft auth you must specify a password and username', 2);
			process.exit(1);
		}
	}

	// Check if server is defined or null
	if (!settings.bot.cred.server && settings.bot.cred.server !== null) {
		settings.bot.cred.server = await prompt('Server :');
	}

	// Check if version is defined or null
	if (!settings.bot.cred.version && settings.bot.cred.version !== null) {
		settings.bot.cred.version = await prompt('Version :');
	}

	// Set default values for username, password, server, and version
	settings.bot.cred.username = settings.bot.cred.username || 'Player123';
	settings.bot.cred.password = settings.bot.cred.password || '';
	settings.bot.cred.server = settings.bot.cred.server || 'localhost';
	settings.bot.cred.version = settings.bot.cred.version || '1.12.2';

	// Set default value for port
	settings.bot.cred.port = settings.bot.cred.port || '25565';
};
