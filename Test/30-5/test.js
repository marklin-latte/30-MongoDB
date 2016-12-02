debugger;
var mongodb = require('mongodb');

var mongodbServer = new mongodb.Server('localhost', 27017, {
  auto_reconnect: true,
  poolSize: 10
});

var db = new mongodb.Db('test', mongodbServer);
var count = 100000;
db.open(function() {
  db.collection('home', function(err, collection) {
    /*
     * Update use $set 測試 
     */
    var bulk = collection.initializeUnorderedBulkOp();
    bulk.insert({
      "id": 1,
      "name": "mark",
      "Like": 0
    });
    bulk.execute(function(err, res) {
      console.time("update use $set");
			var funcs = [];
      for (var i = 1; i < count+1; i++) {
				funcs.push(updateUseSet(i));	
      }
			Promise.all(funcs).then((res) => {
         console.timeEnd("update use $set");
			});
    });

		function updateUseSet(i) {
			return new Promise((resolve,reject) => {
			
        collection.update({
          "name": "mark"
        }, {
          "$set": {
            "Like": i
          }
        }, function(err, res) {
					resolve(i);
        });
			});	
		}

    /*
     * Update use $inc 測試 
     */
    var bulk = collection.initializeUnorderedBulkOp();
    bulk.insert({
      "id": 2,
      "name": "steven",
      "Like": 0
    });
    bulk.execute(function(err, res) {
      console.time("update use $inc");
			var funcs = [];
      for (var j = 1; j < count+1;j++) {
				funcs.push(updateUseInc(1));	
      }
			Promise.all(funcs).then((res) => {
         console.timeEnd("update use $inc");
			});
    });
		function updateUseInc(j) {
			return new Promise((resolve,reject) => {
			
        collection.update({
          "name": "steven"
        }, {
          "$inc": {
            "Like": j 
          }
        }, function(err, res) {
					resolve(j);
        });
			});	
		}
  });
});
