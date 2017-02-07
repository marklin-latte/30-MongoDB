# 30-3之新手村CRUD---新增

安裝好`MongoDB`後，接下來本篇主要說明如何新增資料至`MongoDB`中，而用更精確的詞彙來說是，如何新增`document`至`collection`中。這邊我們會說明以下幾種`MongoDB`所的方法，來建立資料, 並說明這三種有何不同，而至於效能部份請看下篇~

* `Insert`
* `InsertOne`
* `InsertMany`

## ~ `Insert`方法 ~
---
### 單筆資料Insert

`insert`函數可以將一個`document`建立到`collection`裡，我們這裡建立一個簡單的範例來看如何使用`insert`。

首先我們的需求是要建立一份使用者清單`(collection)`，然後可以存放多筆使用者資料`(document)`，我們假設使用者資料如下。

順到一提，`mongodb`自帶`javascript shell`，所以可以在`shell`執行`javascript` 一些語法。

```
user1 = {
	name : "Mark",
	age : 18,
	bmi : 10
}

```

然後我們要將這筆`document`新增至`user`的`collection`裡。

```
db.user.insert(user1);
```

新增完後，我們可以執行`find`指令，來查看`user`這`collection`中的資料。

```
db.user.find()
```
程式執行過程如下圖，而回傳值如下，代表成功新增一筆。

```
WriteResult({"nInserted" : 1})
```


![](http://yixiang8780.com/outImg/20161130-1.png)

### 多筆資料Insert

`Insert`函數同時也可以執行多筆，但效能好不好下篇會有比較。其中注意`insert`有個參數`ordered `，`true`時代表如果其中一筆資料有問題，它就會停止下來，後面的資料都不會新增，而`false`時，則代表不會停下來，後面的資料會繼續新增，預設是`true`。

我們用下面範例來看看使用方法。

```
var user1 = {
	name : "Mark",
	age : 18,
	bmi : 10
},
count = 1000,
users = [];

for (var i=0;i<count;i++){
	users.push(user1);
}

db.user.insert(users,{ordered:false})
```

結果如下圖。

![](http://yixiang8780.com/outImg/20161130-3.png)


## ~ `InsertOne`方法 ~
---
`InsertOne`函數事實上用法和`insert`差不多，只有兩點不同，首先是回傳，`insertOne`會回傳你所建立的`document`的`ObjectId`，`ObjectId`是系統自動生成的，是唯一值，而第二點不同就如同它的名字，他只能一次新增一筆。

我們來試試下列範例。

```
user1 = {
	name : "Mark",
	age : 18,
	bmi : 10
}

db.user.insertOne(user1);
```

從結果可以看到他回傳了該筆資料的`ObjectId`。

![](http://yixiang8780.com/outImg/20161130-2.png)

## ~ `InsertMany`方法 ~
---
InsertMany函數是`mongodb 3.2`版時新增的，用法也和`insert`函數差不多，但比較不同的是他的回傳值如下，他會回傳所有所建立的`documnet`的`ObjectId`。

```
{
   "acknowledged" : true,
   "insertedIds" : [
      ObjectId("562a94d381cb9f1cd6eb0e1a"),
      ObjectId("562a94d381cb9f1cd6eb0e1b"),
      ObjectId("562a94d381cb9f1cd6eb0e1c")
   ]
}
```

以下為範例，來看看他的使用方法。

```
var user1 = {
	name : "Mark",
	age : 18,
	bmi : 10
},
count = 10,
users = [];

for (var i=0;i<count;i++){
	users.push(user1);
}

db.user.insertMany(users,{ordered:false})

```

執行過程與結果如下。

![](http://yixiang8780.com/outImg/20161130-4.png)

## ~ 結語 ~
---
這三種方法事實上用法大同小異，有時只差在回傳值，如果需要回傳`ObjectId`的話就用`insertMany`或`insertOne`，不需要的話就用`insert`就行了，對了還有這三個方法如果要新增到的`collection`不存在的話會自動幫你建立，至於速度方法我們將於下一篇做比較。

P.S 不要愛上我的Kevin ~ 


## ~ 參考資料 ~
---
* [http://stackoverflow.com/questions/36792649/whats-the-difference-between-insert-insertone-and-insertmany-method](http://stackoverflow.com/questions/36792649/whats-the-difference-between-insert-insertone-and-insertmany-method)
* [https://docs.mongodb.com/v3.2/reference/method/db.collection.insertOne/](https://docs.mongodb.com/v3.2/reference/method/db.collection.insertOne/)
* [https://docs.mongodb.com/v3.0/reference/write-concern/](https://docs.mongodb.com/v3.0/reference/write-concern/)
* [https://docs.mongodb.com/v3.2/reference/method/db.collection.insert/](https://docs.mongodb.com/v3.2/reference/method/db.collection.insert/)

