var utils = require("./utils");
let today = new Date();
today.setUTCHours(0, 0, 0, 0);
var _60daysago = new Date(today);

_60daysago.setDate(_60daysago.getDate() - 60);

var yesterday = new Date(today);

yesterday.setDate(yesterday.getDate() - 1);

var raw = {
  getRawDataForDays: async function (rawData, period) {
    let rawDataKeys = Object.keys(rawData);
    let returnMap = new Map();
    let returnValueKeys = rawDataKeys.slice(
      rawData.length - period,
      rawData.length
    );
    returnValueKeys.map((key) => {
      returnMap.set(key, rawData[key]);
    });

    //console.log(period, returnMap);
    return returnMap;
  },
  getAvgDataForHour: async function (cwStats, hour, day) {
    let thisHour = new Date(day);
    thisHour.setHours(hour);
    let returnValue = 0;
    cwStats.Datapoints.forEach((hourData) => {
      if (String(hourData.Timestamp) === String(thisHour)) {
        returnValue = hourData.Average;
      }
    });
    return returnValue;
  },
  getMaxDataForHour: async function (cwStats, hour, day) {
    let thisHour = new Date(day);
    thisHour.setUTCHours(hour, 0, 0, 0);
    let returnValue = 0;
    cwStats.Datapoints.forEach((hourData) => {
      if (String(hourData.Timestamp) === String(thisHour)) {
        returnValue = hourData.Maximum;
      }
    });
    return returnValue;
  },
  prepareRawStatistics: async function (cwStats, customerID, instanceType) {
		//console.log("cwStats",cwStats)
		let periodArray = await utils.getDaysArray(_60daysago, today);
		let hoursArray = [...Array(24).keys()]
		let dailyData = new Map();
		for (const day of periodArray) {
			let dailyMaxUtilization = [];
			let dailyAvgUtilization = [];
			for (const index of hoursArray) {
				let hourlyMax = await this.getMaxDataForHour(cwStats, index, day);
				//console.log("hourlyMax",hourlyMax)
        dailyMaxUtilization.push(Math.round(hourlyMax));

        let hourlyAvg = await this.getAvgDataForHour(cwStats, index, day);
        dailyAvgUtilization.push(Math.round(hourlyAvg));
			}
    

      dailyData.set(utils.convertToDateKey(day), {
        max: dailyMaxUtilization,
        avg: dailyAvgUtilization,
      });
		}

    let outPutObjet = {
      customerId: customerID,
      instanceType: instanceType,
      metrics: { cpu: Object.fromEntries(dailyData) },
    };

    return outPutObjet;
  },
  prepareUpdatedRawStatistics: async function (yesterDayStats, oldStats) {
    let dailyMaxUtilization = [];
		let dailyAvgUtilization = [];
		let hoursArray = [...Array(24).keys()]
    let dailyData = new Map(Object.entries(oldStats.metrics.cpu));
    let dayilDataLength = Object.keys(oldStats.metrics.cpu).length;

    for (const index of hoursArray) {
			let hourlyMax = await this.getMaxDataForHour(yesterDayStats, index, yesterday);
			//console.log(hourlyMax)
      dailyMaxUtilization.push(hourlyMax);

			let hourlyAvg = await this.getAvgDataForHour(yesterDayStats, index, yesterday);
			//console.log(hourlyAvg)
      dailyAvgUtilization.push(hourlyAvg);
    }

    if (dayilDataLength > 60) {
      let firstKey = dailyData.keys().next().value;
      //console.log(firstKey);
      dailyData.delete(firstKey);
    }

    dailyData.set(utils.convertToDateKey(yesterday), {
      max: dailyMaxUtilization,
      avg: dailyAvgUtilization,
    });

    let outPutObjet = {
      customerId: oldStats.customerId,
      instanceType: oldStats.instanceType,
      metrics: { cpu: Object.fromEntries(dailyData) },
    };

    return outPutObjet;
  },
};
module.exports = raw;
