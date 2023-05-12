require("dotenv").config();

const express = require("express");
const app = express();
const logger = require("morgan");
const bodyParser = require("body-parser");

const checkSize = require("./lib/checkSize");
const checkFolder = require("./lib/checkFolder");
const downloadFiles = require("./lib/downloadFiles");
const downloadFolder = require("./lib/downloadFolder");
const queueFiles = require("./queue/queueFiles");
const queueFolder = require("./queue/queueFolder");

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

app.post("/", async function (req, res, next) {
	try {
		const { name: fileName, files, folder, email } = req.body;

		if (!email) {
			return next("Debe solicitar un correo por si el proceso demora demasiado");
		}
		if (!files && !folder) {
			return next("Debe solicitar archivos para descargar");
		}
		if (folder) {
			if (typeof folder !== "string") {
				return next("El campo folder debe ser un string");
			}
			if (folder === "") {
				return next("El campo folder debe ser un string válido");
			}
			let isQueueable = false;

			const [result, totalFiles] = await checkFolder(folder);
			console.log(`Folder ${folder} pesa ${result} bytes con ${totalFiles} archivos`);
			/* Si la descarga pesará más de 10 megas, se procede a enviar a cola de email */
			if (result > 10 * 1024 * 1024) {
				isQueueable = true;
			}
			/* Si la descarga contiene más de 200 archivos, se procede a enviar a cola de email */
			if (totalFiles >= 200) {
				isQueueable = true;
			}

			if (isQueueable) {
				console.log("quiere");
				queueFolder.add({
					folder,
					fileName,
					email,
				});
				res.json({
					message: `Le enviaremos un correo a ${email} cuando su enlace de descarga esté listo`,
					folder: folder,
					estimated: result + " bytes",
				});
			} else {
				console.log("directo");
				downloadFolder(fileName, folder, res);
			}
		} else if (files) {
			if (typeof files !== "object") {
				return next("El campo files debe ser un array");
			}
			if (!Array.isArray(files)) {
				return next("El campo files debe ser un array");
			}
			if (files.length === 0) {
				return next("El campo files debe contener al menos un elemento a descargar");
			}
			if (!files.every((it) => typeof it === "string")) {
				if (files.every((it) => typeof it.path === "string")) {
					//return next("El campo files debe contener rutas a descargar");
				} else return next("El campo files debe contener rutas a descargar");
			}
			if (!files.every((it) => it !== "")) {
				if (files.every((it) => it.path !== "")) {
					//return next("El campo files debe contener rutas a descargar");
				} else return next("El campo files debe contener rutas válidas a descargar");
			}
			let isQueueable = false;
			/* Si la descarga contiene más de 200 archivos, se procede a enviar a cola de email */
			if (files.length >= 80) {
				isQueueable = true;
			}

			let resultSize = 0;
			if (!isQueueable) {
				const result = await checkSize(files);
				resultSize = result;
				/* Si la descarga pesará más de 10 megas, se procede a enviar a cola de email */
				if (result > 10 * 1024 * 1024) {
					isQueueable = true;
				}
			}

			if (isQueueable) {
				queueFiles.add({
					files,
					fileName,
					email,
				});
				res.json({
					message: `Le enviaremos un correo a ${email} cuando su enlace de descarga esté listo`,
					totalFiles: files.length,
					estimated: resultSize + " bytes",
				});
			} else {
				downloadFiles(fileName, files, res, next);
			}
		}
	} catch (err) {
		if (typeof err === "object") return next(err.toString());
		next(err);
	}
});

app.use((err, req, res, next) => {
	res.status(500).json({ message: err });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log("Server listening on port " + port);
});
