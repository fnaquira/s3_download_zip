const fs = require("fs");
const AWS = require("aws-sdk");
const mailgun = require("mailgun-js")({
	apiKey: process.env.MAILGUN_KEY,
	domain: process.env.MAILGUN_DOMAIN,
});

const { MAIL_SENDER, MAIL_SUPPORT, COMPANY_NAME, S3_KEY, S3_REGION, S3_SECRET, S3_BUCKET } = process.env;

AWS.config.update({
	accessKeyId: S3_KEY,
	secretAccessKey: S3_SECRET,
	region: S3_REGION,
});
const s3 = new AWS.S3();

let templateSuccess = "";
fs.readFile("templates/mail_success.html", "utf8", function (err, html) {
	templateSuccess = html;
});

const getDownloadUrl = (key, expiry = 60 * 60 * 24 * 7) => {
	const params = {
		Bucket: S3_BUCKET,
		Key: key,
		Expires: expiry,
	};
	const url = s3.getSignedUrl("getObject", params);
	return url;
};

module.exports = (key, email) => {
	return new Promise(async (resolve, reject) => {
		const subjectMail = `¡Tu descarga solicitada está lista!`;

		const urlZip = getDownloadUrl(key);

		let _body = templateSuccess + "";
		_body = _body.split("{email_usuario_sesion}").join(email);
		_body = _body.split("{url_procedure}").join(urlZip);
		_body = _body.split("{email_support}").join(MAIL_SUPPORT);
		_body = _body.split("{company_name}").join(COMPANY_NAME);

		const params = {
			from: MAIL_SENDER,
			to: [email],
			subject: subjectMail,
			text: subjectMail,
			html: _body,
		};

		mailgun.messages().send(params, (err, data) => {
			if (err) return reject(err);
			console.log(data);
			resolve(data);
		});
	});
};
