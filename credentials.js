const aws = require("aws-sdk");
var creds = new aws.Credentials(
    process.env.AWS_ACCESS_KEY_ID,
    process.env.AWS_SECRET_ACCESS_KEY,
    process.env.AWS_SESSION_TOKEN
);
aws.config.update({ region: process.env.AWS_REGION });
const sts = new aws.STS({
    creds,
});

async function getCredentials(targetArn, id) {
    try {
        var params = {
            RoleArn: targetArn,
            RoleSessionName: 'TestCloudShimIAM',
            DurationSeconds: '3600',
            ExternalId: id

        };
        let data = await sts.assumeRole(params).promise();
        console.log("Credentials generated: ", data);
        return data
    } catch (error) {
        console.log("Error while generate credentials : ", error);
        return false;
    }

}

exports.getCredentials = getCredentials;