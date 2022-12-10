const { Interface: readlineInt } = require('readline');

let rlInterface;
const setInterface = (int) => {
	rlInterface = int;
};

async function prompt (query) {
	if (!(rlInterface instanceof readlineInt)) {
		throw new Error('Invalid readline interface');
	}
	return await new Promise((resolve) => rlInterface.question(query, resolve));
}

module.exports = prompt;
module.exports.setInterface = setInterface;
