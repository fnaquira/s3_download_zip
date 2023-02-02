const AWS = require("aws-sdk");

const { S3_KEY, S3_SECRET, S3_REGION, S3_BUCKET } = process.env;

module.exports = async (files) => {
	const results = {};
	const s3 = new AWS.S3({
		accessKeyId: S3_KEY,
		secretAccessKey: S3_SECRET,
	});

	const filePromises = files.map((file) => {
		const params = {
			Bucket: S3_BUCKET,
			Key: file,
		};
		return s3
			.headObject(params)
			.promise()
			.then((data) => {
				results[file] = data.ContentLength;
			})
			.catch((err) => {
				console.log(`Error getting size for ${file}: ${err}`);
			});
	});

	await Promise.all(filePromises);
	return results;
};