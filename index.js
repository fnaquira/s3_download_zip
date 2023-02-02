require("dotenv").config();

const express = require("express");
const app = express();
const logger = require("morgan");
const bodyParser = require("body-parser");

const checkSize = require("./lib/checkSize");
const downloadFiles = require("./lib/downloadFiles");
const downloadQueue = require("./queue/index");

logger.token("remote-addr", function (req) {
	return req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
});
app.set("trust proxy", 1);
app.use(logger(":method :remote-addr :url :status :response-time"));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));

app.get("/", function (req, res) {
	res.send("Hello download");
});

app.post("/", async function (req, res) {
	const { name: fileName, files, email } = req.body;

	if (!email) {
		return res.status(500).json({ message: "Debe solicitar un correo por si el proceso demora demasiado" });
	}
	if (!files) {
		return res.status(500).json({ message: "Debe solicitar archivos para descargar" });
	}
	if (typeof files !== "object") {
		return res.status(500).json({ message: "El campo files debe ser un array" });
	}
	if (!Array.isArray(files)) {
		return res.status(500).json({ message: "El campo files debe ser un array" });
	}
	if (files.length === 0) {
		return res.status(500).json({ message: "El campo files debe contener al menos un elemento a descargar" });
	}
	if (!files.every((it) => typeof it === "string")) {
		return res.status(500).json({ message: "El campo files debe contener rutas a descargar" });
	}
	if (!files.every((it) => it !== "")) {
		return res.status(500).json({ message: "El campo files debe contener rutas válidas a descargar" });
	}

	const result = await checkSize(files);
	if (result < 10 * 1024 * 1024) {
		//if (result < 10 * 1024) {
		downloadFiles(fileName, files, res);
	} else {
		downloadQueue.add({
			files,
			fileName,
			email,
		});
		res.json({
			message: `Le enviaremos un correo a ${email} cuando su enlace de descarga esté listo`,
			totalFiles: files.length,
			estimated: result + " bytes",
		});
	}
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log("Server listening on port " + port);
});
