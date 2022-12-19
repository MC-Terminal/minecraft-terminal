const ansi = require('./ansi');
let rlInterface;

function getCompletion (rlInterface, completionsObj, options = {}) {
	const inputWords = rlInterface.line.match(/\S+\s+$|\S+/g) || [];
	const lastWordLength = inputWords[inputWords.length - 1]?.length || 0;

	options = Object.assign({
		minLength: 1,
		startOnly: false,
		caseInsensitive: false
	}, options);

	if (lastWordLength < options.minLength) {
		return null;
	}

	let nestedCompletionsObj = completionsObj;
	let wordsToBeCompleted = Object.keys(nestedCompletionsObj);

	let match = null;
	for (let word of inputWords) {
		if (options.caseInsensitive) {
			word = word.toLowerCase();
		}

		for (let value of wordsToBeCompleted) {
			if (options.caseInsensitive) {
				value = value.toLowerCase();
			}

			if (word === value.slice(0, word.length)) {
				match = value;
				break;
			}
		}

		if (!match) {
			if (options.startOnly) {
				return null;
			}
			continue;
		}

		if (!nestedCompletionsObj[match]) {
			return null;
		}

		nestedCompletionsObj = nestedCompletionsObj[match];
		wordsToBeCompleted = Object.keys(nestedCompletionsObj);
	}

	// I don't think this one is needed
	if (!match) {
		return null;
	}

	const completed = match.slice(lastWordLength);
	return [completed, match];
}

let oldInput = '';
/**
* Suggest autocompletion
*
* @param rlInterface ReadLine interface
* @param completionsObj Used to Store the possible completions
* @param options.minLength Minimum length for a word to autocomplete.
* @return An array of strings.
*/
function suggestCompletion (completionsObj, options = { minLength: 1, startOnly: false, caseInsensitive: false, completionPrefix: '', completionSuffix: '' }) {
	let oldNewDiffIndex = 0;
	for (; oldNewDiffIndex < oldInput.length; oldNewDiffIndex++) {
		if (oldInput[oldNewDiffIndex] !== rlInterface.line[oldNewDiffIndex]) {
			break;
		}
	}
	oldInput = rlInterface.line;
	oldNewDiffIndex++;

	const match = getCompletion(rlInterface, completionsObj, options)?.[0];
	if (match) {
		// What even is this
		let rest = '';
		if (oldNewDiffIndex !== 1) {
			rest = rlInterface.line.slice(oldNewDiffIndex);
		}
		const completed = match.slice(rlInterface.line.match(/\S+\s+$/)?.[0].length);
		process.stdout.write(rest + options.completionPrefix + completed + options.completionSuffix);

		ansi.cursor.cursorMove(0, -(completed.length + rest.length));

		return completed;
	} else {
		rlInterface.prompt(true);
		return false;
	}
}

function autoCompleteonData (data, autoCompleteOpts) {
	if (data.toString() === '\t') {
		// Sometimes holding tab or pressing it too fast makes this not work
		rlInterface.write(null, {
			sequence: '\x7F',
			name: 'backspace',
			ctrl: false,
			meta: false,
			shift: false
		});

		// Workaround
		rlInterface.line = rlInterface.line.replace(/\t/g, '');

		if (rlInterface.line.length === rlInterface.cursor) {
			if (autoCompleteOpts.options.caseInsensitive === true) {
				const str = rlInterface.line.match(/\S+$/)?.[0];
				if (str) {
					rlInterface.line = rlInterface.line.replace(str, str.toLowerCase());
				}
			}
			const toComplete = getCompletion(rlInterface, autoCompleteOpts.completionsObj, autoCompleteOpts.options);
			if (toComplete) {
				rlInterface.write(toComplete[0]);
			}
		}
	}
	rlInterface.prompt(true);

	if (rlInterface.line.length === rlInterface.cursor) {
		suggestCompletion(autoCompleteOpts.completionsObj, autoCompleteOpts.options);
	}
}

const autoCompleting = false;
let autoCompleteOpts;
function autoComplete (completionsObj, options = { minLength: 1, startOnly: false, caseInsensitive: false, completionPrefix: '', completionSuffix: '' }) {
	if (autoCompleting === true) {
		return;
	}
	autoCompleteOpts = {
		completionsObj,
		options
	};

	process.stdin.on('data', (data) => autoCompleteonData(data, autoCompleteOpts));
}

function arrayToCompletions (arr, filterArr = []) {
	const filteredArr = arr.filter(el => !filterArr.includes(el));
	return Object.fromEntries(filteredArr.map(el => [el, {}]));
}

function setup (readlineInterface) {
	rlInterface = readlineInterface;
}

function stop () {
	process.stdin.on('data', (data) => autoCompleteonData(data, autoCompleteOpts));
}

module.exports = autoComplete;

module.exports.getCompletion = getCompletion;
module.exports.suggestCompletion = suggestCompletion;
module.exports.arrayToCompletions = arrayToCompletions;
module.exports.setup = setup;
module.exports.stop = stop;
