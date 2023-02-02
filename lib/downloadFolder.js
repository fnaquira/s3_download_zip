const AWS = require("aws-sdk");
const s3Zip = require("s3-zip");
const XmlStream = require("xml-stream");

const { S3_KEY, S3_SECRET, S3_REGION, S3_BUCKET } = process.env;

AWS.config.update({
	accessKeyId: S3_KEY,
	secretAccessKey: S3_SECRET,
	region: S3_REGION,
});
const s3 = new AWS.S3();

async function zip(folder, files, res) {
	s3Zip.archive({ region: S3_REGION, bucket: S3_BUCKET, preserveFolderStructure: true }, folder, files).pipe(res);
}

module.exports = (fileName, folder, res) => {
	res.setHeader("Content-Type", "application/zip");
	res.setHeader("Content-Disposition", `attachment; filename="${fileName || "descarga"}.zip"`);

	const params = {
		Bucket: S3_BUCKET,
		Prefix: folder,
	};

	const filesArray = [];
	const files = s3.listObjects(params).createReadStream();
	const xml = new XmlStream(files);
	xml.collect("Key");
	xml.on("endElement: Key", function (item) {
		filesArray.push(item["$text"].substr(folder.length));
	});

	xml.on("end", async function () {
		await zip(folder, filesArray, res);
	});
};
