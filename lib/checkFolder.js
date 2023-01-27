const AWS = require("aws-sdk");

const s3 = new AWS.S3({
	accessKeyId: "ACCESS_KEY",
	secretAccessKey: "SECRET_KEY",
});

const getFolderSize = async (bucket, prefix) => {
	let totalSize = 0;
	let continuationToken;
	do {
		const params = {
			Bucket: bucket,
			Prefix: prefix,
			ContinuationToken: continuationToken,
		};
		const response = await s3.listObjectsV2(params).promise();
		response.Contents.forEach((object) => {
			totalSize += object.Size;
		});
		continuationToken = response.NextContinuationToken;
	} while (continuationToken);
	return totalSize;
};

const folderSize = await getFolderSize("my-bucket", "path/to/folder/");
console.log(folderSize); // 12345678
