const AWS = require("aws-sdk");

const { S3_KEY, S3_REGION, S3_SECRET, S3_BUCKET } = process.env;

AWS.config.update({
	accessKeyId: S3_KEY,
	secretAccessKey: S3_SECRET,
	region: S3_REGION,
});
const s3 = new AWS.S3();

module.exports = async (zipStream, key) => {
	const params = {
		Body: zipStream,
		Bucket: S3_BUCKET,
		Key: key,
	};
	await s3.upload(params).promise();
	return key;
};
