function getQuotes (str) {
	return str.match(/(?<=')[^']+(?=')|(?<=")[^"]+(?=")/g);
}

module.exports = getQuotes;
