debugger;
//MongoDB Config
var mongodb = require('mongodb');
var sentencer = require('sentencer');
var mongodbServer = new mongodb.Server('localhost', 27017, {
  auto_reconnect: true,
  poolSize: 10
});
var db = new mongodb.Db('test', mongodbServer);

//Random Data Config
var count = 500000;
var users = ["mark", "steven", "jack", "ian", "stanly", "landry", "max", "andrew", "chris", "marray"];
var usersLen = users.length;
var sentences = [
  "This is {{ an_adjective }} people.",
  "This sentence has {{ a_noun }} and {{ an_adjective }} {{ noun }} in it.",
  "It is very {{ adjective }} event",
  "Stop ~ you are a {{ noun }}",
  "This is {{ adjective }} {{ noun }}."
]
var sentencesLen = sentences.length;

//Random Method
var randNum = function(min, max) {
  return Math.floor((Math.random() * max) + min);
}

var randomMessages = function() {
  var rand = randNum(1, 50),
    messages = [],
    date = new Date();

  for (var i = 0; i < rand; i++) {
    messages.push({
      "author": users[randNum(0, usersLen)],
      "text": sentencer.make(sentences[randNum(0, sentencesLen)]),
      "date": date.setDate(date.getDate() + randNum(1, 300))
    })
  }
  return messages;
}

var randomPost = function() {
  return {
    "text": sentencer.make(sentences[randNum(0, sentencesLen)]),
    "date": new Date(),
    "author": users[randNum(0, 9)],
    "likes": randNum(0, 1000),
    "messages": randomMessages()
  }
}

// Main 
db.open(function() {
  db.collection('posts', function(err, collection) {
    var bulk = collection.initializeUnorderedBulkOp();
    for (var i = 0; i < count; i++) {
      bulk.insert(randomPost());
    }
    bulk.execute(function(err, res) {
      console.log("Success");
    });
  });
});
