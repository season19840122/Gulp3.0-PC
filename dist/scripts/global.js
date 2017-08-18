    "use strict";

    //! 常用工具函数
    var GLOBAL = {
      show: function show($obj) {
        $obj.show();
        $(".masklayer").show();
      },
      hide: function hide($obj) {
        $obj.hide();
        $(".masklayer").hide();
      },
      setDate: function(_setDate) {
        function setDate(_x, _x2, _x3) {
          return _setDate.apply(this, arguments);
        }
        setDate.toString = function() {
          return _setDate.toString();
        };
        return setDate;
      }(function(year, month, day) {
        setDate(year, month, day);
      })
    };