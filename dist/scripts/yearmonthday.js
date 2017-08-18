    "use strict";

    function setDate(year, month, day) {
      //! 年月日
      $(".sel_year").select({
        name: "year_in",
        value: year,
        showDefault: false,
        data: yearObj(),
        onChange: function onChange() {
          getDay(day);
        }
      });
      $(".sel_month").select({
        name: "month_in",
        value: month,
        showDefault: false,
        data: monthObj(),
        onChange: function onChange() {
          getDay(day);
        }
      });
      getDay(day);
      function getDay(val) {
        $(".sel_day").select({
          name: "day_in",
          value: val,
          showDefault: false,
          data: dayObj()
        });
      }
    }

    function yearObj() {
      var yearNow = new Date().getFullYear();
      var yearObj = [];
      for (var i = yearNow; i >= 1900; i--) {
        yearObj.push({
          text: i,
          value: i
        });
      }
      return yearObj;
    }

    function monthObj() {
      var monthObj = [];
      for (var i = 1; i <= 12; i++) {
        monthObj.push({
          text: i,
          value: i
        });
      }
      return monthObj;
    }

    function dayObj() {
      var year = parseInt($('[name="year_in"]').val());
      var month = parseInt($('[name="month_in"]').val());
      var dayCount = 0;
      switch (month) {
       case 1:
       case 3:
       case 5:
       case 7:
       case 8:
       case 10:
       case 12:
        dayCount = 31;
        break;

       case 4:
       case 6:
       case 9:
       case 11:
        dayCount = 30;
        break;

       case 2:
        dayCount = 28;
        if (year % 4 == 0 && year % 100 != 0 || year % 400 == 0) {
          dayCount = 29;
        }
        break;

       default:
        break;
      }
      var dayObj = [];
      for (var i = 1; i <= dayCount; i++) {
        dayObj.push({
          text: i,
          value: i
        });
      }
      return dayObj;
    }