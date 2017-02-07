# 30-5之新手村CRUD---更新

本篇將要來說明`MongoDB`中更新文檔的方法，並且也同時會說明更新修改器的功能，它能幫助我們進行更有效率的更新。

* 基本更新方法`Update`。
* 更新修改器 (`$set`、`$inc`)。
* 更新修改器效能比較。

## ~ 基本更新方法`Update` ~
---
`Update`函數主要的功用就如同字面所說，更新~，而使用方法如下，`query`就是指你要先尋找更新的目標條件，`update`就是你要更新的值。而另外三個參考請考下列。

* upsert : 這個參數如果是`true`，代表如果沒有找到該更新的對像，則新增，反之則否，默認是`false`。
* multi : 如果是`false`，則代表你`query`出多筆，他就只會更新第一筆，反之則都更新，默認是`false`( !注意`multi`只能在有`修改器`時才能用 )。
* writeConcern : 拋出異常的級別。

```
db.collection.update(
   <query>,
   <update>,
   {
     upsert: <boolean>,
     multi: <boolean>,
     writeConcern: <document>
   }
)
```

下面來簡單示範一下用法。首先我們先新增三筆資料。

```
db.user.insert({"name":"mark","age":23});
db.user.insert({"name":"steven","age":23});
db.user.insert({"name":"jj","age":23});
```

然後我們將名字為`mark`這人的`age`改為`18`，指令如下，`query`為`{"name":"mark"}`，`query`的詳細用法會在`find`那邊詳詳細細的說明。

```
db.user.update({"name":"mark"},{"name":"mark","age":18})
```

執行結果如下，不過誒……我只要更新`age`也，為啥要全部換掉?

![](http://yixiang8780.com/outImg/20161202-1.png)

## ~ 更新修改器 (`$set`、`$inc`) ~
---
### 修改器`$set`
`$set`修改器主要的功用就是用來指定一個字段的值，不用像上面一樣整個替換掉。

所以如我們如果要將`mark`這位仁兄的`age`改為`18`只要下達下面的指令。

```
db.user.insert({"name":"mark","age":23});
db.user.insert({"name":"steven","age":23});
db.user.insert({"name":"jj","age":23});

db.user.update({"name":"mark"},{"$set" : { "age" : 18} })
```

執行結果如下，成功更新為`age為18`

![](http://yixiang8780.com/outImg/20161202-2.png)


### 修改器`$inc`
---
假設一下情景，假如有個投票網站、或是要存放訪客數的功能，每次更新時都是要`+1`，這種時後就可以用`$inc`來更新你的`document`，理論上來說速度應該會優於`$set`，等會兒會來測試一下。

注意`$inc`只能用在數值類型，否則就會提示`Modifier $inc allowed for numbers only`。

我們寫段程式碼來看看他的使用方法，下面範例我們先新增一筆資料，然後我們每次更新時，`like`都會加`1`，所以我們更新`3`次，理論上`like`會變為`3`。

```
db.home.insert({"id" : 1 ,"like" : 0})

db.home.update({"id" : 1},{"$inc" : {"like" : 1}})
db.home.update({"id" : 1},{"$inc" : {"like" : 1}})
db.home.update({"id" : 1},{"$inc" : {"like" : 1}})
```

執行結果如下，可以看到`like`增加到`3`了。

![](http://yixiang8780.com/outImg/20161202-3.png)

## ~ `$set`與`$inc`效能測試 ~
---
假設一個情況，有個功能是存放訪客`like`數，一樣每次更新時都是要`+1`，我們這時來比較看看，來看看那個更新較快，測試的環境一樣使用`nodejs`。

本測試會新增一筆資料然後更新`n`次。如果`n`為`10`則更新結果要如下。

![](http://yixiang8780.com/outImg/20161202-4.png)

以下為程式碼，程式碼會放在此[MyGithub](https://github.com/h091237557/30-MongoDB/tree/master/Test/30-5)。

程式碼簡單的說一下，首先會先用`bulk insert`來建立一筆資料，然後接下來在產生`n`個更新的`promise`，最後用`promise all`等所以`promise`都更新完後，再結束計時。

```
debugger;
var mongodb = require('mongodb');

var mongodbServer = new mongodb.Server('localhost', 27017, {
  auto_reconnect: true,
  poolSize: 10
});

var db = new mongodb.Db('test', mongodbServer);
var count = 10;
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
            
		var funcs = [];
		udpateUseInc().then((res) => {
		console.time("update use $inc");
		  for (var j = 1; j < count+1;j++) {
			 funcs.push(updateUseInc(1));	
      	  }
		  Promise.all(funcs).then((res) => {
           console.timeEnd("update use $inc");
		  });
		})

    });
	function updateUseInc() {
		return new Promise((resolve,reject) => {
			
         collection.update({
         		 "name": "steven"
       	 }, {
       	   "$inc": {
        		  "Like": 1 
       	 }
       	 }, function(err, res) {
				resolve();
         });
	   });	
	}
  });
});
```

測試結果，`$inc`在更新數據時，完全贏過`$set`。

| 測試案例(更新次數)       | $set           | $inc  |
| :-------------: |:-------------:| :-----:|
| 10      | 39ms | 19ms |
| 1000      | 317ms      |   257ms |
| 10000 | 4159ms      |    3206ms |
| 50000 | 31893ms      |    15929ms |
| 100000 | 154861ms      |    129684ms |

## ~ 結語 ~
---
事實上寫這篇時，一開始發現為啥`$inc`執行時間總是大於`$set`，不符合預期，一直覺得怪怪的後來查來了一下發現`update`這方法執行時會`lock`住`DB`，所以上面的程式碼，第二個`updateUseInc`要先執行一次確定`updateUseSet`完畢後才開始計時。

P.S  `+u^5`之我感冒囉…


## ~ 參考資料 ~
---
* https://docs.mongodb.com/v3.0/faq/concurrency/


