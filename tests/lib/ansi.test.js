/* eslint-env jest */
const ansi = require('../../lib/ansi');
const { hexToRGBA } = require('../../lib/utils');

test('Set Minecraft version', () => {
	ansi.other.setMCVersion('1.8.9');
});

test('Minecraft color code conversion to ansi', () => {
	const colorCode = '6';
	expect(
		ansi.MCColor.c2c('&6h', '&', false)
	).toBe(
		ansi.MCColor[colorCode] + 'h' + ansi.color.reset
	);
});

test('Minecraft Hex code conversion to ansi', () => {
	const hexCode = '#f0f0ff';
	expect(
		ansi.MCColor.c2c('&' + hexCode, '&', false)
	).toBe(
		ansi.color.rgb(...hexToRGBA(hexCode, [6])) + ansi.color.reset
	);
});

test('Minecraft color object conversion to ansi', () => {
	const mcJson = '{"text":"abcd"}';
	const outTxt = 'abcd';
	expect(
		ansi.MCColor.c2c(mcJson, '&', true)
	).toBe(outTxt);
});
