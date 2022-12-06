const parse = (str) => {
	if (!isNaN(str) && !str.match(/[^\d.]/)) {
		return Number(str);
	}
	if (str.match(/^\s+$/)) {
		return '';
	}
	switch (str) {
	case 'false': return false;
	case 'true': return true;
	case 'null': return null;
	case 'undefined': return undefined;
	default: return str;
	}
};

const parseStr = (str) => {
	if (typeof str === 'object') {
		const out = [];
		for (let a = 0; a < str.length; a++) {
			out[a] = parse(str[a]);
		}
		return out;
	} else if (typeof str === 'string') {
		return parse(str);
	} else return str;
};

module.exports = parseStr;
