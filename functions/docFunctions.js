const camelCase = (str) => {
	return str
		.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
			return index == 0 ? word.toLowerCase() : word.toUpperCase();
		})
		.replace(/\s+/g, "");
};

const trimLineBreak = (text) => {
	const regEnd = /(\\n|\\\\n|\\t|\\\\t)+$/;
	const regStart = /(\\n|\\\\n|\\t|\\\\t)+/;
	return text.replace(regStart, "").replace(regEnd, "");
};

const noAccents = (str) => {
	return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const removeSpecialCharacterAtStart = (text) => {
	return text.replace(/[^\nA-Za-z0-9À-ÖØ-öø-ÿ]+/, "");
};
const lineBreakToHTML = (text) => {
	return text.replaceAll(/(\\n|\\\\n|\\t|\\\\t)/g, "<br/>");
};
const loopArray = (array, callback) => {
	const result = [];
	array.forEach((element) => {
		result.push(callback(element));
	});
	return result;
};
const separateText = (text, separator) => {
	if (text.indexOf(separator) === -1) {
		return CreateError(
			"Separator not found",
			`Separator ${separator} haven't found in File`
		);
	}
	return Create(
		trimLineBreak(text)
			.split(separator)
			.filter((c) => c)
			.map((n) => removeSpecialCharacterAtStart(n))
	);
};
const Create = (value, error) => {
	return {
		success: true,
		failure: false,
		value: value,
		error: error || [],
	};
};

const CreateError = (code, errorMessage) => {
	return {
		success: false,
		failure: true,
		value: null,
		error: [
			{
				code: code,
				message: errorMessage,
			},
		],
	};
};

exports.camelCase = camelCase;
exports.trimLineBreak = trimLineBreak;
exports.noAccents = noAccents;
exports.removeSpecialCharacterAtStart = removeSpecialCharacterAtStart;
exports.lineBreakToHTML = lineBreakToHTML;
exports.loopArray = loopArray;
exports.separateText = separateText;
exports.Create = Create;
exports.CreateError = CreateError;
