# 30-4之CRUD的Bulk與新增效能測試…喔

本篇文章運用上一篇提到的二種新增方法`insert`、`insertMany`，以及另一種新增方法`Bulk`來做執行速度比較，由於`insertMany`在`mongodb shell`執行完會直接輸出結果，所以如果有1萬筆資料他就會一直跑一直跑……跑到天荒地老，看不到我用來計算執行時間的方法，所以本測試打算用`node js`來建立測試方法。

在開始測試之前，先介紹一下另一個新增方法`Bulk Insert`。

## Bulk Insert

`Bulk Insert`在`2.6`版時發佈，它也是種新增方法，效能如何等等會比較，基本使用方法有分有兩`Unordered Operations`和`Ordered Operations`。

### Ordered Operations

`Ordered Operations`，mongodb在執行列表的寫入操作時，如果其中一個發生錯誤，它就會停止下來，不會在繼續執行列表內的其它寫入操作，並且前面的操作不會`rollback `。

使用範例如下。

```
var bulk = db.collection.initializeOrderedBulkOp();
bulk.insert( { name: "mark"} );
bulk.insert( { name: "hoho"} );
bulk.execute();
```

### Unordered Operations
`Unordered Operations`，mongodb在執行列表的寫入操作時，如果其中一個發生錯誤，它不會停止下來，會繼續執行列表內的其它寫入操作，速度較快。

使用範例如下。

```
var bulk = db.collection.initializeUnorderedBulkOp();
bulk.insert( { name: "mark"} );
bulk.insert( { name: "hoho"} );
bulk.execute();
```


## 建立測試環境

首先我們先建立個新的資料夾，然後在裡面執行`npm init`來產生`package.json`檔，最後我們需要的元件為`mongodb`，這是`mongodb native driver`，透過`npm install mongodb --save`來進行安裝。

接下來我們建立測試檔案`test.js`，內容如下，並附上[github](https://github.com/h091237557/30-MongoDB/tree/master/Test/30-4)連結。

下面的程式碼有個很詭異的地方，測試資料`datas`產生了三次而且完全一模一樣，會這樣寫是因為如果只寫一個`datas`然後給三個方法新增，會發生`Duplicate ObjectId`，也就是說用同一個物件去新增，它所建立的`ObjectId`會一樣，然後就會出錯，這邊可能要去查一下`mongodb native driver `的原始碼才知道為啥會降。

```
var mongodb = require('mongodb');

var mongodbServer = new mongodb.Server('localhost', 27017, {
  auto_reconnect: true,
  poolSize: 10
});

var db = new mongodb.Db('test', mongodbServer);
var count = 1000000;
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
     for (var i = 0; i < count ; i++) {
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
	* Unorder Bulk Insert  測試 
	*/
      var datas = [];
      for (var i = 0; i < count ; i++) {
          datas.push({
            "name": "Mark",
            "age": "20",
            "size": i
          });
      }
      console.time("Bulk Insert");
      var bulk = collection.initializeUnorderedBulkOp();
      for (var i = 0; i < count; i++) {
        bulk.insert(datas[i]);
      }
      bulk.execute(function(err,res){
        console.timeEnd("Bulk Insert");
      });
    
      
    /*
	* Ordered Bulk Insert 測試 
	*/
      var datas = [];
      for (var i = 0; i < count ; i++) {
          datas.push({
            "name": "Mark",
            "age": "20",
            "size": i
          });
      }
      console.time("Bulk Insert");
      var bulk = collection.initializeOrderedBulkOp();
      for (var i = 0; i < count; i++) {
        bulk.insert(datas[i]);
      }
      bulk.execute(function(err,res){
          console.timeEnd("Bulk Insert");
      });

  });
});
       
```

## 開始測試案例



測試物件大小約為`38Bytes`，並且從小測到大，這邊要注意一下，由於`mongodb`會進行所謂的預分配，將空間換取穩定，每當你第一次建立`document`，他就會切分固定大小給你，然後你就算刪除`document`時空間還是會存在，所以如果你先執行一次10萬筆測試，在執行第二次十萬筆測試時，你會發現執行速度變快了，因為它不用在預分配了。


```
{
   "name": "Mark",
   "age": "20",
   "size": "1"
}

```
執行結果如下，每筆數測試都會執行兩次，並且不同筆數測試會先將預分配空間完全清除。

從下面執行結果可以知道幾點事情。

* 在數據量較大情況下使用`Bulk`操作都名顯優於`insert、insertMany`。
* `insertMany`不管數量大小都優於`insert`(誒!?...那要`insert`做啥)。
* 預分配的確可以增加點兒速度，但在數據量越大時越不名顯的fu(怪怪)。


| 測試案例(筆數大小)        | Insert           | InsertMany  | Ordered Bulk | Unordered Bulk|
| :-------------: |:-------------:| :-----:|:-----:|:-----:|
| 10 (380bytes)      | 150ms | 146ms |145ms|146ms|
| 10 (380bytes)      | 16ms | 13ms |11ms|13ms|
| 1000 (38kb)      | 201ms      |   178ms |170ms|173ms|
| 1000 (38kb)      | 89ms      |   53ms |42ms|49ms|
| 100000(3.8mb) | 4286ms      |    4103ms |2975ms|1755ms|
| 100000(3.8mb) | 4417ms      |    4116ms |2961ms|1540ms|
| 1 million (38mb)      | 49319ms      |   45908ms |34447ms|18856ms|
| 1 million (38mb)      | 44116ms      |   40448ms |29219ms|16680ms|
| 10 million (380mb) | ???      |    ??? |???|???|


那個1千萬筆的發生了下面的事件，應該是v8記憶體限制問題……小弟再究一下看看有沒有解法……請原諒我。

![](http://yixiang8780.com/outImg/20161201-1.png)



## 結語
測試出來的結果是，如果需要回傳值和錯誤詳細回傳資料的話，請選擇用`InsertMany`，
而如果是要新增例如`log`之類的可以用`Unordered Bulk`，因為掉一筆也不一定會死，
但如果是掉一筆會死的請用`Ordered Bulk`。

如果測試的方法或結語有問題的話，請和我說一下~感謝~，至於那個1千萬筆的我再研究……。

P.S 今日出來是`Bob`。


## 參考資料

* [https://docs.mongodb.com/v3.2/reference/method/db.collection.insert/](https://docs.mongodb.com/v3.2/reference/method/db.collection.insert/)
* [https://docs.mongodb.com/v3.2/reference/method/js-bulk/](https://docs.mongodb.com/v3.2/reference/method/js-bulk/)
* [https://docs.mongodb.com/v3.2/reference/method/Bulk.insert/](https://docs.mongodb.com/v3.2/reference/method/Bulk.insert/)










