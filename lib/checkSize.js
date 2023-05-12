const AWS = require("aws-sdk");

const { S3_KEY, S3_SECRET, S3_BUCKET } = process.env;

const s3 = new AWS.S3({
	accessKeyId: S3_KEY,
	secretAccessKey: S3_SECRET,
});

module.exports = (files) => {
	return new Promise(async (resolve, reject) => {
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
					console.error(`Error getting size for ${file}: ${err}`);
				});
		});

		try {
			await Promise.all(filePromises);
			resolve(totalSize);
		} catch (err) {
			reject(err);
		}
	});
};
