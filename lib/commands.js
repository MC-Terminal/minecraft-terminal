const mcUtils = require('./mineflayer-utils');
const sleep = require('./sleep');
const distance = require('./distance');
const owo = require('@zuzak/owo');
const readline = require('readline');
const parseStr = require('./parsestr');
const parseCoords = require('./parseCoords');
const parseVar = require('./parseVar');
const tab = require('./tabulate');
const { pathfinder, goals: { GoalXZ, GoalFollow } } = require('mineflayer-pathfinder');
const v = require('vec3');
let pRegistry;
let ChatMessage;
const { basename } = require('path');
const PACKAGE = require('../package.json');
const requireTOML = require('./requireTOML');
const path = require('path');
const withPriority = require('./withPriority');
const utils = require('./utils');

const events = new (require('node:events').EventEmitter)();

function print (msg, end) {
	events.emit('msg', msg, end);
}

function info (msg, end) {
	events.emit('msg_info', msg, end);
}

function warn (msg, end) {
	events.emit('msg_warn', msg, end);
}

function error (msg, end) {
	events.emit('msg_error', msg, end);
}

function success (msg, end) {
	events.emit('msg_success', msg, end);
}

const playerIsMovingErr = 'Cannot use this command while player is moving.';

let settings = {};
const setConfig = (conf) => {
	settings = conf;
};

const botLookPriorityCache = {
	priority: 0,
	cooldown: 0
};

const reservedCommandNames = [
	'optcmd',
	'cmd',
	'tmp',
	'tasks'
];

const scriptOnlyCommands = [
	'wait',
	'async',
	'print',
	'success',
	'info',
	'warn',
	'error'
];

const commandDescriptions = {
	exit: 'Disconnect from the server',
	reco: 'Reconnect to server',
	send: 'Send a message in chat',
	position: 'Show current position',
	distance: 'Show the distance between two points',
	list: 'List players connected to the server and their ping',
	blocks: 'Show blocks in a specified radius and filter',
	dig: 'Dig a block in a specific location if possible',
	stopDig: 'Stop digging',
	place: 'Place a block in a specific location if possible',
	move: 'Move the player in blocks',
	moveTo: 'Move in a straight line to a specific set of coordinates',
	pathfind: 'Same as moveTo but uses advanced pathfinding (bad with anti cheats)',
	forceMove: 'Move the player in seconds',
	control: 'Set a control state of the player',
	follow: 'Follow a player',
	smartFollow: 'Same as follow but uses advanced pathfinding (bad with anti cheats)',
	unfollow: 'Stop following',
	attack: 'Attack an entity',
	stopAttack: 'Stop attacking',
	look: 'Look in a certain direction',
	lookAt: 'Look at a player',
	stopLook: 'Stop looking',
	inventory: 'Inventory management',
	open: 'Open a container (chest)',
	changeSlot: 'Change selected hotbar slot',
	useItem: 'Use a held item',
	set: 'Set a variable',
	unset: 'Delete a variable',
	value: 'Get value of a variable',
	variables: 'List all set variables',
	script: 'Run a script',
	version: 'Show package version',
	help: 'Shows this help message'
};

const commandUsage = {
	exit: null,
	reco: null,
	send: 'Usage: .send <Message>',
	position: null,
	distance: 'Usage: .distance <X1> <Y1> <Z1> <X2> <Y2> <Z2>',
	list: null,
	blocks: 'Usage: .blocks <Range> [Count]. Range > 0',
	dig: 'Usage: .dig <X> <Y> <Z>',
	stopdig: null,
	place: 'Usage: .place <X> <Y> <Z>Place a block in a specific location if possible',
	move: 'Usage: .move <Direction:north|south|east|west> [distance]. Distance > 0',
	moveTo: 'Usage: .moveTo <X> <Z> <Range>',
	pathfind: 'Usage: .pathfind <X> <Z>',
	forcemove: 'Usage: .forcemove <Dircetion:up|forward|back|left|right> <Time:Seconds>',
	control: 'Usage: .control <Control: forward|back|left|right|jump|sneak> <State: true, false>',
	follow: 'Usage: .follow <EntityMatches:$name=pig|$name!=pig|...> <Range>. Range > 0',
	smartFollow: 'Usage: .smartfollow <EntityMatches:$name=pig|$name!=pig|...> <Range>. Range > 0',
	unfollow: null,
	attack: 'Usage: .attack <EntityMatches:$name=pig|$name!=pig|...> <CPS> <MaxReach> <MinReach>. MaxReach > MinReach, CPS > 0',
	stopAttack: null,
	look: 'Usage: .look [Direction:north|south|east|west] [Yaw] [Pitch] [Force]',
	lookAt: 'Usage: .lookat <Player> <MaxReach> <MinReach> [Force:yes|y|no|n]. MaxReach > MinReach (duh)',
	stopLook: null,
	inventory: 'Usage: .inventory <ID:0|inventory|1|container> [Action:click|move|drop|dropall|close]',
	open: 'Usage: .open <X> <Y> <Z>',
	changeSlot: 'Usage: .changeslot <Slot>. 0 <= Slot <= 8',
	useitem: null,
	set: 'Usage: .set <Key> <Value>',
	unset: 'Usage: .unSet <Key>',
	value: 'Usage: .value <Key>',
	variables: null,
	script: 'Usage: .script <Path>',
	version: null,
	help: null
};

const nonVanillaCommands = [
	'smartfollow',
	'unfollow',
	'pathfind',
	'attack',
	'stopattack'
];

const commands = { tmp: { variables: {} } };

commands.tmp.botMoving = false;
commands.tmp.botLooking = false;
commands.tmp.botAttacking = false;
commands.tmp.lookInt = false;

let script = { length: 0, msg: [] };
let bot;
// let botMain;

const setBot = (Bot) => {
	bot = Bot;
	mcUtils.setup(bot, botLookPriorityCache);
	pRegistry = require('prismarine-registry')(bot.version);
	ChatMessage = require('prismarine-chat')(pRegistry);
	bot.loadPlugin(pathfinder);
	// send a message when a window opens
	bot.on('windowOpen', () => {
		info('Container #1 opened\nUse ".inventory 1" to interact with it');
	});
};

const setbotMain = () => {
	// botMain = botmain;
};

function loadPlugins (plugins, before = false) {
	for (let i = 0; i < plugins.length; i++) {
		if (typeof plugins[i] !== 'string') {
			if (before === false) warn(`Invalid plugin path: '${plugins[i]}'`);
			continue;
		}
		if (plugins[i] === '') {
			continue;
		}

		let pluginName = basename(plugins[i]);

		try {
			require.resolve(plugins[i]);
		} catch (e) {
			if (before === false) warn(`Plugin '${pluginName}' not found.\nPath: '${plugins[i]}'`);
			continue;
		}

		try {
			const plugin = require(plugins[i]);
			if (typeof plugin.name === 'string') pluginName = plugin.name;
			if (before === true) {
				plugin.before?.({
					settings
				});
				continue;
			}
			plugin.load?.({
				playerIsMovingErr,
				sleep,
				commands,
				pRegistry,
				reservedCommandNames,
				commandDescriptions,
				settings,
				nonVanillaCommands,
				vec: v,
				mcUtils,
				parseCoords,
				parseStr,
				distance,
				bot,
				print,
				info,
				warn,
				error,
				success
			});
			success(`Loaded plugin: '${pluginName}'`);

			plugin.main?.();
		} catch (e) {
			error(`An error occured with the plugin '${pluginName}'.\nIf this keeps happening you may need to remove the plugin`);
		}
	}
}

commands.tasks = () => {
	const configPath = require('./configPath')().path;

	const tasksFile = 'tasks.toml';
	const tasks = requireTOML(path.join(configPath, tasksFile));
	const tasksKeys = Object.keys(tasks);
	const tasksValues = Object.values(tasks);
	for (let i = 0; i < tasksKeys.length; i++) {
		const key = tasksKeys[i];
		const value = tasksValues[i];
		const times = key.match(/^[^_]+/);
		if (!['on', 'once'].includes(times?.[0]) && (typeof value === 'string' && value !== undefined)) continue;
		bot[times](key.match(/(?<=_).+$/), () => {
			commands.optcmd(value.split(' '));
		});
	}
};

commands.exit = () => {
	bot.quit();
	return true;
};

commands.reco = async () => {
	// info('Reconnecting', 1);
	// chat.removeAllListeners();
	// chat.pause();
	// bot.quit('reconnect');
	// await sleep(100);
	// // bot.removeAllListeners();
	// botMain();
	warn('Use .exit instead');
	return false;
};

commands.send = (...msg) => {
	let out = '';
	if (typeof msg === 'object') {
		out = msg[0];
		for (let i = 1; i < msg.length; i++) {
			out = `${out} ${msg[i]}`;
		}
	} else out = msg;
	if (out) {
		bot.chat(out);
		return true;
	}
	info(commandUsage.send);
};

commands.position = () => {
	const pos = bot.entity.position;
	info(`Position: ${Number(pos.x.toFixed(3))}, ${Number(pos.y.toFixed(3))}, ${Number(pos.z.toFixed(3))}`);
};

commands.distance = (x1, y1, z1, x2, y2, z2) => {
	if (!(!isNaN(x1) && !isNaN(y1) && !isNaN(z1) && !isNaN(x2) && !isNaN(y2) && !isNaN(z2))) {
		info(commandUsage.distance);
		return;
	}
	const point1 = v(x1, y1, z1);
	const point2 = v(x2, y2, z2);
	info(`Distance: ${Number(distance(point1, point2).toFixed(3))}`);
};

commands.list = () => {
	let out = '';
	for (const player in bot.players) {
		if (Object.hasOwnProperty.call(bot.players, player)) {
			const playerInfo = bot.players[player];
			out = `${out} ${playerInfo.username} [${playerInfo.ping}]`;
		}
	}
	info(`Player list:${out}`);
};

commands.blocks = (range, count, filter) => {
	if ((isNaN(range) || range <= 0) || (isNaN(count) && count !== undefined)) {
		info(commandUsage.blocks);
		return;
	}

	const blocksCoords = bot.findBlocks({
		matching: (block) => {
			if (block && block.type !== pRegistry.blocksByName.air.id) {
				return block;
			}
		},
		maxDistance: range,
		count: count || Infinity
	});
	const blocks = [];
	for (let i = 0; i < blocksCoords.length; i++) {
		blocks[i] = bot.blockAt(blocksCoords[i]);
	}
	let ready = '';
	let blockCount = 0;
	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		const regex = new RegExp(filter, 'i');
		if (!block.displayName?.match(regex)) continue;
		ready = `${ready}${block.position}  ${block.displayName}: ${block.diggable}\n`;
		blockCount++;
	}
	info(`${ready}Blocks: ${blockCount}`);
};

commands.dig = async (x, y, z) => {
	if (!(!isNaN(x) && !isNaN(y) && !isNaN(z))) {
		info(commandUsage.dig);
		return;
	}
	const block = bot.blockAt(v(x, y, z));
	if (block.type === 0) {
		warn('Block doesn\'t exist');
		return;
	}
	const completed = () => success(`Dug block at ${x}, ${y}, ${z}`);
	bot.once('diggingCompleted', completed);
	await bot.dig(block, true, 'raycast').catch((err) => {
		let moreInfo = '';
		if (err.message === 'Block not in view') moreInfo = '.\nTry moving closer to the block';
		if (err.message === 'dig was called with an undefined or null block') moreInfo = '.\nThat means the block doesn\'t exist';
		warn(`Bot cannot dig block at ${x}, ${y}, ${z}.\n${err.message + moreInfo}`);
		bot.off('diggingCompleted', completed);
	});

	bot.off('diggingCompleted', completed);
};

commands.stopDig = () => {
	bot.stopDigging();
	success('Stopped digging');
};

commands.place = async (x, y, z) => {
	if (commands.tmp.botLooking === true) {
		warn('Cannot use this command while player is attacking/looking at something.');
		return;
	}

	const usage = () => {
		info('Usage: .place <X> <Y> <Z>');
	};

	commands.tmp.botLooking = true;

	const position = v(x, y, z);
	try {
		await mcUtils.placeBlock(position);
	} catch (err) {
		commands.tmp.botLooking = false;
		if (err.message === 'x, y and z must be numbers') {
			usage();
			return;
		}
		if (err.message === 'Block is not empty') {
			warn('There\'s already a block there!');
			return;
		}
		if (err.message === 'There are no valid blocks next to there') {
			warn('There should be a block right next to where you would place the block');
			return;
		}
		if (err.message === 'Impossible to place block from this angle') {
			warn('Impossible to place block from this angle');
			return;
		}
		error(`Could not place block.\n${err.message}`);
	}
	commands.tmp.botLooking = false;
};

commands.moveTo = async (x, z, range = 0) => {
	if (!(!isNaN(x) && !isNaN(z) && !isNaN(range))) {
		info(commandUsage.moveTo);
		return;
	}

	info('Moving');
	try {
		await mcUtils.move(x, z, range);
	} catch (err) {
		error('Bot got stuck and couldn\'t reach its destination');
		return;
	}

	success(`Moved to ${x}, ${z}`);
};

commands.move = async (direction, distance) => {
	// ?
	if (!direction || (distance !== undefined && distance <= 0)) {
		info(commandUsage.move);
		return;
	}
	if (commands.tmp.botMoving === true) {
		warn(playerIsMovingErr);
		return;
	}
	distance = distance || 1;
	let x = 0;
	let z = 0;
	switch (direction) {
	case 'north': z = -distance; break;
	case 'south': z = distance; break;
	case 'east': x = distance; break;
	case 'west': x = -distance; break;
	default:
		info('Usage: .move <Direction:north|south|east|west> <distance?>. Distance > 0');
		return;
	}
	if (!Number.isInteger(distance)) {
		warn('Distance must be an integer');
		return;
	}
	commands.tmp.botMoving = true;
	let unit;
	if (distance === 1) unit = 'block';
	else unit = 'blocks';

	info(`Attempting to move ${direction} for ${distance} ${unit}`);
	const position = bot.entity?.position;
	// await bot.pathfinder.goto(new GoalXZ(position.x + x, position.z + z)).catch((err) => {
	// error(`Cannot move ${direction} for ${distance} ${unit}.\n${err}`);
	// });
	if ((await mcUtils.move(position.x + x, position.z + z, 0, Infinity)) === true) {
		success(`Moved ${direction} for ${distance} ${unit}`);
	} else {
		warn('Path was obstructed.\nStopped moving');
	}
	commands.tmp.botMoving = false;
};

async function botFollow (matchesStr, range) {
	if (!matchesStr || !range) {
		return;
	}
	const stopGoingForward = () => {
		if (bot.getControlState('forward') === true) {
			bot.setControlState('forward', false);
		}
	};
	const goForward = () => {
		if (bot.getControlState('forward') === false) {
			bot.setControlState('forward', true);
		}
	};
	const jump = async () => {
		if (bot.getControlState('jump') === false) {
			bot.setControlState('jump', true);
			await sleep(10);
			bot.setControlState('jump', false);
		}
	};

	const sprintState = bot.getControlState('sprint');
	const jumpState = bot.getControlState('jump');
	let cooldown = 0;
	let botPos = bot.entity?.position;
	bot.setControlState('sprint', true);

	let oldBotPos = Object.assign({}, botPos);
	let err = false;
	while (commands.tmp.botMoving === true) {
		if ((Date.now() - cooldown) < 80) {
			cooldown = Date.now();
			await sleep(200);
			stopGoingForward();
			continue;
		} else cooldown = Date.now();
		const entity = bot.nearestEntity((entity) => {
			try {
				return utils.matchEq(matchesStr, entity);
			} catch {
				if (err !== true) err = true;
			}
		});
		if (err === true) {
			commands.tmp.botMoving = false;
			error('Invalid EntityMatches');
			return;
		}
		if (!entity?.position) {
			await sleep(200);
			stopGoingForward();
			continue;
		}
		const playerHeight = entity.height || 1.518;
		botPos = bot.entity?.position;
		if (!botPos) {
			await sleep(200);
			stopGoingForward();
			continue;
		}
		const distXZ = distance({ x: botPos.x, z: botPos.z }, { x: entity.position.x, z: entity.position.z });
		// const distY = Math.abs(botPos.y - playerPos.y);
		if (distXZ <= range) {
			await sleep(150);
			stopGoingForward();
			continue;
		}
		// Makes the bot go in a straight line when possible
		const playerBlockPos = v(
			Math.floor(entity.position.x),
			botPos.y,
			Math.floor(entity.position.z)
		).offset(
			botPos.x - Math.floor(botPos.x),
			playerHeight,
			botPos.z - Math.floor(botPos.z)
		);
		await withPriority(10, 120, true, false, botLookPriorityCache, () => {
			bot.lookAt(playerBlockPos, true);
			goForward();
			if (distance({ x: oldBotPos.x + oldBotPos.z }, { x: botPos.x + botPos.z }) < 0.001) {
				jump();
			}
			oldBotPos = Object.assign({}, botPos);
		});
		await sleep(80);
	}
	stopGoingForward();
	bot.setControlState('sprint', sprintState);
	bot.setControlState('jump', jumpState);
}

commands.follow = async (matchesStr, range) => {
	if (commands.tmp.botMoving === true) {
		warn(playerIsMovingErr);
		return;
	}

	const usage = commandUsage.follow;
	if (!['string', 'boolean'].includes(typeof matchesStr) || isNaN(range) || range <= 0) {
		info(usage);
		return;
	}

	try {
		utils.matchEq(matchesStr, {});
	} catch {
		info(usage);
		return;
	}
	commands.tmp.botMoving = true;
	let unit;
	if (range === 1) unit = 'block';
	else unit = 'blocks';
	success(`Following nearest entity if ${matchesStr} with a range of ${range} ${unit}`);
	botFollow(matchesStr, range);
};

commands.pathfind = async (x, z) => {
	if (isNaN(x) && isNaN(z)) {
		info(commandUsage.pathfind);
		return;
	}
	if (commands.tmp.botMoving) {
		warn(playerIsMovingErr);
		return;
	}
	commands.tmp.botMoving = true;
	info(`Attempting to move to ${x}, ${z}`);
	await bot.pathfinder.goto(new GoalXZ(x, z))
		.catch((err) => {
			error(`Could not move to ${x}, ${z}.\n${err}`);
			commands.tmp.botMoving = false;
		});
	success(`Moved to ${x}, ${z}`);
	commands.tmp.botMoving = false;
};

commands.forceMove = async (direction, time) => {
	if ((direction === 'up' || direction === 'forward' || direction === 'back' || direction === 'left' || direction === 'right' || direction === 'sprint') && !isNaN(time)) {
		info(`Moving ${direction} for ${time} seconds`);
		if (direction === 'up') direction = 'jump';
		bot.setControlState(direction, true);
		await sleep(time * 1000);
		bot.setControlState(direction, false);
		success(`Moved ${direction} for ${time} seconds`);
	} else info(commandUsage.forcemove);
};

/**
	* The commands.control function sets the control state of the bot.
	*
	* @param control Used to Set the control state of a specific control.
	* @param state Used to Determine whether the control is set to true or false.
	* @return Nothing.
	*
	*/
commands.control = (control, state) => {
	if (['forward', 'back', 'left', 'right', 'jump', 'sprint', 'sneak'].includes(control) && typeof state === 'boolean') {
		bot.setControlState(control, state);
		success(`Set control state ${control} to ${state}`);
	} else if (control === 'clearall') {
		bot.clearControlStates();
		success('Cleared all control states');
	} else info(commandUsage.control);
};

async function botSmartFollow (matchesStr, range) {
	if (!matchesStr || !range) {
		return;
	}
	let cooldown = 0;
	let goal;
	range = range - 0.55;
	let err = false;
	while (commands.tmp.botMoving) {
		if ((Date.now() - cooldown) < 80) {
			cooldown = Date.now();
			await sleep(200);
			continue;
		} else cooldown = Date.now();
		const entity = bot.nearestEntity((entity) => {
			try {
				return utils.matchEq(matchesStr, entity);
			} catch {
				if (err !== true) err = true;
			}
		});
		if (err === true) {
			commands.tmp.botMoving = false;
			error('Invalid EntityMatches');
			return;
		}
		if (!entity?.position || !bot.entity?.position) {
			await sleep(150);
			continue;
		}
		const dist = distance(bot.entity.position, entity.position) - 0.67;
		if (dist < range) {
			await sleep(150);
			continue;
		}
		goal = new GoalFollow(entity, range);
		withPriority(10, 220, true, false, botLookPriorityCache);
		await bot.pathfinder.goto(goal).catch((err) => {
			error('Could not follow the player.\n' + err);
			goal = new GoalFollow(entity, range);
		});
	}
}

commands.smartFollow = async (matchesStr, range) => {
	if (commands.tmp.botMoving !== false) {
		warn(playerIsMovingErr);
		return;
	}
	const usage = commandUsage.smartFollow;
	if (!['string', 'boolean'].includes(typeof matchesStr) || isNaN(range) || range <= 0) {
		info(usage);
		return;
	}

	try {
		utils.matchEq(matchesStr, {});
	} catch {
		info(usage);
		return;
	}
	let unit;
	if (range === 1) unit = 'block';
	else unit = 'blocks';
	success(`Following nearest entity if ${matchesStr} with a range of ${range} ${unit}`);
	commands.tmp.botMoving = true;
	botSmartFollow(matchesStr, range);
};

/**
	* The botUnfollow function unfollows the player that is currently being followed.
	*
	* @return Nothing.
	*
	*/
function botUnfollow () {
	commands.tmp.botMoving = false;
}

commands.unFollow = () => {
	botUnfollow();
	success('Not following anyone');
};

commands.attack = (matchesStr, cps, reach, minreach) => {
	if (commands.tmp.botAttacking) {
		warn('Player is already attacking someone. Use ".stopattack"');
		return;
	}
	if (commands.tmp.botLooking) {
		warn('Player is looking at someone. Use ".stoplook"');
		return;
	}
	const usage = commandUsage.attack;
	if (!['string', 'boolean'].includes(typeof matchesStr) || isNaN(cps) || isNaN(reach) || isNaN(minreach) || cps <= 0 || reach <= 0 || reach < minreach) {
		info(usage);
		return;
	}

	try {
		utils.matchEq(matchesStr, {});
	} catch {
		info(usage);
		return;
	}

	commands.tmp.botLooking = true;
	commands.tmp.botAttacking = true;
	success(`Attacking nearest entity with ${cps}CPS if ${matchesStr} and MinReach(${minreach}) < distance < MaxReach(${reach})`);

	commands.tmp.attackInt = setInterval(async () => {
		if (commands.tmp.botAttacking === true) {
			let err = false;
			await mcUtils.botAttack(
				minreach,
				reach,
				bot.nearestEntity((entity) => {
					try {
						if (utils.matchEq(matchesStr, entity) && (entity.type === 'player' || entity.type === 'mob')) {
							return true;
						}
					} catch {
						if (err === false) err = true;
					}
				})
			);
			if (err === true) {
				commands.tmp.botAttacking = false;
				commands.tmp.botLooking = false;
				error('Invalid EntityMatches');
			}
		} else clearInterval(commands.tmp.attackInt);
	}, 1000 / cps);
};

commands.stopAttack = () => {
	if (commands.tmp.botLooking === true && commands.tmp.botAttacking === false) {
		warn('Cannot use ".stopattack" because player is looking at someone\nConsider ".stoplook"');
		return;
	}
	commands.tmp.botAttacking = false;
	commands.tmp.botLooking = false;
	success('Not attacking anyone');
};

commands.look = async (a, b, c) => {
	if (a && isNaN(a)) {
		if (b === undefined) b = true;
		const dir = a;
		if (mcUtils.look(mcUtils.directionToYaw[dir]) === false) {
			info(commandUsage.look);
		} else success(`Looking ${dir}`);
	} else if (!isNaN(a) && !isNaN(b)) {
		if (a > 90 || b > 90) {
			warn('Yaw or Pitch cannot be more than 90 deg');
			return;
		}
		if (a < -90 || b < -90) {
			warn('Yaw or Pitch cannot be less than -90 deg');
			return;
		}
		if (c === undefined) c = true;
		await bot.look(-(Number(a) + 180) / 57.296329454, -b / 57.296329454, c);
		success(`Set Yaw to ${a} and Pitch to ${b}`);
	} else info('Usage: .look [Direction:north|south|east|west] [Yaw] [Pitch]');
};

commands.lookAt = (who, reach, minreach, force) => {
	if (who && reach > 0 && (minreach === undefined || reach > minreach)) {
		if (minreach === undefined) minreach = reach;
		if (commands.tmp.botAttacking) {
			warn('Player is attacking someone. Use ".stopattack"');
			return;
		}
		if (commands.tmp.botLooking) {
			warn('Player is already looking at someone. Use ".stoplook"');
			return;
		}
		commands.tmp.botLooking = true;
		if (force === 'yes' || force === 'y') force = true;
		else force = false;
		commands.tmp.lookInt = setInterval(() => {
			if (!commands.tmp.botLooking) clearInterval(commands.tmp.lookInt);
			if (bot.players[who]?.entity?.position) {
				const dist = distance(bot.players[who]?.entity?.position, bot.entity.position);
				if (dist < reach && dist > minreach) bot.lookAt(v(bot.players[who].entity.position.x, bot.players[who].entity.position.y + bot.players[who].entity.height, bot.players[who].entity.position.z), force);
			}
		}, 100);
		let withForce = 'without';
		if (force) withForce = 'with';
		success(`Looking at ${who} if MinReach(${minreach}) < distance < MaxReach(${reach}) ${withForce} force`);
	} else info(commandUsage.lookAt);
};

commands.stopLook = () => {
	if (commands.tmp.botAttacking === true) {
		warn('Cannot use ".stoplook" because player is attacking someone\nConsider ".stopattack"');
		return;
	}
	commands.tmp.botLooking = false;
	info('Not looking at anyone');
};

const parseItemName = (item) => {
	let name = {};
	if (item?.nbt?.value?.display?.value?.Name) {
		name = item?.nbt.value.display.value.Name;
	} else if (item?.displayName) {
		name.value = item?.displayName;
	} else {
		name.value = item?.name || 'no_name';
	}

	let out = '';
	try {
		const parsedName = JSON.parse(name.value);
		out = new ChatMessage(parsedName).toMotd();
	} catch {
		out = name.value;
	}
	return out;
};

commands.inventory = async (windowID, subCommand, ...args) => {
	if (windowID !== 0 && windowID !== 1 && windowID !== 'inventory' && windowID !== 'container') {
		info(commandUsage.inventory);
		return;
	}

	let isContainer = false;
	if (windowID === 'container' || windowID === 1) {
		isContainer = true;
	} else if (isContainer === false) {
		isContainer = false;
	}

	if (isContainer === true && !bot.currentWindow) {
		info('There is no container opened right now');
		return;
	}

	if (subCommand === undefined) {
		let inventoryItems = {};
		if (isContainer === true) {
			if (!bot.currentWindow) {
				info('There is no container opened right now');
				return;
			}
			inventoryItems = mcUtils.getItems(bot.currentWindow);
		} else {
			inventoryItems = bot.inventory.items();
		}

		const a = (items) => {
			if (items.length < 1) {
				return 'Empty';
			}
			const make = (item, itemName, d = '') => {
				let a = bot.inventory.inventoryStart;
				if (item.slot > bot.inventory.inventoryEnd) {
					a = -a;
				}

				let hotBarNum = a - (bot.inventory.inventoryEnd - item.slot);
				if (isNaN(hotBarNum) || hotBarNum < 0) {
					hotBarNum = ' ';
				}
				out = `${out + d + hotBarNum} | #${item.slot}: x${item.count}  ${itemName}`;
			};
			let out = '';
			const itemm = items?.[0];

			const itemNamee = parseItemName(itemm);
			make(itemm, itemNamee);
			for (let i = 1; i < items.length; i++) {
				const item = items[i];
				const itemName = parseItemName(item);
				make(item, itemName, '\n');
			}
			return out;
		};

		let outStr = a(inventoryItems);
		if (isContainer === false) {
			outStr = `${outStr}\nSelected slot: ${bot.quickBarSlot}`;
		}
		info(outStr);
		return;
	}

	let inventoryStartOffset = 0;
	if (isContainer === false && bot.currentWindow?.inventoryEnd && bot.inventory?.inventoryEnd) {
		inventoryStartOffset = bot.currentWindow.inventoryEnd - bot.inventory.inventoryEnd;
	}

	subCommand = subCommand.toLowerCase();
	args = utils.toLowerCaseArr(args);

	if (subCommand === 'close') {
		if (isContainer === true) {
			info(`Closing window #${windowID}`);
			bot.closeWindow(bot.currentWindow);
		} else {
			warn('There is nothing to close');
		}
		return;
	}

	if (subCommand === 'click' && !isNaN(args[0])) {
		info(`Left clicking slot ${args[0]} in window #${windowID}`);
		bot.clickWindow(args[0], 0, 0);
		return;
	}

	if (subCommand === 'move' && !isNaN(args[0]) && !isNaN(args[1])) {
		info(`Moving item at slot ${args[0]} to slot ${args[1]} in window #${windowID}`);
		await bot.clickWindow(inventoryStartOffset + args[0], 0, 0);
		await sleep(10);
		await bot.clickWindow(inventoryStartOffset + args[1], 0, 0);
		return;
	}
	if (subCommand === 'drop' && !isNaN(args[0])) {
		info(`Dropping item at slot ${args[0]} in window #${windowID}`);
		await bot.clickWindow(inventoryStartOffset + args[0], 0, 0);
		await sleep(10);
		await bot.clickWindow(-999, 0, 0);
		return;
	}
	if (subCommand === 'dropall') {
		let items;
		if (isContainer === true) {
			items = mcUtils.getItems(bot.currentWindow, bot.inventory.inventoryEnd);
		} else {
			items = bot.inventory.items();
		}
		info(`Dropping all items in window #${windowID}`);
		for (let i = 0; i < items.length; i++) {
			await bot.clickWindow(inventoryStartOffset + items[i].slot, 0, 0);
			await sleep(10);
			await bot.clickWindow(-999, 0, 0);
		}
		return;
	}
	info('Usage: .inventory <ID:0|inventory|1|container> [Action:click|move|drop|dropall] <...Args?>');
};

commands.open = async (x, y, z) => {
	if (isNaN(x) || isNaN(y) || isNaN(z)) {
		info(commandUsage.open);
		return;
	}
	if (commands.tmp.botLooking === true) {
		warn('Cannot use this command while player is attacking/looking at something.');
		return;
	}
	const blockPos = v(x, y, z);
	const block = bot.blockAt(blockPos);
	info('Attempting to open container');
	await bot.openContainer(block)
		.then(() => {
			success('Opened the container');
		})
		.catch((err) => {
			error(err.message);
		});
};

commands.changeSlot = (slot) => {
	if (!isNaN(slot) && slot > -1 && slot < 9) {
		bot.setQuickBarSlot(slot);
		info(`Changed slot to ${slot}`);
	} else info(commandUsage.changeSlot);
};

commands.useitem = async (sec) => {
	if (!sec) sec = 0.1;
	bot.activateItem();
	await sleep(sec * 1000);
	bot.deactivateItem();
	success(`Used an item for ${sec} seconds`);
};

commands.set = (key, value) => {
	if (key === undefined) {
		info(commandUsage.set);
		return;
	}
	commands.tmp.variables[key] = value;
	success(`Set %${key}% to ${value}`);
};

commands.unset = (key) => {
	if (key === undefined) {
		info(commandUsage.unset);
		return;
	};
	delete commands.tmp.variables[key];
	success(`Deleted %${key}%`);
};

commands.value = (key) => {
	if (key === undefined) {
		info(commandUsage.value);
		return;
	}
	info(`${key}: ${commands.tmp.variables[key]}`);
};

commands.variables = () => {
	const values = Object.values(commands.tmp.variables);
	const keys = Object.keys(commands.tmp.variables);
	let out = '';
	if (keys[0] !== undefined) out = `${keys[0]}: ${values[0]}`;
	for (let i = 1; i < values.length; i++) {
		if (keys[i] === undefined) continue;
		out = `${out}\n${keys[i]}: ${values[i]}`;
	}
	info(`Values:\n${out}`);
};

commands.script = (pathToSrc) => {
	const fs = require('fs');
	if (!pathToSrc) {
		info(commandUsage.script);
		return;
	}
	fs.access(pathToSrc, fs.F_OK, (err) => {
		if (err) {
			info('Unable to access file. Does it exist?');
			return;
		}
		const file = fs.createReadStream(pathToSrc);
		const readInterface = readline.createInterface({
			input: file,
			output: null,
			console: false
		});
		readInterface.on('line', async (msg) => {
			script.msg[script.length] = msg;
			script.length++;
		});
		readInterface.once('close', async () => {
			info('Reading script');
			let inps;
			let inp;
			for (let i = 0; i < script.length; i++) {
				script.msg[i] = script.msg[i].replace(/#.+/, '');
				if (script.msg[i] === '') continue;
				inps = [];
				inps[0] = script.msg[i];
				if (script.msg[i].match(/(?<= ).+/)) inps[1] = script.msg[i].match(/(?<= ).+/)[0];
				inp = inps[0].split(' ');
				await commands.optcmd(inp, { type: 'script' });
			}
			script = { length: 0, msg: [] };
			await sleep(200);
			success('Reached end of script');
		});
	});
};

commands.version = () => {
	info(`${PACKAGE.name} version: ${PACKAGE.version}\nNode version: ${process.version}`);
};

commands.OwO = (...msg) => {
	let out = '';
	if (typeof msg === 'object') {
		out = msg[0];
		for (let i = 1; i < msg.length; i++) {
			out = `${out} ${msg[i]}`;
		}
	} else out = msg;
	if (out) bot.chat(owo(out));
	else info('Usage: .owo <Message>');
};

commands.wait = async (sec) => {
	await sleep(sec * 1000);
};

commands.async = async (...input) => {
	if (!input[0]) {
		warn('No command provided');
		return;
	}
	commands.optcmd(input, { type: 'script' });
};

commands.print = print;
commands.success = success;
commands.info = info;
commands.warn = warn;
commands.error = error;

commands.optcmd = async (inp, options) => {
	inp = parseStr(inp);
	let inputCommand = inp[0].toLowerCase();
	const commandKeys = Object.keys(commands);
	const aliasKeys = utils.toLowerCaseArr(Object.keys(settings.settings.config.config.config.commands.commandAliases));
	const aliasValues = utils.toLowerCaseArr(Object.values(settings.settings.config.config.config.commands.commandAliases));
	const indexOfAlias = aliasKeys.indexOf(inputCommand);
	let args = [];
	if (indexOfAlias !== -1) {
		const fullCommand = aliasValues[indexOfAlias].split(' ');
		inputCommand = fullCommand[0];
		// ??
		args = [...args, ...fullCommand.splice(1)];
	}
	args = [...args, ...inp.splice(1)];
	const indexOfCommand = utils.toLowerCaseArr(commandKeys).indexOf(inputCommand);

	if (indexOfCommand === -1 || reservedCommandNames.includes(inputCommand)) {
		warn(`'${inputCommand}' is not a valid command`);
		return;
	}
	if (settings.settings.config.config.config.commands.enableNonVanillaCMD === false && nonVanillaCommands.includes(inputCommand)) {
		warn('This commands uses some non-vanilla features to work which may get you banned on some servers.\nYou can enable it in the configuration');
		return;
	}
	if (options?.type !== 'script' && scriptOnlyCommands.includes(inputCommand)) {
		warn('This command can only be used inside scripts');
		return;
	}
	const func = commands[commandKeys[indexOfCommand]];
	await func(...args);
};

/**
	* The commands.help function prints a help message to the console.
	*
	* @return Nothing.
	*
	*/
commands.help = () => {
	const check = (cmd) => {
		if (reservedCommandNames.includes(cmd)) {
			return false;
		}
		return true;
	};
	let help = '';
	let i = 1;
	const commandNames = Object.keys(commands);
	for (let p = 0; p < i; p++) {
		const command = commandNames[p];
		if (check(command) === true) {
			help = '.' + tab(command, commandDescriptions[command], 14);
		} else i++;
	}
	for (; i < commandNames.length; i++) {
		const command = commandNames[i];
		if (check(command) === false) continue;
		help = `${help}\n.${tab(command, commandDescriptions[command.toLowerCase()], 14)}`;
	}
	info(help);
};

commands.cmd = async (msg) => {
	if (msg === '') {
		return;
	}

	let command = msg.match(/(?<=^\.).+/)?.[0];
	if (command) {
		command = parseCoords(command, bot.entity.position, 3);
		command = parseVar(command, commands.tmp.variables, '%', '%');
		// const inps = [];
		// inps[0] = tmp;
		// if (tmp.match(/(?<= ).+/)) inps[1] = tmp.match(/(?<= ).+/)[0];
		// const inp = inps[0].match(/[^ ]+/g);
		const inp = command.match(/'.*?'|".*?"|\S+/g);
		for (let i = 0; i < inp.length; i++) {
			const e = inp[i];
			const quoted = e.match(/(?<=^').+(?='$)|(?<=^").+(?="$)/);
			if (!quoted) {
				continue;
			}
			const quotes = e.match(/^['"]/);
			inp[i] = e.replace(quotes + quoted + quotes, quoted);
		}
		commands.optcmd(inp);
		return;
	}
	bot.chat(msg);
};

module.exports = { commands, events, setBot, setbotMain, setConfig, loadPlugins };
