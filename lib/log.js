const { clear: { clearLine }, color: { reset, bold, rgb, underline } } = require('easy-ansi');
// require('easy-ansi').color.BG
let chatLine;
const setSWInterface = (swint) => {
	chatLine = swint;
};

const safeWrite = (msg = '', end = 0) => {
	const line = chatLine?.line || '';
	let out;

	clearLine(true);

	switch (end) {
		case 0:
			out = msg + '\n' + line;
			break;
		case 1:
			out = msg + line;
			break;
		case 2:
			out = msg + '\n';
			break;
		default:
			out = msg;
	}

	process.stdout.write(out);
	if (end === 0 || end === 1) {
		chatLine?.prompt(true);
	}
};

const rpstr = (str, spacenum, prefix) => {
	let spaces = '';
	let out;
	if (typeof str === 'string') {
		if (prefix === undefined) prefix = '';
		for (let i = 0; i < spacenum; i++) {
			spaces = spaces + ' ';
		}
		out = str.replace(/\n/g, '\n' + prefix + spaces);
	} else out = str;

	return out;
};

const info = (str = '', end) => {
	str = str.replace(/%COLOR%/g, info.color);
	safeWrite(`${info.color}[INFO] ${rpstr(str, 7, info.color) + reset}`, end);
};
info.color = reset + bold + rgb(130, 130, 200);

const warn = (str, end) => {
	str = str.replace(/%COLOR%/g, warn.color);
	safeWrite(`${warn.color}[WARN] ${rpstr(str, 7, warn.color) + reset}`, end);
};
warn.color = reset + bold + rgb(255, 255, 85);

const error = (str, end) => {
	str = str.replace(/%COLOR%/g, error.color);
	safeWrite(`${error.color}[ERR] ${rpstr(str, 6, error.color) + reset}`, end);
};
error.color = reset + bold + rgb(255, 85, 85);

const success = (str, end) => {
	str = str.replace(/%COLOR%/g, success.color);
	safeWrite(`${success.color}[OK] ${rpstr(str, 5, success.color) + reset}`, end);
};
success.color = reset + bold + rgb(85, 255, 85);

const highLight1 = (str) => {
	return highLight1.color + str + reset;
};
highLight1.color = bold + underline + rgb(255, 85, 85);

module.exports = {
	setSWInterface,
	safeWrite,
	highLight1,
	info,
	warn,
	error,
	success
};
