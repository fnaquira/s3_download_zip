const AWS = require("aws-sdk");
const archiver = require("archiver");

const { S3_KEY, S3_SECRET, S3_REGION, S3_BUCKET } = process.env;

AWS.config.update({
	accessKeyId: S3_KEY,
	secretAccessKey: S3_SECRET,
	region: S3_REGION,
});
const s3 = new AWS.S3();

module.exports = async (fileName, files, res, next) => {
	try {
		res.setHeader("Content-Type", "application/zip");
		res.setHeader("Content-Disposition", `attachment; filename="${fileName || "descarga"}.zip"`);

		const archive = archiver("zip", {
			zlib: { level: 9 },
		});
		archive.pipe(res);

		for (const file of files) {
			let filename = file;
			let filepath = file;
			if (typeof file === "object") {
				filename = file.name;
				filepath = file.path;
			}
			const s3Params = { Bucket: S3_BUCKET, Key: filepath };
			const s3Object = await s3.getObject(s3Params).promise();

			archive.append(s3Object.Body, { name: filename });

			console.log(`Archivo ${filename} descargado y agregado al archivo zip`);
		}

		archive.finalize();

		console.log("Archivo zip generado y enviado al cliente");
	} catch (err) {
		console.error(err);
		next(err);
	}
};
