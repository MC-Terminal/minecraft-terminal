function compare (ver1, ver2) {
	if (!(typeof ver1 === 'string') || !(typeof ver2 === 'string')) {
		throw new Error('ver1 and ver2 must be of type string');
	}

	const splitVer1 = ver1.split('.');
	const splitVer2 = ver2.split('.');
	const maxLength = Math.max(splitVer1.length, splitVer2.length);
	for (let i = 0; i < maxLength; i++) {
		const num1 = Number(splitVer1[i]) || 0;
		const num2 = Number(splitVer2[i]) || 0;
		if (num1 > num2) {
			return i + 1;
		} else if (num1 < num2) {
			return -(i + 1);
		}
	}
	return 0;
}

module.exports = compare;
