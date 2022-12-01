/* eslint-env jest */
const mcUtils = require('../../lib/mineflayer-utils');
const distance = require('../../lib/distance');
const { EventEmitter } = require('events');
const serverUtils = require('./serverUtils');
const sleep = require('../../lib/sleep');
const commands = require('../../lib/commands');
const v = require('vec3');

jest.setTimeout(40 * 1000);

let bot = new EventEmitter();

beforeAll(async () => {
	await sleep(6000);
	bot = await serverUtils.beforeEverything();

	commands.setBot(bot);
	mcUtils.setup(bot);
}, 30 * 1000);

async function goToStart () {
	bot.chat('/tp 0 6 0');
	await sleep(1100);
}

let dugBlockPos;
describe('commands', () => {
	test('commands.digBlock', async () => {
		await goToStart();
		const pos = v(-1, 5, 0);
		dugBlockPos = pos;

		bot.chat('/setblock -1 5 0 2');
		await sleep(500);

		await commands.commands.dig(pos.x, pos.y, pos.z);

		const block = bot.blockAt(dugBlockPos);

		expect(block.type === 0).toBeTruthy();
	});

	test('commands.place', async () => {
		await goToStart();
		await commands.commands.place(dugBlockPos.x, dugBlockPos.y, dugBlockPos.z);
		await sleep(500);

		const block = bot.blockAt(dugBlockPos);

		expect(block.type === 0).toBeFalsy();
	});

	test('commands.moveTo', async () => {
		await goToStart();
		const xOffset = 10;
		const zOffset = 10;

		const oldPos = bot.entity.position;
		await commands.commands.moveTo(bot.entity.position.x + xOffset, bot.entity.position.z + zOffset);
		await sleep(1000);
		const supposedDist = distance(oldPos, oldPos.offset(xOffset, 0, zOffset));
		const dist = distance(oldPos, bot.entity.position);
		const errorRange = 5;

		expect(dist < (supposedDist + errorRange) && dist > (supposedDist - errorRange)).toBeTruthy();
	});

	test('commands.pathfind', async () => {
		await goToStart();

		const xOffset = 10;
		const zOffset = 10;
		const errorRange = 5;

		const oldPos = bot.entity.position;
		const supposedDist = distance(oldPos, oldPos.offset(xOffset, 0, zOffset));

		await commands.commands.pathfind(oldPos.x + xOffset, oldPos.z + zOffset);
		await sleep(1000);

		const dist = distance({ x: bot.entity.position.x, z: bot.entity.position.z }, { x: oldPos.x, z: oldPos.z });

		expect(dist < (supposedDist + errorRange) && dist > (supposedDist - errorRange)).toBeTruthy();
	});
});

afterAll(async () => {
	bot.chat('/stop');
	bot.quit();
	await serverUtils.waitForBotToEnd(bot);
}, 30 * 1000);
