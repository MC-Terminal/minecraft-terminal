function parse (str) {
	return str.match(/(?<=')[^']+(?=')|(?<=")[^"]+(?=")/g) || [str];
}

module.exports = parse;
