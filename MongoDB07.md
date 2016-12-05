# 30-7之CRUD的刪除…喔

本篇文章將要來說明`mongodb`的刪除方法，`rmoeve、deleteOne、deleteMany`。

P.S 好像開始有點累的fu了…

## `remove`
`remove`方法是`mongodb`裡最基本的刪除`document`的方法，但這邊要注意就算你刪除了
`document`它的`index`與`預分配空間`都不會刪除。

使用方法與參數如下

* `justOne`預設`false`，代表`query`到幾個就會刪除幾個，`true`則只會刪第一個。
* `witeConecern`為拋出異常的級別。
* `collation`是`3.4`版開始支持的功能，可依照語言定義來針對文字的內容進行解讀，再還沒支持`collation`前一徑依字節來對比。

```
db.collection.remove(
   <query>,
   {
     justOne: <boolean>,
     writeConcern: <document>,
     collation: <document>
   }
)
```

使用範例如下，我們來新增三筆資料，然後刪除掉`steven`該筆資料。

```
db.user.insert({"name":"mark","age":23});
db.user.insert({"name":"steven","age":23});
db.user.insert({"name":"jj","age":23});

db.user.remove({"name":"steven"})

```


### 刪除所有資料
`remove`可以用來刪除`collection`的所有資料，但還有另一種方法也是刪除`collection`的所有資料，那就是`drop`，但它同時會將`index`給全部刪除。

兩種的使用方法如下。

```
db.user.remove({})

db.user.drop()

```

## `deleteMany`與`deleteOne`
`deleteMany`與`deleteOne`也是刪除的方法一種，就一個是刪除多筆和一個是單筆，和`remove`不同點大概只差在回傳值上，至於速度上等等來trytry看。

使用兩種方法的參數如下，與`remove`也大至差不多。

```
db.collection.deleteMany(
   <filter>,
   {
      writeConcern: <document>,
      collation: <document>
   }
)
```
使用範例如下。

```
db.user.insert({"name":"mark","age":23});
db.user.insert({"name":"steven","age":23});
db.user.insert({"name":"jj","age":23});

db.user.deleteMany({"name":"steven"})
db.user.deleteOne({"name":"steven"})

```

## `bulk delete`
`bulk`操作故明思意就是要來衝一下大筆資料刪除的效能方法。

使用方法如下。

```
//先新增二筆資料
var bulk = db.collection.initializeUnorderedBulkOp();
bulk.insert( { name: "mark"} );
bulk.insert( { name: "hoho"} );
bulk.execute();

//然後再刪除掉mark該筆
var bulk = db.collection.initializeUnorderedBulkOp();
bulk.find( { "name": "mark" } ).remove();
bulk.execute();

```

## 來比較一下速度
事實上用到現在有時會在想為什麼`mongodb`一個刪除文檔，要同時推出三個方法(新增也是)，這到現在還是有點無解，而且`remove`在`nodejs drivers`已經被`Deprecated`([這邊](http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#remove))，扣憐……，他建議改用`deleteMany`。

因為上述原因這次測試就跳過`remove`了(真的扣憐)，因為我們要用`nodejs drivers`。

### 測試案例
統一都用`bulk insert`來進行資料新增，然後再來比較`deleteMany`與`bulk delete`不同數量的刪除速度。

測試程式碼如下[github](https://github.com/h091237557/30-MongoDB/tree/master/Test/30-7)。

```
debugger;
var mongodb = require('mongodb');

var mongodbServer = new mongodb.Server('localhost', 27017, {
  auto_reconnect: true,
  poolSize: 10
});

var db = new mongodb.Db('test', mongodbServer);
var count = 1000000;
db.open(function() {
  db.collection('home', function(err, collection) {

    /*
     * deleteMany  測試 
     */
    var bulk = collection.initializeUnorderedBulkOp();
    for (var i = 0; i < count; i++) {
      bulk.insert({
        "id": 1,
        "name": "mark",
        "Like": 0
      });
    }
    bulk.execute(function(err, res) {
      console.time("deleteMany");
      collection.deleteMany({
        "name": "mark"
      }, function(err, res) {
        console.timeEnd("deleteMany");
      });
    });


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


```
從下測試就果可知幾個結論

* `bulk`在數量大時速度優於`deleteMany`，但好像沒有優於很多…。

| 測試案例(更新次數)       | deleteMany           | bulk  |
| :-------------: |:-------------:| :-----:|
| 10      | 3ms | 5ms |
| 1000      | 16ms      |   18ms |
| 10000 | 106ms      |    99ms |
| 50000 | 845ms      |    495ms |
| 100000 | 1100ms      |    963ms |
| 1000000 | 11131ms      |    100470ms |

## 結語
說實話不確定是不是我的測試方法問題，雖然`bulk`預期的是跑的比`deleteMany`還快，但
是並沒有到很快，這邊又會讓人想思考為什麼一個刪除`document`當初會有分這幾種方法?只是因為回傳值的不同????希望這30天可以不小心的找出答案……希望……(stackoverflow都找不到答案……)

## 參考資料
* http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#remove
* http://stackoverflow.com/questions/35691647/whats-the-difference-between-deletemany-and-remove-in-mongodb
* https://docs.mongodb.com/v3.2/reference/method/db.collection.deleteMany/
* https://docs.mongodb.com/v3.2/reference/method/db.collection.remove/






