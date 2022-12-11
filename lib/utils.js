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

/**
 * Converts a hexadecimal color string to an RGBA color array.
 *
 * @param {string} hex - The hexadecimal color string to convert.
 * @param {Object} options - The options object.
 * @param {number} [options.fixed=3] - The number of decimal places to fix the alpha value to.
 * @param {number[]} [options.supportedLengths=[3, 4, 6, 8]] - The supported lengths of the hexadecimal color string.
 *
 * @returns {number[]} - An array containing the red, green, blue, and alpha values of the color, with red, green, and blue in the range 0 to 255 and alpha in the range 0 to 1.
 * @throws {Error} - If the input string is not a valid hexadecimal color string.
 *
 * @example
 * hexToRgba('#fff');  // returns [255, 255, 255, 1]
 * hexToRgba('#fffa'); // returns [255, 255, 255, 0.667]
 * hexToRgba('#ffffff'); // returns [255, 255, 255, 1]
 * hexToRgba('#ffffffbc'); // returns [255, 255, 255, 0.737]
 * hexToRgba('#f00'); // returns [255, 0, 0, 1]
 * hexToRgba('#ff0000'); // returns [255, 0, 0, 1]
 * hexToRgba('#ff0000ff'); // returns [255, 0, 0, 1]
 *
 * @author chatGPT
*/
function hexToRGBA (hex, options) {
	options = Object.assign({
		fixed: 3,
		supportedLenghts: [3, 4, 6, 8]
	}, options);

	// Parse the hexadecimal color string into its component parts
	const hexColor = hex.match(/(?<=^#)[a-f\d]{3,8}$/i)?.[0];

	// If the color string is not in the correct format, return an error
	if (!hexColor || !options.supportedLenghts.includes(hexColor.length)) {
		throw new Error('Invalid hexadecimal color string');
	}

	// Extract the red, green, blue and alpha? values from the hexadecimal string
	let r, g, b, a;
	if ([3, 4].includes(hexColor.length)) {
		r = parseInt(hexColor[0] + hexColor[0], 16);
		g = parseInt(hexColor[1] + hexColor[1], 16);
		b = parseInt(hexColor[2] + hexColor[2], 16);
		a = hexColor.length === 4 ? parseInt(hexColor.slice(3, 4), 16) / 15 : 1;
	} else {
		r = parseInt(hexColor[0] + hexColor[1], 16);
		g = parseInt(hexColor[1] + hexColor[2], 16);
		b = parseInt(hexColor[2] + hexColor[3], 16);
		a = hexColor.length === 8 ? parseInt(hexColor.slice(6, 8), 16) / 255 : 1;
	}

	// Fix a to options.fixed if it's a number
	if (!isNaN(options.fixed) && options.fixed !== null) {
		a = parseFloat(a.toFixed(options.fixed));
	}

	// Return an RGBA color array
	return [r, g, b, a];
}

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

module.exports = {
	toLowerCaseArr,
	matchEq,
	parseVar,
	parseStr,
	hexToRGBA
};
