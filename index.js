require("dotenv").config();

const express = require("express");
const app = express();
const logger = require("morgan");
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");
const s3Zip = require("s3-zip");

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

app.post("/download", async function (req, res) {
	const files = [
		"5f2dab86911ff5001706e693.pdf",
		"5f3589ca3997690017dc8d58.pdf",
		"5f5b9fc66c4dca00c385f46b-5f35840edfdad44a920da95f.pdf",
	];

	res.setHeader("Content-Type", "application/zip");
	res.setHeader("Content-Disposition", 'attachment; filename="gestdoc.zip"');
	s3Zip.archive({ s3: s3, bucket: S3_BUCKET }, "", files).pipe(res);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log("Server listening on port " + port);
});
