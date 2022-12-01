function toLowerCaseArr (arr) {
	const out = [];
	for (let i = 0; i < arr.length; i++) {
		out[i] = arr[i].toLowerCase();
	}
	return out;
}

module.exports = {
	toLowerCaseArr
};
