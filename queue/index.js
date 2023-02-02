const Queue = require("bull");

const downloadQueue = new Queue("aws s3", {
	redis: { port: 6379, host: "127.0.0.1", password: process.env.REDIS_PASS },
});

downloadQueue.process(4, async (job, done) => {
	const pendingInfo = await downloadQueue.getJobCounts();
	console.log("Descarga S3", pendingInfo.waiting);

	const odoo = await odooConnect();
	// job.data contains the custom data passed when the job was created
	const item = job.data;

	//s3Zip.archive({ s3: s3, bucket: S3_BUCKET }, "", item.files).pipe(res);

	done();
});

module.exports = downloadQueue;
