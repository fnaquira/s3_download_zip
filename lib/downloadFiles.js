const AWS = require("aws-sdk");
const s3Zip = require("s3-zip");

const { S3_KEY, S3_SECRET, S3_REGION, S3_BUCKET } = process.env;

AWS.config.update({
	accessKeyId: S3_KEY,
	secretAccessKey: S3_SECRET,
	region: S3_REGION,
});
const s3 = new AWS.S3();

module.exports = (fileName, files, res) => {
	res.setHeader("Content-Type", "application/zip");
	res.setHeader("Content-Disposition", `attachment; filename="${fileName || "descarga"}.zip"`);
	s3Zip.archive({ s3: s3, bucket: S3_BUCKET }, "", files).pipe(res);
};
