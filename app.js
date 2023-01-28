import camelCase from "camelcase";
import express from "express";

import WordExtractor from "word-extractor";

import fs from "fs";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const extractor = new WordExtractor();

var app = express();
app.listen(3000);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", function (req, res) {
	const extracted = extractor.extract(
		"C:\\Users\\Mannlex Murillo\\Documents\\CV_Qualtop.docx"
	);
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

app.get("/docxtemplater", function (req, res) {
	const content = fs.readFileSync(
		"C:\\Users\\Mannlex Murillo\\Documents\\CV_Qualtop.docx",
		"binary"
	);
	const zip = new PizZip(content);
	const docs = new Docxtemplater().loadZip(zip);
	console.log(docs.getFullText());
	res.json({ doc: docs.getFullText(), other: getParagraphs(content) });
});

const extract = (keyWords, doc) => {
	const response = { keyWords: [] };
	for (let i = 0; i < keyWords.length; i++) {
		const prop = toNormalForm(camelCase(keyWords[i]));
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

const str2xml = (str) => {
	if (str.charCodeAt(0) === 65279) {
		// BOM sequence
		str = str.substr(1);
	}
	return new DOMParser().parseFromString(str, "text/xml");
};

const getParagraphs = (content) => {
	const zip = new PizZip(content);
	const xml = str2xml(zip.files["word/document.xml"].asText());
	const paragraphsXml = xml.getElementsByTagName("w:p");
	const paragraphs = [];

	for (let i = 0, len = paragraphsXml.length; i < len; i++) {
		let fullText = "";
		const textsXml = paragraphsXml[i].getElementsByTagName("w:t");
		for (let j = 0, len2 = textsXml.length; j < len2; j++) {
			const textXml = textsXml[j];
			if (textXml.childNodes) {
				fullText += textXml.childNodes[0].nodeValue;
			}
		}

		paragraphs.push(fullText);
	}
	return paragraphs;
};

// module.exports = app;
