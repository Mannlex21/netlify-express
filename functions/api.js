const express = require("express");
const serverless = require("serverless-http");
const WordExtractor = require("word-extractor");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const router = express.Router();
const extractor = new WordExtractor();

router.get("/", (req, res) => {
	res.json({ hello: "hola mundo!" });
});

const upload = multer({ storage: multer.memoryStorage() });

app.post("/uploadDocx", upload.single("image"), async (req, res, next) => {
	try {
		const keyWords = [
			"Resumen",
			"Experiencia Profesional",
			"Educación",
			"Cursos y Certificaciones",
			"Conocimientos",
		];
		const file = Uint8Array.prototype.slice.call(req.file.buffer);
		const extracted = extractor.extract(file);
		extracted
			.then(function (doc) {
				const parts = formatting(
					keyWords,
					JSON.stringify(doc.getBody())
				);
				const document = {
					sections: parts,
					body: JSON.stringify(doc.getBody()),
					header: JSON.stringify(doc.getHeaders()),
					footer: JSON.stringify(doc.getFooters()),
				};
				// // console.log(resume.replaceAll("\\n", "<br/>"));
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

const formatting = (keyWords, doc) => {
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
