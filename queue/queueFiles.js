const Queue = require("bull");
const AWS = require("aws-sdk");
//const s3Zip = require("s3-zip");
const archiver = require("archiver");
const stream = require("stream");

const upload2S3 = require("../lib/upload2S3");
const sendMail = require("../lib/sendMail");

const { S3_KEY, S3_SECRET, S3_REGION, S3_BUCKET } = process.env;

AWS.config.update({
	accessKeyId: S3_KEY,
	secretAccessKey: S3_SECRET,
	region: S3_REGION,
});
const s3 = new AWS.S3();

const downloadQueue = new Queue("aws s3", {
	redis: { port: 6379, host: "127.0.0.1", password: process.env.REDIS_PASS },
});

downloadQueue.process(2, async (job, done) => {
	const pendingInfo = await downloadQueue.getJobCounts();
	console.log("Descarga S3", pendingInfo.waiting);

	const item = job.data;
	//const zipStream = await s3Zip.archive({ s3: s3, bucket: S3_BUCKET }, "", item.files);

	// Crear un archivo zip en memoria
	const archive = archiver("zip", { zlib: { level: 9 } });

	// Crear un stream de respuesta de Express
	const response = new stream.PassThrough();

	// Agregar el stream de respuesta de Express al archivo zip
	archive.pipe(response);

	// Descargar cada archivo de S3 y agregarlo al archivo zip con un nuevo nombre
	for (const file of item.files) {
		let filename = file;
		let filepath = file;
		if (typeof file === "object") {
			filename = file.name;
			filepath = file.path;
		}
		// Obtener el objeto S3 para el archivo
		const s3Params = { Bucket: S3_BUCKET, Key: filepath };
		const s3Object = await s3.getObject(s3Params).promise();

		// Agregar el objeto al archivo zip con el nuevo nombre de archivo
		archive.append(s3Object.Body, { name: filename });

		console.log(`Archivo ${filename} descargado y agregado al archivo zip con el nuevo nombre ${newFilename}`);
	}

	// Finalizar el archivo zip
	archive.finalize();

	const key = await upload2S3(response, `zips/${item.fileName}.zip`);
	await sendMail(key, item.email);
	console.log("Solicitud de descarga atendida");

	done();
});

module.exports = downloadQueue;
