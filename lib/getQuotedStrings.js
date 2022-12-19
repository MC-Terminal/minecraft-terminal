function getQuotedStrings (str) {
	return str.match(/(?<=')[^']+(?=')|(?<=")[^"]+(?=")|[^\s'"]+/g);
}

module.exports = getQuotedStrings;
