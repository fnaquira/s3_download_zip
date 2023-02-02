const AWS = require("aws-sdk");

const { S3_KEY, S3_SECRET, S3_BUCKET } = process.env;

const s3 = new AWS.S3({
	accessKeyId: S3_KEY,
	secretAccessKey: S3_SECRET,
});

const folderExists = async (folder) => {
	const params = {
		Bucket: S3_BUCKET,
		Prefix: folder,
	};
	const results = await s3.listObjectsV2(params).promise();
	return results.Contents.length > 0;
};

module.exports = async (folder) => {
	if (!(await folderExists(folder))) {
		throw new Error(`Folder "${folder}" does not exist in "${S3_BUCKET}"`);
	}
	let totalSize = 0;
	let totalFiles = 0;
	let continuationToken;
	do {
		const params = {
			Bucket: S3_BUCKET,
			Prefix: folder,
			ContinuationToken: continuationToken,
		};
		const response = await s3.listObjectsV2(params).promise();
		response.Contents.forEach((object) => {
			totalSize += object.Size;
			totalFiles++;
		});
		continuationToken = response.NextContinuationToken;
	} while (continuationToken);
	return [totalSize, totalFiles];
};
