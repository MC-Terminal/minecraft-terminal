const mineflayerViewer = require('prismarine-viewer').mineflayer;
const logger = require('../lib/log');
const ansi = require('easy-ansi');

const load = (A) => {
	const webViewSettings = A.settings.settings.config.config.plugins.settings.webView;
	A.bot.once('spawn', () => {
		mineflayerViewer(
			A.bot, {
				port: webViewSettings.port,
				version: A.bot.version,
				firstPerson: webViewSettings.firstPerson
			}
		); // Start the viewing server on port 3000
		logger.info(`Web viewer running on port ${ansi.color.rgb(10, 100, 250) + ansi.color.italic}https://localhost:${webViewSettings.port + ansi.color.reset}%COLOR%`);

		// Draw the path followed by the bot
		if (webViewSettings.showTrail === true) {
			const path = [A.bot.entity.position.clone()];
			A.bot.on('move', () => {
				if (path[path.length - 1].distanceTo(A.bot.entity.position) > 1) {
					path.push(A.bot.entity.position.clone());
					A.bot.viewer.drawLine('path', path);
				}
			});
		}
	});
};

module.exports = { load, name: 'Web View' };
