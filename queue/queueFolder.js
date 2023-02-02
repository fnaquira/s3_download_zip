const Queue = require("bull");

const upload2S3 = require("../lib/upload2S3");
const sendMail = require("../lib/sendMail");
const downloadFolderAsync = require("../lib/downloadFolderAsync");

const downloadFolderQueue = new Queue("aws folder", {
	redis: { port: 6379, host: "127.0.0.1", password: process.env.REDIS_PASS },
});

downloadFolderQueue.process(2, async (job, done) => {
	const pendingInfo = await downloadFolderQueue.getJobCounts();
	console.log("Descarga folder", pendingInfo.waiting);

	const item = job.data;
	const zipStream = await downloadFolderAsync(item.folder);

	const key = await upload2S3(zipStream, `zips/${item.fileName}-${item.folder}.zip`);
	await sendMail(key, item.email);
	console.log("Solicitud de descarga folder atendida");

	done();
});

module.exports = downloadFolderQueue;
