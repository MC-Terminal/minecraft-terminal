const { editObj } = require('./editfile');
const { isPlainObject, recursive: MergeRecursive } = require('merge');

module.exports = (obj1, obj2, options = { mutate: false }) => {
	let objOut;
	if (options.mutate === true) {
		objOut = obj1;
	} else {
		let toCopyTo;
		if (isPlainObject(obj1)) {
			toCopyTo = {};
		} else {
			toCopyTo = [];
		}
		objOut = Object.assign(toCopyTo, obj1);
	}
	return editObj(obj2, (data) => {
		if (isPlainObject(data)) {
			objOut = MergeRecursive(!options.mutate, objOut, data);
		} else {
			objOut = [...objOut, ...data];
		}
		return objOut;
	});
};
