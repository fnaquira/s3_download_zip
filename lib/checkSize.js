const AWS = require("aws-sdk");

const { S3_KEY, S3_SECRET, S3_BUCKET } = process.env;

const s3 = new AWS.S3({
	accessKeyId: S3_KEY,
	secretAccessKey: S3_SECRET,
});

module.exports = async (files) => {
	let totalSize = 0;

	const filePromises = files.map((file) => {
		const params = {
			Bucket: S3_BUCKET,
			Key: file,
		};
		return s3
			.headObject(params)
			.promise()
			.then((data) => {
				totalSize += data.ContentLength;
			})
			.catch((err) => {
				console.log(`Error getting size for ${file}: ${err}`);
			});
	});

	await Promise.all(filePromises);
	return totalSize;
};
