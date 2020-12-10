const AWS = require("aws-sdk");
var creds = new AWS.Credentials(
  process.env.AWS_ACCESS_KEY_ID,
  process.env.AWS_SECRET_ACCESS_KEY,
  process.env.AWS_SESSION_TOKEN
);
AWS.config.update({ region: process.env.AWS_REGION });
const s3 = new AWS.S3({
  creds,
});

var s3Ops = {
  readSource: async function (key, bucket) {
    try {
     
      var params = {
        Bucket: bucket,
        Key: key,
      };
      console.log("S3 read : ",params)
      let data = await s3.getObject(params).promise();
      console.log("S3 Data : ", data);
      return JSON.parse(data.Body.toString());
    } catch (error) {
      console.log(error);
      return false;
    }
  },
  uploadToS3: async function (statsData, key, bucket) {
    
    try {
      var params = {
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(statsData),
      };
      console.log("S3 write : ",params)
      let data = await s3.putObject(params).promise();
      console.log("S3 upload done");
    } catch (error) {
      return error;
    }
  },
};

module.exports = s3Ops;
