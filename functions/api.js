const express = require("express");
const serverless = require("serverless-http");
const WordExtractor = require("word-extractor");
// const camelCase = require("camelcase");

const app = express();
const router = express.Router();
const extractor = new WordExtractor();
router.get("/", (req, res) => {
	res.json({ hello: "asd" });
});
router.get("/json", (req, res) => {
	const extracted = extractor.extract("./functions/CV_Qualtop.docx");
	const keyWords = [
		"Resumen",
		"Experiencia Profesional",
		"Educación",
		"Cursos y Certificaciones",
		"Conocimientos",
	];
	extracted.then(function (doc) {
		const r = extract(keyWords, JSON.stringify(doc.getBody()));
		const document = {
			body: JSON.stringify(doc.getBody()),
			header: JSON.stringify(doc.getHeaders()),
			footer: JSON.stringify(doc.getFooters()),
			sections: r,
		};
		// const resume = document.body.substring(
		// 	document.body.indexOf("Resumen") + "Resumen".length,
		// 	document.body.indexOf("Experiencia Profesional")
		// );
		// console.log(resume.replaceAll("\\n", "<br/>"));

		res.json(document);
	});
});

app.use("/", router);

// app.listen(port, () => console.log("running"));
module.exports.handler = serverless(app);

const extract = (keyWords, doc) => {
	const response = { keyWords: [] };
	for (let i = 0; i < keyWords.length; i++) {
		const prop = toNormalForm(keyWords[i]);
		let content = {};

		if (keyWords[i + 1] != undefined) {
			content = doc
				.substring(
					doc.indexOf(keyWords[i]) + keyWords[i].length,
					doc.indexOf(keyWords[i + 1])
				)
				.trim();
		} else {
			content = doc
				.substring(
					doc.indexOf(keyWords[i]) + keyWords[i].length,
					doc.length
				)
				.trim();
		}

		response.keyWords.push({
			title: keyWords[i],
			name: prop,
			content: content,
		});
	}

	return response;
};

const toNormalForm = (str) => {
	return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};
