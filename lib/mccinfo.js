const { clear: { clearLine }, color: { dim, reset, bold, rgb } } = require('./ansi');
let chatLine;
const setSWInterface = (swint) => {
	chatLine = swint;
};

const safeWrite = (msg, end) => {
	if (!msg) msg = '';
	let line;
	if (chatLine === undefined) line = '';
	else line = chatLine.line;
	clearLine(true);
	if (end === 1) process.stdout.write(`${msg}\n${line}`);
	else if (end === 0 || end === undefined) process.stdout.write(`${msg}\n>${line}`);
	else if (end === 2) process.stdout.write(msg + line);
};

const rpstr = (str, spacenum) => {
	let spaces = '';
	for (let i = 0; i < spacenum; i++) {
		spaces = spaces + ' ';
	}
	return str.replace(/\n/g, '\n' + spaces);
};

const info = (str, end) => {
	safeWrite(`${dim}[INFO] ${rpstr(str, 7) + reset}`, end);
};

const warn = (str, end) => {
	safeWrite(`${bold + rgb(255, 255, 85)}[WARN] ${rpstr(str, 7) + reset}`, end);
};

const error = (str, end) => {
	safeWrite(`${bold + rgb(255, 85, 85)}[ERROR] ${rpstr(str, 8) + reset}`, end);
};

module.exports = {
	setSWInterface,
	safeWrite,
	info,
	warn,
	error
};