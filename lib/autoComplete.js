const ansi = require('./ansi');
const { toLowerCaseArr } = require('./utils');
let rlInterface;

function getCompletion (rlInterface, completionsObj, minLength = 1, caseInsensitive = false) {
	let nestedCompletionsObj = completionsObj;
	let wordsToBeCompleted = Object.keys(nestedCompletionsObj);

	let input = rlInterface.line;

	if (caseInsensitive === true) {
		wordsToBeCompleted = toLowerCaseArr(wordsToBeCompleted);
	}

	if (caseInsensitive === true) {
		input = input.toLowerCase();
	}

	const inputWords = input.match(/\S+\s+$|\S+/g) || [];
	const lastWordLength = inputWords[inputWords.length - 1]?.length || 0;
	if (lastWordLength < minLength) {
		return null;
	}

	let doesMatch = false;
	let match;
	for (let a = 0; a < inputWords.length; a++) {
		const previousWord = inputWords[a];
		// Check if the start of the word matches the start of a value in wordsToBeCompleted
		for (let b = 0; b < wordsToBeCompleted.length; b++) {
			const value = wordsToBeCompleted[b];
			if (previousWord === value.slice(0, previousWord.length)) {
				match = value;
				doesMatch = true;
				break;
			} else {
				doesMatch = false;
			}
		}

		if (doesMatch === true) {
			if (!nestedCompletionsObj[match]) {
				return null;
			}
			nestedCompletionsObj = nestedCompletionsObj[match];
			wordsToBeCompleted = Object.keys(nestedCompletionsObj);
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
function suggestCompletion (completionsObj, minLength = 1, caseInsensitive = false, completionPrefix = '', completionSuffix = '') {
	let oldNewDiffIndex = 0;
	for (; oldNewDiffIndex < oldInput.length; oldNewDiffIndex++) {
		if (oldInput[oldNewDiffIndex] !== rlInterface.line[oldNewDiffIndex]) {
			break;
		}
	}
	oldInput = rlInterface.line;
	oldNewDiffIndex++;

	const match = getCompletion(rlInterface, completionsObj, minLength, caseInsensitive)?.[0];
	if (match) {
		// What even is this
		let change = oldNewDiffIndex - rlInterface.line.length;
		const rest = rlInterface.line.slice(oldNewDiffIndex);
		if (change >= 0) {
			change = 0;
		}
		const completed = match.slice(rlInterface.line.match(/\S+\s+$/)?.[0].length);
		process.stdout.write(rest + completionPrefix + completed + completionSuffix);

		ansi.cursor.cursorMove(0, -completed.length - rest.length);

		return completed;
	} else {
		rlInterface.prompt(true);
		return false;
	}
}

const autoCompleting = false;
function autoComplete (completionsObj, minLength = 1, caseInsensitive = false, completionPrefix = '', completionSuffix = '') {
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
			suggestCompletion(completionsObj, minLength, caseInsensitive, completionPrefix, completionSuffix);
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
