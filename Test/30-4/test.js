var mongodb = require('mongodb');

var mongodbServer = new mongodb.Server('localhost', 27017, {
  auto_reconnect: true,
  poolSize: 10
});

var db = new mongodb.Db('test', mongodbServer);
var count = 10000000;
db.open(function() {
  db.collection('user', function(err, collection) {
    /*
     * Insert測試 
     */
    var datas = [];
    for (var i = 0; i < count; i++) {
      datas.push({
        "name": "Mark",
        "age": "20",
        "size": i
      });
    }
    console.time("Insert time");
		collection.insert(datas, function(err, res) {
      if (res) {
        console.timeEnd("Insert time");
      } else {
        console.log("insert error");
      }
    });

    /*
     * InsertMany測試 
     */
    var datas = [];
    for (var i = 0; i < count; i++) {
      datas.push({
        "name": "Mark",
        "age": "20",
        "size": i
      });
    }
    console.time("InsertMany time");
		collection.insertMany(datas, function(err, res) {
      if (res) {
        console.timeEnd("InsertMany time");
      } else {
        console.log("insert error");
      }
    });

    /*
     *Unordered Bulk Insert 測試 
     */
    var datas = [];
    for (var i = 0; i < count; i++) {
      datas.push({
        "name": "Mark",
        "age": "20",
        "size": i
      });
    }
    console.time("UnorderedBulk Insert");
    var bulk = collection.initializeUnorderedBulkOp();
    for (var i = 0; i < count; i++) {
      bulk.insert(datas[i]);
    }
    bulk.execute(function(err, res) {
      console.timeEnd("UnorderedBulk Insert");
    });

    /*
     *Ordered Bulk Insert 測試 
     */
    var datas = [];
    for (var i = 0; i < count; i++) {
      datas.push({
        "name": "Mark",
        "age": "20",
        "size": i
      });
    }
    console.time("OrderedBulk Insert");
    var bulk = collection.initializeOrderedBulkOp();
    for (var i = 0; i < count; i++) {
      bulk.insert(datas[i]);
    }
    bulk.execute(function(err, res) {
      console.timeEnd("OrderedBulk Insert");
    });
  });
});
