# 30-15之聚合(2)---`pipeline`表達式
在上一篇文章中說明了`pipeline`操作符號，接下來我們這篇要說明，在操作符號內使用的`pipeline`表達示，也就是說可以進行計算、比較、字串修改等。

* 數學表達式(mathematical expression)
* 日期表達式(date expression)
* 字串表達式(string expression)
* 邏輯表達式(logical expression)

## ~數學表達式~
以下列表為比較常用的數學表達式([全部在這](https://docs.mongodb.com/v3.2/meta/aggregation-quick-reference/#arithmetic-expressions))。

| 表達式        | 說明           | 
| ------------- |:-------------:| 
| `$add`      | 接受多個表達式，然後相加。|
| `$subtract`      |  接受兩個表達式，用第一個減去第二個作為結果。     | 
| `$multiply`| 接受多個表達式，然後相乘。      |
| `$divide`      |接受兩個表達式，然後相除。 |
| `$mod`      | 接受個表達式，然後相除取餘。     |

我們來看看實際上是如何運用，假設我們有下列資料，該資料為訂單資料。

```
{ "id" : 1 , "price" : 100 , "count" : 20, "discount" : 0 },
{ "id" : 2 , "price" : 200 , "count" : 20, "discount" : 100 },
{ "id" : 3 , "price" : 50 , "count" : 20, "discount" : 100 },
{ "id" : 4 , "price" : 10 , "count" : 210, "discount" : 200 },
{ "id" : 5 , "price" : 100 , "count" : 30, "discount" : 20 }
```
### 我們想要知道我們總收入是多少。
這個應用中，我們希望知道總收入是多少，根據收入公式。

```
每筆訂單收入 = price * count - discount 
```
然後我們在將他拆解成`pipeline`過程，我們使用先算出每筆訂單收入，再加總起來。

1. 將每筆訂單的收入計算出並存放在`income`欄位。
2. 將所有訂單`income`欄位加總起來，並存放在`total`欄位。

根據以上步驟我們可以產生出聚合方法。

```
db.order.aggregate ({ 
	"$project" : {
		  "id" : 1 , 
		  "income" : { "$subtract" :
		  		[ { $multiply : [ "$price","$count"] } , "$discount"] 
		  }
	},{
	$group : {
			"_id" : null,
			"total" : { $sum : "$income"}
		}
	}
})
```
結果如下。

```
{ "_id" : null, "total" : 11680 }
```

>雖然這個範例只運用到少數幾個表達式，但事實上用法都大同小異，只要會了一個基本上其它的運用起來也會很順。

## ~日期表達式~
這種類型的表達式，大部份都是用來將一串日期轉化成你想要的單位例如月、日、年等，

| 表達式        | 說明           | 範圍 |
| ------------- |:-------------:| :-------------:|
| `$year`      |轉換成年 ex.2016 。|NO|
| `$month`      |  轉換成月 ex. 1 (代表一月)     | 1~12 | 
| `$week`| 轉換成星期 ex. 1 (代表該年第一個星期)      | 0~53 |
| `$dayOfMonth`      |轉換成該月的第n天 ex. 1 (代表該月第一天) | 1-31 |
| `$dayOfYear`      | 轉換成該年的第n天 ex. 1 (代表該年第一天)     | 1-366 |
| `$dayOfWeek`| 轉換成該星期的某一天 ex. 1 (星期一)      | 1(星期日)~7(星期六) |
| `$hour`      |提取出該時間的小時 | 0~23 |
| `$minute`      | 提取出該時間的分鐘     | 0~59 |
| `$second`      | 提取出該時間的秒     | 0~60 |

我們來看看實際轉換的結果，假設我們有下列資料。

```
{ "_id" : 1, "date" : ISODate("2016-01-02T08:10:20.651Z") }
```
### 我們想取得`date`的詳細資料。

```
db.test.aggregate({
	$project : {
		"year" : { $year : "$date" },
		"month" : { $month  : "$date"},
		"week" : { $week : "$date"},
		"dayOfMonth" : { "$dayOfMonth" : "$date" },
		"dayOfYear" : { "$dayOfYear" : "$date"},
		"dayOfWeek" : { "$dayOfWeek" : "$date"},
		"hour" : { "$hour" : "$date"},
		"minute" : { "$minute" : "$date"},
		"second" : { "$second" : "$date"}
	}
})
```
結果如下，其中`week`為`0`是因為它是從第0周開始，而`dayOfWeek`為`7`代表當天是星期六。

```
"2016-01-02T08:10:20.651Z"
{
	"_id" : 1,
	"year" : 2016,
	"month" : 1,
	"week" : 0,
	"dayOfMonth" : 2,
	"dayOfYear" : 2,
	"dayOfWeek" : 7,
	"hours" : 8,
	"minute" : 10,
	"second" : 20 

}
```

## ~字串表達式~
就是將聚合中的字串做一些哩哩扣扣的事情。

| 表達式        | 說明           | 
| ------------- |:-------------:| 
| `$substr`      | 可以『只』取得某字串的一個範圍。|
| `$concat`      |  將指定的字串連在一起。    | 
| `$toLower`| 變小寫。      |
| `$toUpper`      |變大寫。 |
| `$strcasecmp`      | 比較兩個字串是否相等，如果相等為0，如果字串ASCII碼大於另一字串則為1，否則為-1。     |

下面是我們的資料。

```
{ "item" : "ABC", "describe":"AAbbcc"},
{ "item" : "BCE" , "describe":"hello WorD"},
{ "item" : "CAA" , "describe":"BBCCaa"}
```

### 我們想知道那個`item`開頭為`B`的`document`，並且輸出的`describe`要全轉換為小寫。

我們可以根據問題，來將之拆分為以下步驟。

1. 取得每個`item`的第一個值，並存放在`temp`欄位中。
2. 並且每個`temp`與`B`進行比較，比較結果放在`result`欄位中。
3. 篩選出`result`為`0`的`document`。
4. 將該`document`的`describe`欄位轉換成小寫。

```
db.test.aggregate(
{
	$project : { "describe" : 1, "temp" : {"$substr":["$item",0,1]} }
},
{
	$project : { "describe" : 1, "result" : {"$strcasecmp":["$temp","B"]}}
},
{ $match : { "result" : 0 } },
{ $project : { "describe" : { "$toLower" : "$describe" } } }
)
```

執行結果如下。

```
{ 
	"_id" : ObjectId("58500f0d7fac2213af387c9c"), 
	"describe" : "hello word" 
}
```

## ~邏輯表達式~
下面是些比較常使用的邏輯表達式列表。

| 表達式        | 說明           |使用| 
| :------------- |:-------------| :-------------|
| `$cmp`      | 比較expr1與2，相同為0，1>2為1，相反則為-1 。| `"$cmp":[expr1,expr2]`| 
| `$eq`      |  一樣比較expr1與2，但相同則返回`true`否則為`false`。 |`"$eq":[expr1,expr2]`|
| `$lt、$lte`| 小於和小於等於      | `"$lt" : value`|
| `$gt、$gte`      |大於和大於等於 | `"$gt" : value`|
| `$and`| 所有表達式都為`true`，則回傳`true`      |`"$and":[expr1,expr2..]`|
| `$or`      |其中一個表達式為`true`，則回傳`true` |`"$or" : [expr1,expr2..]`|
| `$not`      |   針對表達示取反值  |`"$not" : expr`|
| `$cond`      | 就是一般程式裡的`ifelse` |`"$cond":[boolExpr,trueExpr,falseExpr]`|

我們來看看使用範例，首先一樣，先看看我們有的資料，如下。

```
{ "id":1,"class" : "1", "price" : 10,"count" : 180},
{ "id":1,"class" : "1" ,"price" : 10,"count" : 350},
{ "id":1,"class" : "2" ,"price" : 10,"count" : 90},
{ "id":1,"class" : "2" ,"price" : 10,"count" : 320},
{ "id":1,"class" : "2","price" : 10,"count" : 150}
```
### 我想要計算出每筆訂單的實際收入，其中當數量大於200時打八折，最後在依`class`進行分組，算出各組的總收入。

1. 全部的訂單先判斷折扣率，並存放在`discount`裡。
2. 計算每分訂單的收入，並存放在`total`裡。
3. 根據`class`進行分組，並計算各組的總收入，存放在`result`裡。

```
db.orders.aggregate(
{	
// 1. 全部的訂單先判斷折扣率，並存放在`discount`裡。
	"$project" : { 
		"class" : 1,
		"price" : 1,
		"count" : 1,
		"discount" : {
			"$cond" : [{ $gte: [ "$count", 200 ] },0.8,1]
		}
	}
},
{
// 2. 計算每分訂單的收入，並存放在`total`裡。
	"$project" : {
		"class" :1,
		"total" : { "$multiply" : ["$price","$count","$discount"] }
	}
},
{ 
// 3. 根據`class`進行分組，並計算各組的總收入，存放在`result`裡。
	"$group" : { "_id" : "$class" , "result" : {"$sum" : "$total"} }
})

```
結果如下。

```
{ "_id" : "2", "result" : 4960 },
{ "_id" : "1", "result" : 4600 }
```

## ~結語~
本章介紹了很多的表達式，也都用實際的範例來介紹如何使用，不過也只是用很基本的方法，
如果要更熟練的使用這些表達式，筆者建議進行更多的實例練習，以及在練習時也要持續思考有沒有更好更快的方法，那相信你不需要多久的時間，就能很熟練囉。

## ~參考資料~
* [https://docs.mongodb.com/manual/reference/operator/aggregation/cond/](https://docs.mongodb.com/manual/reference/operator/aggregation/cond/)
* [https://docs.mongodb.com/v3.2/reference/operator/aggregation/strcasecmp/#exp._S_strcasecmp](https://docs.mongodb.com/v3.2/reference/operator/aggregation/strcasecmp/#exp._S_strcasecmp)
* [http://stackoverflow.com/questions/17044587/how-to-aggregate-sum-in-mongodb-to-get-a-total-count](http://stackoverflow.com/questions/17044587/how-to-aggregate-sum-in-mongodb-to-get-a-total-count)