const express = require("express");
const serverless = require("serverless-http");
const WordExtractor = require("word-extractor");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { text } = require("body-parser");
const {
	camelCase,
	trimLineBreak,
	noAccents,
	removeSpecialCharacterAtStart,
	lineBreakToHTML,
	loopArray,
	separateText,
	Create,
	CreateError,
} = require("./docFunctions");

const app = express();
const router = express.Router();
const extractor = new WordExtractor();
// Add headers before the routes are defined
app.use(function (req, res, next) {
	// Website you wish to allow to connect
	res.setHeader("Access-Control-Allow-Origin", "*");

	// Request methods you wish to allow
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, OPTIONS, PUT, PATCH, DELETE"
	);

	// Request headers you wish to allow
	res.setHeader(
		"Access-Control-Allow-Headers",
		"X-Requested-With,content-type"
	);

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader("Access-Control-Allow-Credentials", true);

	// Pass to next layer of middleware
	next();
});

router.get("/api/", (req, res) => {
	res.json({ hello: "hola mundo!" });
});

const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/uploadDocx", upload.single("image"), async (req, res, next) => {
	try {
		const request = JSON.parse(req.body.request);
		const file = Uint8Array.prototype.slice.call(req.file.buffer);
		const extracted = extractor.extract(file);
		extracted
			.then(function (doc) {
				const parts = formatting(
					request,
					JSON.stringify(doc.getBody())
				);
				const document = {
					sections: parts.value,
					error: parts.error,
					// body: JSON.stringify(doc.getBody()),
					// header: JSON.stringify(doc.getHeaders()),
					// footer: JSON.stringify(doc.getFooters()),
				};
				return res.status(200).json(document);
			})
			.catch((error) => {
				return res.status(500).json({ message: "error", error: error });
			});
	} catch (error) {
		return res.status(500).json({ message: "error", error: error });
	}
});

app.use("/", router);

module.exports.handler = serverless(app);

const formatting = ({ keyWords }, doc) => {
	const response = [];
	const errorList = [];

	for (let i = 0; i < keyWords.length; i++) {
		const keyItem = keyWords[i];
		const nextKeyItem = keyWords[i + 1];
		const prop = camelCase(noAccents(keyItem.keySeparator)).replace(
			" ",
			""
		);
		let content = {};

		if (doc.indexOf(keyItem.keySeparator) == -1) {
			errorList.push({
				code: "Separator not found",
				message: `Separator ${keyItem.keySeparator} haven't found in File`,
			});
		}

		if (nextKeyItem != undefined) {
			content = doc
				.substring(
					doc.indexOf(keyItem.keySeparator) +
						keyItem.keySeparator.length,
					doc.indexOf(nextKeyItem.keySeparator)
				)
				.trim();
		} else {
			content = doc
				.substring(
					doc.indexOf(keyItem.keySeparator) +
						keyItem.keySeparator.length,
					doc.length - 1
				)
				.trim();
		}
		const responseToHtml = toHTML(keyItem.type, content);
		if (
			Array.isArray(responseToHtml.error) &&
			responseToHtml.error.length > 0
		) {
			errorList.push(...responseToHtml.error);
		}
		const object = {
			keySeparator: keyItem.keySeparator,
			title: keyItem.title,
			contentHTML: responseToHtml.value,
		};

		response.push(object);
	}

	return Create(response, errorList);
};

const toHTML = (type, text) => {
	return formattingContentByType(type, text);
};
const formattingContentByType = (type, text) => {
	switch (type.value) {
		case "skills":
			return Create({
				type: type.value,
				content: formattingToSkill(text),
			});
		case "profile":
			return Create({
				type: type.value,
				content: formattingToProfile(text),
			});
		case "education": {
			const textSeparated = separateText(text, type.separator);
			return Create(
				{
					type: type.value,
					content: loopArray(
						textSeparated.success ? textSeparated.value : [],
						itemEducation
					),
				},
				textSeparated.error
			);
		}
		case "profesional-experience": {
			const textSeparated = separateText(text, type.separator);
			return Create(
				{
					type: type.value,
					content: loopArray(
						textSeparated.success ? textSeparated.value : [],
						itemProfExp
					),
				},
				textSeparated.error
			);
		}
		default:
			return Create({
				type: type.value,
				content: formattingToProfile(text),
			});
	}
};

const formattingToSkill = (text) => {
	const textArray = trimLineBreak(text).replaceAll("\\t", "").split("\\n");
	const response = [];
	for (let i = 0; i < textArray.length; i++) {
		const element = textArray[i];
		if (/[a-zA-Z0-9]/g.test(element)) {
			response.push(itemSkill(element));
		}
	}
	return response;
};
const formattingToProfile = (text) => {
	const profile = {
		body: lineBreakToHTML(trimLineBreak(text)),
	};
	return profile;
};

const itemEducation = (text) => {
	const splited = text.split(/\\n/);
	return {
		level: splited[0] || "",
		schoolName: splited[1] || "",
		date: splited[2] || "",
	};
};

const itemProfExp = (text) => {
	const splited = text.split(/\\n/);
	return {
		employer: splited[0] || "",
		date: splited[1] || "",
		jobTitle: splited[2] || "",
		body: lineBreakToHTML(splited.slice(3).join("\\n")),
	};
};

const itemSkill = (text) => {
	const splitSkill = text.split("-");
	return {
		skillName: (splitSkill[0] || "").trim(),
		level: (splitSkill[1] || "").trim(),
	};
};
