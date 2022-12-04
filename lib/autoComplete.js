const ansi = require('./ansi');
let rlInterface;

function getCompletion (rlInterface, completionsObj, minLength = 1, startOnly = false, caseInsensitive = false) {
	let nestedCompletionsObj = completionsObj;
	let wordsToBeCompleted = Object.keys(nestedCompletionsObj);

	const inputWords = rlInterface.line.match(/\S+\s+$|\S+/g) || [];
	const lastWordLength = inputWords[inputWords.length - 1]?.length || 0;
	if (lastWordLength < minLength) {
		return null;
	}

	let doesMatch;
	let match;
	for (let a = 0; a < inputWords.length; a++) {
		const word = inputWords[a];
		// Check if the start of the word matches the start of a value in wordsToBeCompleted
		doesMatch = false;
		for (let b = 0; b < wordsToBeCompleted.length; b++) {
			const value = wordsToBeCompleted[b];
			if ((caseInsensitive && word.toLowerCase() === value.slice(0, word.length).toLowerCase()) || (word === value.slice(0, word.length))) {
				match = value;
				doesMatch = true;
				break;
			}
		}

		if (doesMatch === true) {
			if (!nestedCompletionsObj[match]) {
				console.log(doesMatch);
				return null;
			}
			nestedCompletionsObj = nestedCompletionsObj[match];
			wordsToBeCompleted = Object.keys(nestedCompletionsObj);
			continue;
		}
		if (startOnly === true) {
			return null;
		}
	}
	if (doesMatch === true) {
		const completed = match.slice(lastWordLength);
		return [completed, match];
	}

	return null;
}

let oldInput = '';
/**
 * Suggest autocompletion
 *
 * @param rlInterface ReadLine interface
 * @param completionsObj Used to Store the possible completions
 * @param minLength Minimum length for a word to autocomplete.
 * @return An array of strings.
 */
function suggestCompletion (completionsObj, minLength = 1, startOnly = false, caseInsensitive = false, completionPrefix = '', completionSuffix = '') {
	let oldNewDiffIndex = 0;
	for (; oldNewDiffIndex < oldInput.length; oldNewDiffIndex++) {
		if (oldInput[oldNewDiffIndex] !== rlInterface.line[oldNewDiffIndex]) {
			break;
		}
	}
	oldInput = rlInterface.line;
	oldNewDiffIndex++;

	const match = getCompletion(rlInterface, completionsObj, minLength, startOnly, caseInsensitive)?.[0];
	if (match) {
		// What even is this
		let rest = '';
		if (oldNewDiffIndex !== 1) {
			rest = rlInterface.line.slice(oldNewDiffIndex);
		}
		const completed = match.slice(rlInterface.line.match(/\S+\s+$/)?.[0].length);
		process.stdout.write(rest + completionPrefix + completed + completionSuffix);

		ansi.cursor.cursorMove(0, -(completed.length + rest.length));

		return completed;
	} else {
		rlInterface.prompt(true);
		return false;
	}
}

const autoCompleting = false;
function autoComplete (completionsObj, minLength = 1, caseInsensitive = false, startOnly = false, completionPrefix = '', completionSuffix = '') {
	if (autoCompleting === true) {
		return;
	}

	process.stdin.on('data', (data) => {
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
				if (caseInsensitive === true) {
					const str = rlInterface.line.match(/\S+$/)?.[0];
					if (str) {
						rlInterface.line = rlInterface.line.replace(str, str.toLowerCase());
					}
				}
				const toComplete = getCompletion(rlInterface, completionsObj, 0, caseInsensitive);
				if (toComplete) {
					rlInterface.write(toComplete[0]);
				}
			}
		}
		rlInterface.prompt(true);

		if (rlInterface.line.length === rlInterface.cursor) {
			suggestCompletion(completionsObj, minLength, startOnly, caseInsensitive, completionPrefix, completionSuffix);
		}
	});
}

function arrayToCompletions (arr, filterArr = []) {
	const out = {};
	for (let i = 0; i < arr.length; i++) {
		const element = arr[i];
		if (!filterArr.includes(element)) {
			out[element] = {};
		}
	}
	return out;
}

function setup (readlineInterface) {
	rlInterface = readlineInterface;
}

module.exports = autoComplete;

module.exports.getCompletion = getCompletion;
module.exports.suggestCompletion = suggestCompletion;
module.exports.arrayToCompletions = arrayToCompletions;
module.exports.setup = setup;
