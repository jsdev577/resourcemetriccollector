const raw = require("./raw");
const utils = require("./utils");
var aggregate = {
  getMaxAggregateData: async function (daysArray) {
    let maxSum = [];
    daysArray.forEach((dayArray) => {
      let sum = dayArray.max.reduce(function (a, b) {
        return a + b;
      }, 0);
      maxSum.push(sum);
    });
    let maxValue = Math.max(...maxSum);
    //console.log("maxValue", maxValue);
    return daysArray[maxSum.indexOf(maxValue)].max;
  },
  getAvgAggregateData: async function (daysArray) {
    let avgData = [];
    for (let hour = 0; hour < 24; hour++) {
      let sum = 0;
      for (let index = 0; index < daysArray.length; index++) {
        sum += daysArray[index].avg[hour];
      }
      avgData[hour] = sum / daysArray.length;
    }
    return avgData;
  },
  getAggeratedStatsForDay: async function (rawCPUData, day) {
    let dataKeys = Object.keys(Object.fromEntries(rawCPUData));
    let daysArray = [];
    dataKeys.forEach((key) => {
      let keyday = new Date(key).getDay();
      //console.log("rawKey", rawCPUData.get(key));
      if (keyday === day) {
        daysArray.push(rawCPUData.get(key));
      }
    });
    //console.log("daysArray", daysArray);
    let maxData = await this.getMaxAggregateData(daysArray);
    let avgData = await this.getAvgAggregateData(daysArray);
    return {
      max: maxData,
      avg: avgData,
    };
  },
  getAggregatedStatistics: async function (rawData, customerID, instanceType) {
		//console.log("rawData",rawData)
    let aggragatedMap = new Map();

		let periods = [14, 30, 60];
    let gavg = 0, gAvaArr = [];
    
		for (const period of periods) {
      let aggregatedDaysArray = new Map();
      let periodData = await raw.getRawDataForDays(rawData.metrics.cpu, period);
      for (let index = 0; index < 7; index++) {
        let lAvg = 0;
        let dayData = await this.getAggeratedStatsForDay(periodData, index);
        //console.log("dayData", dayData);
        aggregatedDaysArray.set(utils.getDay(index), dayData);
        if(period === 30){
          for (const object of dayData.avg) {
            lAvg += object;
          }
          gAvaArr.push(lAvg/24)
          
        }
        
      }
      if(period === 30){
        for (const object of gAvaArr) {
          gavg += object;
        }

      }
      aggragatedMap.set(
        `last${period}day`,
        Object.fromEntries(aggregatedDaysArray)
      );
		}

    let aggregatedOutput = [{
      customerId: customerID,
      instanceType: instanceType,
      metrics: { cpu: Object.fromEntries(aggragatedMap) },
    },gavg];
    return aggregatedOutput;
  },
};

module.exports = aggregate;
