var utils = {
  convertToDateKey: function (date) {
    let inputDate = new Date(date);
    let key = `${
      inputDate.getMonth() + 1
      }-${inputDate.getDate()}-${inputDate.getFullYear()}`;
    return key;
  },
  convertData: function (inputJSON) {
    let instancesMap = new Map();
    let inputJSONkeys = Object.keys(inputJSON.Resources.regions);

    inputJSONkeys.map((region) => {
      regionObjKeys = Object.keys(inputJSON.Resources.regions[region]);

      let trgn = inputJSON.Resources.regions[region]["EC2"];

      if (Array.isArray(trgn)) {
        trgn.map((item) => {
          let data = [];
          data.push(region);
          data.push(item.InstanceType);
          instancesMap.set(item.ID, data);
        });
      }
    });
    console.log("instanceID's : ", instancesMap);
    return instancesMap;
  },
  getDay: function (day) {
    let weekdays = new Map([
      [0, "sun"],
      [1, "mon"],
      [2, "tue"],
      [3, "wed"],
      [4, "thu"],
      [5, "fri"],
      [6, "sat"],
    ]);
    //console.log(weekdays, weekdays.get(day));
    return weekdays.get(day);
  },
  getDaysArray: function (start, end) {
    for (
      var arr = [], dt = new Date(start);
      dt <= end;
      dt.setDate(dt.getDate() + 1)
    ) {
      arr.push(new Date(dt));
    }
    return arr;
  },
};
module.exports = utils;
