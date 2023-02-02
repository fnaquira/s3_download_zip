require("dotenv").config();

const express = require("express");
const app = express();
const logger = require("morgan");
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");
const s3Zip = require("s3-zip");

const checkSize = require("./lib/checkSize");

const { S3_KEY, S3_SECRET, S3_REGION, S3_BUCKET } = process.env;

AWS.config.update({
	accessKeyId: S3_KEY,
	secretAccessKey: S3_SECRET,
	region: S3_REGION,
});
const s3 = new AWS.S3();

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

	/*res.setHeader("Content-Type", "application/zip");
	res.setHeader("Content-Disposition", `attachment; filename="${fileName || "descarga"}.zip"`);
	s3Zip.archive({ s3: s3, bucket: S3_BUCKET }, "", files).pipe(res);*/
	const result = await checkSize(files);
	res.json(result);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log("Server listening on port " + port);
});
