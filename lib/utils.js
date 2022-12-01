const logicExp = require('./logicExp');

function toLowerCaseArr (arr) {
	const out = [];
	for (let i = 0; i < arr.length; i++) {
		out[i] = arr[i].toLowerCase();
	}
	return out;
}

function matchEq (str, valObj) {
	let strCopy = String(str.valueOf());
	const matches = str?.split?.(/[&|]/);
	for (let i = 0; i < matches?.length; i++) {
		const mat = matches[i];
		const op = mat.match(/=|!=/)?.[0];
		let bef = mat.match(new RegExp(`^[^${op}]+(?=${op})`))?.[0];
		let af = mat.match(new RegExp(`(?<=${op})[^${op}]+`))?.[0];

		if (bef.charAt(0) === '$') {
			bef = valObj[bef.slice(1)];
		}
		if (af.charAt(0) === '$') {
			af = valObj[af.slice(1)];
		}

		let out = true;

		// eslint-disable-next-line eqeqeq
		if (op === '=' && bef?.toLowerCase?.() != af?.toLowerCase?.()) {
			out = false;
			// eslint-disable-next-line eqeqeq
		} else if (op === '!=' && bef?.toLowerCase?.() == af?.toLowerCase?.()) {
			out = false;
		}

		strCopy = strCopy.replace(mat, out);
	}
	return logicExp(strCopy, null, true);
}

module.exports = {
	toLowerCaseArr,
	matchEq
};
