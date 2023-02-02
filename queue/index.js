const Queue = require("bull");
const AWS = require("aws-sdk");
const s3Zip = require("s3-zip");

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
	const zipStream = await s3Zip.archive({ s3: s3, bucket: S3_BUCKET }, "", item.files);
	const key = await upload2S3(zipStream, `zips/${item.fileName}.zip`);
	await sendMail(key, item.email);
	console.log("Solicitud de descarga atendida");

	done();
});

module.exports = downloadQueue;
