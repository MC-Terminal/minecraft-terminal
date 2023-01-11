const mineflayerMaps = require('mineflayer-maps');
const ansi = require('easy-ansi');

let mcterm;

const load = (A) => {
	mcterm = A;
	mcterm.bot.loadPlugin(mineflayerMaps);
	mcterm.bot.maps.outputDir = './maps';
};

const main = async () => {
	mcterm.info('Added \'.mapSave\' and \'.mapPreview\' commands');
	mcterm.commands.mapSave = (state) => {
		if (typeof state !== 'boolean') {
			mcterm.info('Usage: .mapSave <State: true|false>');
			return;
		}
		mcterm.bot.maps.setSaveToFile(state);
		mcterm.success('Updated');
	};
	mcterm.commands.mapPreview = (state) => {
		if (typeof state !== 'boolean') {
			mcterm.info('Usage: .mapPreview <State: true|false>');
			return;
		}
		if (state === true) {
			if (mcterm.bot.listeners.includes(onMapPreview)) {
				mcterm.bot._client.on('map', onMapPreview);
			}
		} else {
			mcterm.bot._client.off('map', onMapPreview);
		}
		mcterm.success('Updated');
	};

	const onMap = (map) => {
		mcterm.success(`Saved map at:\n${map.fullPath}`);
	};

	mcterm.bot.on('new_map_saved', onMap);

	const onMapPreview = ({ map }) => {
		try {
			const termSize = ansi.cursor.termSize();
			const div = Math.floor(128 / (Math.min(termSize[0], termSize[1] / 2) * 2));
			mcterm.success('Map preview:');
			mcterm.safeWrite(mineflayerMaps.parseASCII(map, false, div));
		} catch {
			mcterm.error('An error occurred while trying to preview map');
		}
	};
	mcterm.bot.on('new_map', onMapPreview);
};

module.exports = { load, main, name: 'Map Downloader' };
