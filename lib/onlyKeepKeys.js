const { isPlainObject } = require('merge');

function onlyKeepKeys (obj = {}, obj2 = {}, options = { shallow: false }) {
	options = Object.assign({ shallow: false }, options);
	const outObj = Object.assign({}, obj);
	const objKeys = Object.keys(outObj);
	const obj2Keys = Object.keys(obj2);
	for (let i = 0; i < objKeys.length; i++) {
		const objKey = objKeys[i];
		const areObjects = isPlainObject(outObj[objKey]) && isPlainObject(obj2[objKey]);

		if (areObjects) {
			if (options.shallow === true) {
				continue;
			}
			outObj[objKey] = onlyKeepKeys(outObj[objKey], obj2[objKey], options);
			continue;
		}

		if (obj2Keys.includes(objKey)) {
			continue;
		}

		delete outObj[objKey];
	}
	return outObj;
}

module.exports = onlyKeepKeys;
