function getQuotedStrings (str) {
	let out = [];
	let substr = str.valueOf();

	for (let a = 0; a < substr.length; a++) {
		const match = substr.match(/(?<=")[^"]+(?=")|[^\s"]+/);
		substr = substr.slice(match.index + match[0].length + 1);
		out[a] = match[0];
	}

	return out;
}

module.exports = getQuotedStrings;
