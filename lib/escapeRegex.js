function escapeRegExp (string) {
	if (typeof string !== 'string') {
		throw new Error('string must be of type string');
	}
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegExp;
