debugger;
var mongodb = require('mongodb');
var rnorm = require('randgen').rnorm;

var mongodbServer = new mongodb.Server('localhost', 20006, {
  auto_reconnect: true,
  poolSize: 10
});

var db = new mongodb.Db('test', mongodbServer);
var stockCount = 1000;
var days = 5000;


// 執行新增至mongodb動作。
db.open(function() {
  db.collection('stocks', function(err, collection) {
    var datas = testDatas(stockCount, days);
    collection.insert(datas, function(err, res) {
      if (res) {
        console.log(res);
      } else {}
    });
  });
});

// 用來建立模擬資料
function testDatas(stockCount, days) {
  var result = [];
  for (var i = 0; i < stockCount; i++) {
    result = createStockDatas(days, result);
  }
  return result;
}

//　用來建立單筆多天的股價資料
function createStockDatas(count, result) {
  var randPrice = randNum(10, 1000);
  var code = randCode();
  var date = new Date(),
    temp;

  for (var i = 0; i < count; i++) {
    var price = temp || randPrice,
      sd = price * 0.07 / 2,
      open = Math.floor(rnorm(price, sd)),
      low = Math.floor(rnorm(price, sd)),
      heigh = randHeigh(open, price, sd),
      close = Math.floor(rnorm(price, sd)),
      volume = randNum(1000, 100000);

    result.push({
      "code": code,
      "date": addDays(date,i),
      "open": open,
      "heigh": heigh,
      "close": close,
      "low": low,
      "volume": volume
    })
    temp = low;
  }
  return result
}

// 產生常態分配的最高價，但最高價不能小於開盤價。
function randHeigh(open, avg, sd) {
  var result = 0;
  while (result <= open) {
    result = rnorm(avg, sd);
  }
  return Math.floor(result);
}

// 產生常態分配的最底價，但最低價不能大於最高價。
function randlow(heigh, avg, sd) {
  var result = 0;
  while (result == 0 || result >= heigh) {
    result = rnorm(avg, sd);
  }
  return Math.floor(result);
}

// 產生亂數 min ~ max 範圍。
function randNum(min, max) {
  return Math.floor((Math.random() * max) + min);
}

// 隨機產生股價代碼。
function randCode() {
  return randNum(1, 9).toString() + randNum(0, 9).toString() + randNum(0, 9).toString() + randNum(0, 9).toString()
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
