const AWS = require("aws-sdk");



var cloudwatch;

var cwStats = {
  getStatistics: async function (startTime, endTime, instanceId) {
    
    var params = {
      EndTime: endTime /* required */,
      MetricName: "CPUUtilization" /* required */,
      Namespace: "AWS/EC2" /* required */,
      Period: 3600 /* required */,
      StartTime: startTime /* required */,
      Dimensions: [
        {
          Name: "InstanceId" /* required */,
          Value: instanceId /* required */,
        },
        /* more items */
      ],
      ExtendedStatistics: [
        /* more items */
      ],
      Statistics: [
        "Average",
        "Maximum",
        /* more items */
      ],
      Unit: "Percent",
    };
    console.log("Cloud Watch Statistic parameter : ",params);
    let data = await cloudwatch.getMetricStatistics(params).promise();
    console.log("Successfully Cloud Watch Statistic for ",instanceId);
    return data;
  },
  initCW: async function (credentials,localRegion) {
    console.log("initCW :", credentials)
    var basicCredentials = new AWS.Credentials(
      credentials.Credentials.AccessKeyId,
      credentials.Credentials.SecretAccessKey,
      credentials.Credentials.SessionToken
    );
    AWS.config.update({ region: localRegion })
    cloudwatch = new AWS.CloudWatch({ basicCredentials });
  }
}
module.exports = cwStats