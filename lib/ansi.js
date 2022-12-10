const escapeRegex = require('./escapeRegex');
const { hexToRGBA } = require('./utils');

let pRegistry;
let ChatMessage;

let mcVersion;
function setMCVersion (ver) {
	mcVersion = ver;
	pRegistry = require('prismarine-registry')(mcVersion);
	ChatMessage = require('prismarine-chat')(pRegistry);
}

/** All Minecraft color codes */

const MC = {
	0: '\x1b[38;2;0;0;0m',
	1: '\x1b[38;2;0;0;170m',
	2: '\x1b[38;2;0;170;0m',
	3: '\x1b[38;2;0;170;170m',
	4: '\x1b[38;2;170;0;0m',
	5: '\x1b[38;2;170;0;170m',
	6: '\x1b[38;2;255;170;0m',
	7: '\x1b[38;2;170;170;170m',
	8: '\x1b[38;2;85;85;85m',
	9: '\x1b[38;2;85;85;255m',
	a: '\x1b[38;2;85;255;85m',
	b: '\x1b[38;2;85;255;255m',
	c: '\x1b[38;2;255;85;85m',
	d: '\x1b[38;2;255;85;255m',
	e: '\x1b[38;2;255;255;85m',
	f: '\x1b[37m',
	g: '\x1b[38;2;221;214;5m',
	l: '\x1b[1m',
	m: '\x1b[9m',
	n: '\x1b[4m',
	o: '\x1b[3m',
	r: '\x1b[0m'
};

/**
 * The rgb function returns a string representing the color with the specified red, green and blue values.
 * Each value must be in the range (0-255).
 *
 * @param {number} red Used to Set the red value of a color.
 * @param {number} green Used to Set the green value a color.
 * @param {number} blue Used to Set the blue value of a color.
 * @return The escape sequence with the format \x1b[38;2;${red};${green};${blue}m.
 * @example
 * console.log(`${ansi.color.rgb(100, 255, 200)}Cyan!${ansi.color.reset}`);
 * // Works;
 *
 * console.log(`${ansi.color.rgb(100, 256, 200)}Cyan!${ansi.color.reset}`);
 * // Doesn't work;
 * console.log(`${ansi.color.rgb(100, -255, 200)}Cyan!${ansi.color.reset}`);
 * // Doesn't work;
 */
const rgb = (red, green, blue) => {
	if (isNaN(red)) {
		red = 0;
	}
	if (isNaN(green)) {
		green = 0;
	}
	if (isNaN(blue)) {
		blue = 0;
	}
	return `\x1b[38;2;${red};${green};${blue}m`;
};

/**
 * The colorID function returns a string that will set the color of
 * the terminal to a given ID. The function takes two arguments, an integer ID
 * and a boolean indicating whether or not to set the foreground or background color.
 *
 * @param {number} ID Used to determine the color of the text.
 * @param {boolean} BG True for background, false for foreground.
 * @return A string containing the escape sequence for a color.
 *
 */
const colorID = (ID, BG) => {
	if (BG === true) return `ESC[48;5;${ID}m`;
	else return `ESC[38;5;${ID}m`;
};

/**
 * The c2c function takes a string and replaces all Minecraft color codes with the
 * corresponding ANSI escape sequence. It also adds an ANSI escape sequence to
 * reset the text color after each colored section. This is useful for when you
 * want to print out multiple messages in succession, as it will automatically
 * reset colors between each message. For example:
 * `c2c('§0Hello!')` would return: '\x1b[38;2;0;0;0mHello!\x1b[0m'
 * @param {string} message Used to Pass the message to be sent.
 * @return The message with the color codes converted to ANSI escape codes.
 * @example
 * console.log(c2c('§0Hello!')); // Returns '\x1b[38;2;0;0;0mHello!\x1b[0m'
 *
 */
const c2c = (message, prefix = '§', json = false) => {
	if (typeof message !== 'string') {
		throw new Error('message must be of type string');
	}
	if (typeof prefix !== 'string') {
		throw new Error('prefix must be of type string');
	}
	if (!message || !prefix) {
		return message;
	}
	if (json === true) {
		try {
			const parsedName = JSON.parse(message);
			message = c2c(new ChatMessage(parsedName).toMotd());
		} catch {}
	}

	{
		const code = message.match(new RegExp(`(?<=${escapeRegex(prefix)})([^#]|[${escapeRegex(Object.keys(MC).join(''))}])`, 'g'));
		for (let i = 0; i < code?.length; i++) {
			if (MC[code[i]]) {
				const regex = new RegExp(escapeRegex(prefix + code[i]));
				message = message.replace(regex, MC[code[i]]) + '\x1b[0m';
			}
		}
	}

	{
		const hexCodes = message.match(new RegExp(`(?<=${escapeRegex(prefix)})#([A-Fa-f0-9]){6}`, 'g'));
		for (let i = 0; i < hexCodes?.length; i++) {
			const hexCode = hexCodes[i];
			const regex = new RegExp(escapeRegex(prefix + hexCode));
			try {
				message = message.replace(regex, rgb(...hexToRGBA(hexCode, [6]))) + '\x1b[0m';
			} catch {}
		}
	}
	return message;
};

const MCColor = { ...MC, c2c };

/**
 * The termSize function returns the current size of the terminal window.
 * It is used to determine how many lines and columns are available for printing.
 *
 * @return An object with the following properties:.
 *
 */
const termSize = () => {
	let out;
	if (process.stdout.getWindowSize) out = process.stdout.getWindowSize();
	else out = process.stderr.getWindowSize();
	return [out[1], out[0]];
};

const color = {
	rgb,
	colorID,
	/** Reset all modes (styles and colors) */
	reset: '\x1b[0m',
	/** Set bold mode */
	bold: '\x1b[1m',
	/** Set dim/faint mode */
	dim: '\x1b[2m',
	/** Set italic mode */
	italic: '\x1b[3m',
	/** Set underline mode */
	underline: '\x1b[4m',
	/** Set blinking mode */
	blink: '\x1b[5m',
	/** Set inverse/revers mode */
	reverse: '\x1b[7m',
	/** Set hidden/invisible mode */
	hidden: '\x1b[8m',
	/** Set strikethrough mode */
	strike: '\x1b[9m',
	/** Set the foreground color to black */
	black: '\x1b[30m',
	/** Set the foreground color to red */
	red: '\x1b[31m',
	/** Set the foreground color to green */
	green: '\x1b[32m',
	/** Set the foreground color to yellow */
	yellow: '\x1b[33m',
	/** Set the foreground color to blue */
	blue: '\x1b[34m',
	/** Set the foreground color to magenta */
	magenta: '\x1b[35m',
	/** Set the foreground color to cyan */
	cyan: '\x1b[36m',
	/** Set the foreground color to white */
	white: '\x1b[37m',
	/** Set the background color to black */
	BGblack: '\x1b[40m',
	/** Set the background color to red */
	BGred: '\x1b[41m',
	/** Set the background color to green */
	BGgreen: '\x1b[42m',
	/** Set the background color to yellow */
	BGyellow: '\x1b[43m',
	/** Set the background color to blue */
	BGblue: '\x1b[44m',
	/** Set the background color to magenta */
	BGmagenta: '\x1b[45m',
	/** Set the background color to cyan */
	BGcyan: '\x1b[46m',
	/** Set the background color to white */
	BGwhite: '\x1b[47m'
};

/*

	Cursor functions

*/

/**
 * The cursorMove function moves the cursor to a specified row and column relative to its position.
 *
 * @param {Integer} row Used to Move the cursor up or down.
 * @param {Integer} column Used to Move the cursor to a specific column in the terminal.
 * @return The escape sequence that will move the cursor to a specific row and column relative to its position.
 */
const cursorMove = (row, column) => {
	if ((isNaN(row) || row === undefined) || (isNaN(column) || column === undefined)) {
		throw new Error('Value must be an integer');
	}
	if (row === 0 && column === 0) {
		return;
	}
	let out = '';
	if (row > 0) {
		out = `\x1b[${row}B`;
	}
	if (row < 0) {
		out = `\x1b[${Math.abs(row)}A`;
	}

	if (column > 0) {
		out += `\x1b[${column}C`;
	}
	if (column < 0) {
		out += `\x1b[${Math.abs(column)}D`;
	}
	if (out !== undefined) process.stdout.write(out);
};

/**
 * The cursorTo function moves the cursor to a specific row and column.
 *
 * @param {Integer} row Used to Specify the row number to move the cursor to.
 * @param {Integer} column Used to Specify the column number to move the cursor to.
 * @return The escape sequence that will move the cursor to a specific row and column.
 */
const cursorTo = (row, column) => {
	if (isNaN(row) || isNaN(column)) throw new Error('Both values need to be filled with numbers');
	else process.stdout.write(`\x1b[${row};${column}H`);
};

/**
 * The cursorBeg function moves the cursor to the beginning of a specified line relative to its position.
 *
 * @param {Integer} lines Used to Move the cursor up or down.
 * @return The escape sequence to move the cursor up or down by a certain number of lines.
 */
const cursorBeg = (lines) => {
	if (isNaN(lines)) throw new Error('Value need to be filled with numbers');
	else {
		if (lines > 0) return `\x1b[${lines}E`;
		else process.stdout.write(`\x1b[${Math.abs(lines)}F`);
	}
};

/**
 * The cursorMoveColumn function moves the cursor to a specific column.
 *
 * @param {Integer} column Used to Move the cursor to a specific column.
 * @return The escape sequence that will move the cursor to a specific column.
 */
const cursorMoveColumn = (column) => {
	if (isNaN(column)) throw new Error('Value need to be filled with numbers');
	else process.stdout.write(`\x1b[${column}G`);
};

/**
 * The cursorPos function returns the current position of the cursor in a terminal.
 *
 * @return A promise that resolves to an object.
 */
const cursorPos = () => new Promise((resolve) => {
	const t = '\u001b[6n';

	process.stdin.setEncoding('utf8');
	const israw = process.stdin.isRaw;
	process.stdin.setRawMode(true);

	const readfx = function () {
		const buf = process.stdin.read();
		const str = JSON.stringify(buf); // "\u001b[9;1R"
		const regex = /\[.*/;
		const xy = regex.exec(str)?.[0].replace(/\[|R"/g, '').split(';');
		if (!xy) {
			resolve(null);
			process.stdin.setRawMode(israw);
			return;
		}
		const pos = { rows: Number(xy[0]), cols: Number(xy[1]) };
		process.stdin.setRawMode(israw);
		resolve(pos);
	};

	process.stdin.once('readable', readfx);
	process.stdout.write(t);
});

const cursorHome = () => {
	process.stdout.write('\x1b[H');
};

const cursorUpScroll = () => {
	process.stdout.write('\x1bM');
};

const DECsaveCursorPos = () => {
	process.stdout.write('\x1b7');
};

const DECrestoreCursorPos = () => {
	process.stdout.write('\x1b8');
};

const SCOsaveCursorPos = () => {
	process.stdout.write('\x1bs');
};

const SCOrestoreCursorPos = () => {
	process.stdout.write('\x1bu');
};

const cursor = {
	cursorBeg,
	/** Move the cursor home (equivalent to cursorTo(0, 0)) */
	cursorHome,
	cursorMove,
	cursorMoveColumn,
	cursorPos,
	cursorTo,
	/** Move the cursor up by line (Scrolling if needed) */
	cursorUpScroll,
	termSize,
	/** Most terminals support DEC */
	DEC: {
		/** Save the cursor position (DEC) */
		saveCursorPos: DECsaveCursorPos,
		/** Restore to the previously saved cursor position (DEC) */
		restoreCursorPos: DECrestoreCursorPos
	},
	/** Some terminals don't support SCO */
	SCO: {
		/** Save the cursor position (DEC) */
		saveCursorPos: SCOsaveCursorPos,
		/** Restore to the previously saved cursor position (DEC) */
		restoreCursorPos: SCOrestoreCursorPos
	}
};

/*

	Clear functions

*/

/**
 * Clears the terminal from the current cursor position to
 * the end of the screen.
 */
const clearToEnd = () => {
	process.stdout.write('\x1b[0J');
};

/**
 * Clears the terminal from the current cursor position to
 * the start of the screen.
 */
const clearToStart = () => {
	process.stdout.write('\x1b[1J');
};

const clearSaved = () => {
	process.stdout.write('\x1b[3J');
};

/**
 * Clears the terminal from the current cursor position to
 * the end of the current line.
 */
const clearToEOL = () => {
	process.stdout.write('\x1b[0K');
};

const clearToCur = () => {
	process.stdout.write('\x1b[1K');
};

/**
 * Clears the current line of text and returns to the start of that line if `StartOfLine` is true.
 *
 * @param startOfLine Used to Clear the line from the start of it
 */
const clearLine = (startOfLine) => {
	process.stdout.write('\x1b[2K');
	if (startOfLine === true) process.stdout.write('\r');
};

const clearScreen = () => {
	process.stdout.write('\x1b[H\x1b[0J');
};

const clear = {
	/** Clear from cursor to end of screen */
	clearToEnd,
	/** Clear from cursor to beginning of screen */
	clearToStart,
	/** Clear saved lines */
	clearSaved,
	/** Clear from cursor to end of line */
	clearToEOL,
	/** Clear from beginning of line to cursor */
	clearToCur,
	/** Clear the entire line */
	clearLine,
	/** Clear the page/screen */
	clearScreen
};

/*

	Private functions

*/

const invisibleCursor = () => {
	process.stdout.write('\x1b[?25l');
};

const visibleCursor = () => {
	process.stdout.write('\x1b[?25h');
};

const saveScreen = () => {
	process.stdout.write('\x1b[?47h');
};

const restoreScreen = () => {
	process.stdout.write('\x1b[?47l');
};

const enableAlternativeBuffer = () => {
	process.stdout.write('\x1b[?1049h');
};

const disableAlternativeBuffer = () => {
	process.stdout.write('\x1b[?1049l');
};

const priv = {
	/** Make the cursor invisible */
	invisibleCursor,
	/** Make the cursor visible */
	visibleCursor,
	/** Save the screen */
	saveScreen,
	/** Restore to the previously saved screen */
	restoreScreen,
	/** Enable the alternative buffer */
	enableAlternativeBuffer,
	/** Disable the alternative buffer */
	disableAlternativeBuffer
};

/**
 * The termtitle function sets the title of the terminal window to a given string.
 *
 *
 * @param title Used to Set the title of the terminal window.
 * @return Nothing.
 *
 */
const setTermTitle = (title) => {
	process.stdout.write(`\x1b]0;${title}\x07`);
};

const other = {
	setTermTitle,
	setMCVersion
};

module.exports = {
	/** Escape codes used to change colors */
	color,
	/** Escape codes used to change to Minecraft colors */
	MCColor,
	/** Escape codes used to control the cursor */
	cursor,
	/** Escape codes used to clear the screen */
	clear,
	/** Private modes that are not supported on some terminals */
	private: priv,
	/** Other */
	other
};
