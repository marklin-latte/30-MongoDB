debugger;
var mongodb = require('mongodb');
var rnorm = require('randgen').rnorm;

var mongodbServer = new mongodb.Server('localhost', 27017, {
	auto_reconnect: true,
	poolSize: 10
});

var db = new mongodb.Db('test', mongodbServer);
var stockCount = 500;
var days = 2000;
db.open(function() {
	db.collection('stocks', function(err, collection) {
		var datas = testDatas(500,2000);
		collection.insert(datas, function(err, res) {
			if (res) {
			} else {
			}
		});
	});
});

function testDatas(stockCount,days){
	var result = [];
	for (var i=0;i<stockCount;i++){
		result = createStockDatas(days,result);	
	}
}


function createStockDatas(count,result) {
  var volume = randNum(1000, 100000);
  var randPrice = randNum(10, 1000);
	var date = new Date(),
			temp ;
  for (var i = 0; i < count; i++) {
		var price = temp || randPrice,
			  sd = price * 0.07 / 2,
				open = Math.floor(rnorm(price,sd)),
				low = Math.floor(rnorm(price,sd)),
				heigh = randHeigh(open,price,sd);
    result.push({
      "code": randCode(),
      "date": date.setDate(date.getDate() - i ),
      "open": open,
      "heigh": heigh,
      "close": randlow(heigh,price,sd),
      "low": low,
      "volume": volume
    })
		temp = low; 
  }
  return result
}

function randHeigh(open,avg,sd){
	var result = 0;
	while (result <= open){
		result = rnorm(avg,sd);	
	}
	return Math.floor(result);
}

function randlow(heigh,avg,sd){
	var result = 0;
	while ( result == 0 || result >= heigh){
		result = rnorm(avg,sd);	
	}
	return Math.floor(result);
}

function randNum(min, max) {
  return Math.floor((Math.random() * max) + min);
}

function randCode(){
	return randNum(1,9).toString() +  randNum(0,9).toString() +randNum(0,9).toString()+randNum(0,9).toString()
}
