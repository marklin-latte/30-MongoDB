# 30-8之CRUD的搜尋(1)…`find`與`搜尋條件`

本篇文章將要說明`find`，以及各種條件式的搜尋使用。

P.S `+u^8`~

## `find`基本說明
`mongodb`使用`find`來進行搜尋，它的第一個參數決定要那些資料，而第二個參數則決定要返回那些`key`。

基本的使用範例如下，首先我們先建立一些資料。

```
db.user.insert({"name":"mark","id":"1","age":20});
db.user.insert({"name":"steven","id":"2","age":20});
db.user.insert({"name":"jj","id":"3","age":25});
db.user.insert({"name":"bb","id":"4","age":20});

```

我們想尋找到`name`為`mark`的`document`，並且我們希望回傳值只回傳`id`這個`key`就好，搜尋指令如下。

```
db.user.find({"name":"mark"},{"id" :1 })

```

![](http://yixiang8780.com/outImg/20161206-1.png)

搜尋結果如下，它只回傳了`key id`的內容，但是可以看到`_id`也被回傳回來，因為在默認情況下`_id`這個`key`會自動被傳回來，如果真的不想它也回傳回來可以下達下列搜尋指令。

```
db.user.find({"name":"mark"},{"id" : 1,"_id":0})
```

![](http://yixiang8780.com/outImg/20161206-2.png)

## `find`的搜尋條件~
這邊我們將要說明`find`常用搜尋條件，and、or、大於等於、大於、小於、小於等於、包含、不包含，有了這些條件我們就可以更方便的尋找你所需要的`document`。

這邊簡單的整理成一張表來對應操作符號。

| 條件        | 操作符號           | 
| ------------- |:-------------:| 
| AND      | `$and`，另一種方法也可以直接在`query`中下`{"key1","value1","key2":"value2"}`| 
| OR      | `$or`      |   
| NOT      | `$not`      |
| NOR      | `$nor`      |
| 大於 | `$gt`      |   
| 大於等於      | `$gte`      |   
| 小於 | `$lt`      |    
| 小於等於      | `$lte`      |  
| 包含 | `$in`      |    
| 不包含      | `$nin`      |    


我們接下來會先產生幾筆測試資料，然後再來測試幾個搜尋故事。

測試資料如下。

```
//collection為user

{"id":"1","name":"mark","age":25,"fans":100,"likes" : 1000}
{"id":"2","name":"steven","age":35,"fans":220,"likes" : 50}
{"id":"3","name":"stanly","age":30,"fans":120,"likes" : 33}
{"id":"4","name":"max","age":60,"fans":500,"likes" : 1000}
{"id":"5","name":"jack","age":30,"fans":130,"likes" : 1300}
{"id":"6","name":"crisis","age":30,"fans":130,"likes" : 100}
{"id":"7","name":"landry","age":25,"fans":130,"likes" : 100}

```

### 我想要尋找年紀30歲以上(包含30)，但不滿60歲(不包含60)，fans又有200人以上(包含200)的人

這時就需要`$gte`、`$lt`和`and`一起用囉，這有兩種寫法。

```
//這是第一種
db.user.find(
	{"age":{"$gte":30,"$lt":60},
	 "fans":{"$gte" : 200}})
	 
//這是第二種
db.user.find(
	{"$and":[{"age":{"$gte":30,"$lt":60}},{"fans":{"$gte" : 200}}]})

```
結果如下，應該只找到`steven`這位仁兄。

![](http://yixiang8780.com/outImg/20161206-3.png)

### 我想要尋找`fans`小於等於100，或是`likes`小於100的人。

這時就需要用到`or`和`$lt`、`$lte`囉。

```
db.user.find(
	{"$or": [{"fans":{"$lte":100}},{"likes":{"$lt":100}}]})

```
結果如下，應該是找到三位`mark、steven、stanly`。

![](http://yixiang8780.com/outImg/20161206-4.png)

### 我想要尋找`age`為`25、60`的人。

這時可用`$in`。

```
db.user.find({"age":{"$in":[25,60]}})

```
結果如下，應該是找到三位`mark、max、landry`。

![](http://yixiang8780.com/outImg/20161206-5.png)

### 我想要尋找`age`不為`25、60`的人，並且只給我它的`id`就好。

這時可用`$nin`。

```
db.user.find({"age":{"$nin":[25,60]}},{"id":1})

```
結果如下~應該是會找到4位。

![](http://yixiang8780.com/outImg/20161206-6.png)

### 我想要尋找`likes`小於等於100的人(使用`$not`)
這邊事實上可以很簡單的用`$lte`，但因為我們要介紹一下`$not`所以會寫的比較麻煩點兒，
而真正可以發揮`$not`功能時，是在和正規表達式聯合使用時，用來查找不匹配的`document`。

來解釋一下這段，首先它會尋找所有`likes`大於`100`的`document`，但這時在配個`$not`就變成完全相反會變成小於等於喔。

```
db.user.find({"likes":{"$not":{"$gt":100}}})

```
所以結果應該是找到4筆。

![](http://yixiang8780.com/outImg/20161206-7.png)


### 我們想要找同時不滿足`fans`大於100人且`likes`大於500。

這邊我們可以用`$nor`來尋找，它的意思就是選出所有不滿足條件的`document`。

```
db.user.find({"$nor":[{"fans":{"$lt":100}},{"likes":{"$lt":100}}]})

```
![](http://yixiang8780.com/outImg/20161206-8.png)

## 結語
今天說明了很多的條件符號，可以簡單分成以以下兩類，邏輯符號與比較符號，運用這兩種符號就可以針對很多種情況下進行搜尋，當然還不只這些，明天將會繼續，我累了……。

|         | 操作符號           | 
| ------------- |:-------------:| 
| 邏輯符號      | `$and`、`$or`、`$or`、`not`| 
| 邏輯符號用法      | `{$xxx: [ { expression1 },{ expression2 }]}` `{ field: { $not: { <operator-expression> } } }`| 
| 比較符號      | `$gt`、`$gte`、`$lt`、`$lte`、`$in``$nin`      |   
| 比較符號用法      | `{field: {$gt: value} } ` `{ field: { $in($nin): [<value1>, <value2>, ... <valueN> ] } }`     | 

 ## 參考資料
 
 * [https://docs.mongodb.com/v3.0/reference/operator/query-geospatial/](https://docs.mongodb.com/v3.0/reference/operator/query-geospatial/)
 * [http://www.cnblogs.com/egger/p/3135847.html](http://www.cnblogs.com/egger/p/3135847.html)
 