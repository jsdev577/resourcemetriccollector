const s3Ops = require("./s3Operations");
const cwStats = require("./cwStatistics");
const utils = require("./utils");
const aggregate = require("./aggregate");
const raw = require("./raw");
const credentials = require("./credentials");

var customerBucket = "am-0-01";


let today = new Date();
today.setUTCHours(0, 0, 0, 0);

var _60daysago = new Date(today);

_60daysago.setDate(_60daysago.getDate() - 60);

var yesterday = new Date(today);

yesterday.setDate(yesterday.getDate() - 1);

async function getStats(instanceID, customerID, instanceType) {

  console.log("instanceID", instanceID)

  let stats = await s3Ops
    .readSource(
      `${customerID}/Metrics/ec2/raw/${instanceID}.json`,
      customerBucket
    )
  if (stats) {
    console.log("Row file exist for ", instanceID);
    let lastDayStats = await cwStats
      .getStatistics(yesterday, today, instanceID)
    if (lastDayStats) {
      let updatedData = await raw.prepareUpdatedRawStatistics(
        lastDayStats,
        stats
      );
      console.log("prepared raw statistics for update");
      await s3Ops.uploadToS3(
        updatedData,
        `${customerID}/Metrics/ec2/raw/${instanceID}.json`,
        customerBucket
      );

      let uploadAggregateData = await aggregate.getAggregatedStatistics(
        updatedData, customerID, instanceType
      );
      console.log("prepared aggregated statistics for update");
      await s3Ops.uploadToS3(
        uploadAggregateData[0],
        `${customerID}/Metrics/ec2/aggregated/${instanceID}.json`,
        customerBucket
      );
      return uploadAggregateData[1];
    };
  }
  else {
    console.log("No file found, getting last 14 days data");
    let oldstats = await cwStats.getStatistics(_60daysago, today, instanceID)

    if (oldstats) {
      let uploadData = await raw.prepareRawStatistics(oldstats, customerID, instanceType);
      console.log("prepared new raw statistics");
      await s3Ops.uploadToS3(
        uploadData,
        `${customerID}/Metrics/ec2/raw/${instanceID}.json`,
        customerBucket
      );

      let uploadAggregateData = await aggregate.getAggregatedStatistics(uploadData, customerID, instanceType);
      console.log("prepared new aggregated statistics");
      await s3Ops.uploadToS3(
        uploadAggregateData[0],
        `${customerID}/Metrics/ec2/aggregated/${instanceID}.json`,
        customerBucket
      );
      return uploadAggregateData[1];
    };
  };
}
handler = async (event) => {
  console.log("EVENTs: \n" + event);

  let customerData = await s3Ops.readSource(`${event.CustomerId}/CloudAccounts/cloudaccounts.json`,
    customerBucket)

  let localArr = [], local = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const object of customerData.aws) {
    if (!object.permissionsRevoked) {
      let accountId = object.cloudAccountId;
      let targetArn = object.iamRoleArn
      console.log("CustomerData :", object)
      let creds = await credentials.getCredentials(targetArn, event.CustomerId)

      if (creds !== false) {


        let json = await s3Ops
          .readSource(
            `${event.CustomerId}/Inventory/${accountId}_Inventory.json`,
            customerBucket
          )
        if (json !== false) {
          let ec2Instances = await utils.convertData(json);
          var region = "";
          for (const instance of ec2Instances.keys()) {
            var data = ec2Instances.get(instance);
            if (region !== data[0] || region === "") {
              let init = await cwStats.initCW(creds, data[0]);
              console.log("Region : ", data[0])
              region = data[0];
            }
            let instanceAvg = await getStats(instance, `${event.CustomerId}`, data[1]);
            localArr.push(instanceAvg);
          }

        }
      }
    }
  }

  for (const object of localArr) {
    let value = parseInt(object / 10);
    let mValue = object % 10;
    if (mValue > 5)
      value++;
    local[value]++;

  }
  console.log("AvgGroups : ",local);
  let groups = {

    "avgCpuDistributionGroups": {

      "last30day": local

    }

  }
  
  await s3Ops.uploadToS3(
    groups,
    `${event.CustomerId}/Metrics/ec2/avgcpudistribution.json`,
    customerBucket
  );
};

handler({
  "CustomerId": "73b05449-ff4b-453d-8061-903030958199"
})
