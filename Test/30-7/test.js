debugger;
var mongodb = require('mongodb');

var mongodbServer = new mongodb.Server('localhost', 27017, {
  auto_reconnect: true,
  poolSize: 10
});

var db = new mongodb.Db('test', mongodbServer);
var count = 500000;
db.open(function() {
  db.collection('home', function(err, collection) {

    /*
     * deleteMany  測試 
     */
    //var bulk = collection.initializeUnorderedBulkOp();
    //for (var i = 0; i < count; i++) {
      //bulk.insert({
        //"id": 1,
        //"name": "mark",
        //"Like": 0
      //});
    //}
    //bulk.execute(function(err, res) {
      //console.time("deleteMany");
      //collection.deleteMany({
        //"name": "mark"
      //}, function(err, res) {
        //console.timeEnd("deleteMany");
      //});
    //});


    /*
     * bulk  測試 
     */
    var bulk = collection.initializeUnorderedBulkOp();
    for (var i = 0; i < count; i++) {
      bulk.insert({
        "id": 2,
        "name": "steven",
        "Like": 0
      });
    }
    bulk.execute(function(err, res) {
      console.time("bulkDelete");
      var deletebulk = collection.initializeUnorderedBulkOp();
      deletebulk.find({
        "name": "steven"
      }).remove();
      deletebulk.execute(function(err, res) {
        console.timeEnd("bulkDelete");
      })
    });
  });
});
