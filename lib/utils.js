const logicExp = require('./logicExp');

const escapeRegex = require('./escapeRegex');

/**
 * The parseVar function takes a string and replaces all instances of variables with their values.
 * Variables are defined as strings that start with the varPrefix option and end with the varSuffix option.
 * The default options for these are '%' for both, so an example variable would be %variable%.
 * If you want to use a different prefix or suffix, you can change them in the options object passed into parseVar.
 *
 * @example parseVar('Hello %name%!', { name: 'Bob' }, { varPrefix: '%', varSuffix: '%' }) // Returns "Hello Bob!";,
 * @param {string} str The string to be parsed.
 * @param {object} variablesObj The variables in the string.
 * @param {object} [options]
 * @param {string} [options.varPrefix]
 * @param {string} [options.varSuffix]
 * @param {string} [options.undefinedVar] String to replace all undefined variables
 * @return A string with the variables parsed.
 */
function parseVar (str, variablesObj, options) {
	options = Object.assign({
		varPrefix: '%',
		varSuffix: '%',
		undefinedVar: 'undefined'
	}, options);

	if (typeof str !== 'string') {
		throw new Error('str must be of type string');
	}
	if (typeof options.varSuffix !== 'string') {
		throw new Error('options.varSuffix must be of type string');
	}
	if (typeof options.varPrefix !== 'string') {
		throw new Error('options.varPrefix must be of type string');
	}
	if (typeof options.undefinedVar !== 'string') {
		throw new Error('options.undefinedVar must be of type string');
	}

	// Parse the variables
	const varPrefixRegex = escapeRegex(options.varPrefix);
	const varSuffixRegex = escapeRegex(options.varSuffix);
	let out = str.valueOf();
	Object.keys(variablesObj).forEach((value) => {
		out = out.replace(new RegExp(varPrefixRegex + escapeRegex(value) + varSuffixRegex, 'g'), variablesObj[value]);
	});

	// Replaces everything else that isn't inside the variablesObj with undefinedVar
	out = out.replace(new RegExp(`${varPrefixRegex}[^${varSuffixRegex}]+${varSuffixRegex}`, 'g'), options.undefinedVar);
	return out;
}

const parseStr = {};

/**
 * Takes a string and returns the appropriate JavaScript type.
 * @param {string} str The string to be parsed
 * @return {string | number | boolean | null | undefined} A string, number, boolean, null or undefined.
 */
parseStr.parse = (str, caseSensitive = true) => {
	if (!isNaN(str) && str.match(/^[\d.]+$/)) {
		return Number(str);
	}

	// If the string only contains whitespaces return an empty string
	if (str.match(/^\s+$/)) {
		return '';
	}

	let out = str.valueOf();
	if (caseSensitive === false) {
		out = out.toLowerCase();
	}

	if (out === 'false') {
		return false;
	}
	if (out === 'true') {
		return true;
	}
	if (out === 'null') {
		return null;
	}
	if (out === 'undefined') {
		return undefined;
	}

	return out;
};

/**
 * The parseArr function takes an array of strings and returns an array of objects.
 *
 * @param {string[]} strArr Used to Pass in an array of strings.
 * @param {boolean} [options.caseSensitive] Used to Set the default value of casesensitive to true.
 * @return An array of objects.
 */
parseStr.parseArr = (strArr, options = { caseSensitive: true }) => {
	const out = [];

	let a = 0;
	strArr.forEach((value, index) => {
		out[a++] = parseStr.parse(strArr[index], options.caseSensitive);
	});

	return out;
};

function toLowerCaseArr (arr) {
	const out = [];
	for (let i = 0; i < arr.length; i++) {
		const element = arr[i];
		out[i] = element.toLowerCase?.() || element;
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

function shallowCompareObj (obj1 = {}, obj2 = {}) {
	const { isPlainObject } = require('merge');

	if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
		return obj1 === obj2;
	}
	const plainObj = isPlainObject(obj1);
	if (plainObj !== isPlainObject(obj2)) {
		return false;
	}

	if (plainObj) {
		const obj1Keys = Object.keys(obj1);
		for (let i = 0; i < obj1Keys.length; i++) {
			const key = obj1Keys[i];
			const obj1Val = obj1[key];
			const obj2Val = obj2[key];
			if ((obj1Val !== obj2Val) && (!['object', 'function'].includes(typeof obj1Val) || !['object', 'function'].includes(typeof obj2Val))) {
				return false;
			}
		}
		return true;
	}

	if (obj1.length !== obj2.length) {
		return false;
	}

	for (let i = 0; i < obj1.length; i++) {
		const obj1Val = obj1[i];
		const obj2Val = obj2[i];
		if ((obj1Val !== obj2Val) && (!['object', 'function'].includes(typeof obj1Val) || !['object', 'function'].includes(typeof obj2Val))) {
			return false;
		}
	}
	return true;
}

function includes (arr, val) {
	for (const arrVal of arr) {
		if (shallowCompareObj(arrVal, val) === true) {
			return true;
		}
	}
	return false;
}

module.exports = {
	toLowerCaseArr,
	shallowCompareObj,
	includes,
	matchEq,
	parseVar,
	parseStr
};
