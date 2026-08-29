class HelperFunctions {
  static computeHHMMSS(number) {
    var secNum = parseInt(number, 10);
    var hh = Math.floor(secNum / 3600);
    var mm = Math.floor((secNum - hh * 3600) / 60);
    var ss = secNum - hh * 3600 - mm * 60;

    if (mm < 10) {
      mm = "0" + mm;
    }
    if (ss < 10) {
      ss = "0" + ss;
    }

    return { hh, mm, ss };
  }

  static toHHMMSSNoTrim(number) {
    var { hh, mm, ss } = HelperFunctions.computeHHMMSS(number);
    if (hh < 10) {
      hh = "0" + hh;
    }
    return { hh, mm, ss };
  }

  static toHHMMSS(number) {
    var { hh, mm, ss } = HelperFunctions.computeHHMMSS(number);

    if (hh == 0) {
      hh = "";
    } else {
      hh += ":";
    }

    return hh + mm + ":" + ss;
  }
}

export default HelperFunctions;

// module.exports = {
//   toHHMMSSCompute: (number) => {
//     var secNum = parseInt(number, 10);
//     var hours = Math.floor(secNum / 3600);
//     var minutes = Math.floor((secNum - hours * 3600) / 60);
//     var seconds = secNum - hours * 3600 - minutes * 60;
//     return (hours, minutes, seconds);
//   },

//   toHHMMSS: (number) => {
//     var { hours, minutes, seconds } = this.toHHMMSSCompute(number);

//     if (hours == 0) {
//       hours = "";
//     } else {
//       hours += ":";
//     }

//     if (minutes < 10) {
//       minutes = "0" + minutes;
//     }
//     if (seconds < 10) {
//       seconds = "0" + seconds;
//     }
//     return hours + minutes + ":" + seconds;
//   },

// };