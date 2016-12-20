# 30-19之運用研究---PO文模擬情境(2)
上篇文章中，咱們已經將資料都建立好了，也完成了第一個需求，使用者可以進行`PO`文，並且我們建立出了模擬資料共一百萬筆，大約`1gb`的大小，接下來我們這篇文章將繼續完成需求，為了怕讀者們忘了需求，所以還是在貼一次。

## ~需求說明~
我們這邊想要簡單的模擬FB的貼文，我們可以新增貼文或做一些事情，並且我們希望還可以進行一些貼文分析，最後這項模擬會建立在有100萬筆下貼文的情況下，所以我們簡單的先列出我們可以用的功能。

1. 使用者可以簡單的新增發文，並且會存放`Text`、`Date`、`Author`、`likes`、`Message`。 `(完成)`
2. 建立`100`萬筆模擬`po`文。`(完成)`
3. 使用者可以刪除發文。
4. 使用者可以對自已的po文進行更新。
5. 使用者可以進行留言和刪除留言。
6. 使用者可以`like`發文。
7. 使用者可以根據`Text`、`Author`、`likes`、`Date`進行搜尋。
8. 管理者可以速行分析個案(那些個案之後再想)


### Step5 (需求3) 使用者可以刪除發文
這個刪除的方法事實上不太難，使用者只要輸入該`po`文的`objectId`就可以進行刪除，當然如果是實際有畫面的當然是直接給你選你要刪除的發文，不會還叫你輸入`objectId`，程式碼如下。

```
db.posts.remove ({"_id" : "xxxxxxx"})

```
不過在使用刪除時有些事情也要想一下，如果是指定`objectId`來刪除，理論上來說只會刪除一個，並且速度很快，因為`objectId`系統會自動的幫我們建立索引，但如果是其它的`query`則可能要根據情況來考慮要不要建立索引，來幫助刪除的更快速，並且如果要刪除多筆資料別忘了使用`bulk`。

```
var bulk = db.posts.initializeUnorderedBulkOp();
bulk.find( { "name": "mark" } ).remove();
bulk.execute();
```

> 刪除方面可以看看[這篇文章](http://ithelp.ithome.com.tw/articles/10185336)來複習複習 ~ 

### Step6 (需求4) 使用者可以對自已的po文進行更新
這個也很`easy`~，就只是針對它的`objectId`進行搜尋然後更新就好，在做的過程中我們需要使用修改器`$set`，它的功能就是只針對指定的欄位進行修改~別忘囉~ ,

```
db.posts.update({"_id":"XXXXX"},
	{"$set" : { "text" : "Hello World" }
)
```
> 更新複習請看[這篇](http://ithelp.ithome.com.tw/articles/10185147)~

### Step7 (需求5) 使用者可以針對po文進行留言和刪除
先來回想一下我們的`posts`結構長啥樣子，如下~ 

```
{
	"id" : 1,
	"text" : "XXXXXX",
	"date" : "20160101",
	"author" : "mark" ,
	"likes" : 1,
	"messages" : [
		{"author" : "steven" , "msg" : "what fuc." , "date" :20160101},
		{"author" : "ian" , "msg" : "hello world java","date":20160101}
	]
}
```
所以說我們如果想要留言，嚴格來說是針對該po文的`messages`陣列欄位，新增一個物件。
還記得陣列欄位的修改器`$push`嗎 ? 它可以讓我們在該陣列最後面新增個物件。

```
db.posts.update({ "_id" : "XXXXX"},
	{ "$push" : { 
		"messages" : { "author" : "mark" , 
						  "hello word" , 
						  "date" : 20160101 } 
		} 
	}
)

```

那假如咱們留言打錯了，要刪除掉要著麼做 ? 就用這個修改器`$pull`針對該留言`id`就行刪除就OK囉。

```
db.posts.update({ "_id" : "XXXXX"},
	{"$pull" : { "messages" : { "msgId" : "XXXXXX"}}
})
```

> 陣列欄位方面的更新請[參考這篇](http://ithelp.ithome.com.tw/articles/10185254)~

### Step8 使用者可以`like`貼文(需求6)
`like`這功能，就只是要修改`like`這欄位的數量，每次執行一次都是`+1`，這時就很適合使用更新的修改器`$inc`，完成 ~ 

```
db.posts.update({"_id" : "XXXXX"},{ "$inc" : { "likes" :  } })
```

### Step9 使用者可以根據`Text`、`Author`、`likes`、`Date`進行貼文搜尋。

嗯……這個需求總算是來囉，搜尋這個需求非常的常見，但可以非常簡單的完成，但也有難到會讓你罵髒話的難，用熊來比喻一下，小時後看起來勾錐勾錐的，但長大時看到牠請快跑並且跑的時後順到求神拜佛一下，不然牠會讓你不要不要的。

開始吧~首先我們要先想想`索引`要著麼建，咱們可以確定`text`要用全文索引來建立，因為我們要根據單詞來尋找它，再來是`author`與`date`這兩個可以一起建立，並且考慮常排序的欄位我們應該要將建立`date`先行的索引，因為我們常用來尋找最新或最舊的資料，而`likes`這獨立建立個索引，因為它排序與搜尋都很常會用到。

根據以上的推論，我們用來建立索引的指令如下。

```
db.posts.ensureIndex({ "text" : "text" });
db.posts.ensureIndex({ "date" : 1,"author" : 1 });
db.posts.ensureIndex({ "likes" : 1 })
```

確定以上的索引都建立好後，我們可以來試試搜尋了。

> 索引方面請參考這三篇

* [30-11之索引(1)---索引的哩哩扣扣](http://ithelp.ithome.com.tw/articles/10185673)
* [30-12之索引(2)---複合索引的坑](http://ithelp.ithome.com.tw/articles/10185768)
* [30-13之索引(3)---比較特別的索引使用](http://ithelp.ithome.com.tw/articles/10185871)

#### 首先是根據`text`來進行搜尋。

我們來試這搜尋看看，貼文中有`dog`這單詞的`po`有多少篇。

```
db.posts.find({ "$text" : { "$search" : "dog" }}).explain("executionStats")
```
啊喲真夠多……。
```
110593
```

結果如下，啊喲~沒想到有`607`筆，並且只花了`4ms`的有結果囉~果然有索引就是快。

![](http://yixiang8780.com/outImg/20161219-1.png)

但我們發覺回傳筆數太多了，所以限制一下筆數為前10筆就好，這樣就ok囉~

```
db.posts.find({ "$text" : { "$search" : "dog" }}).limit(10)
```

然後著麼多筆再給他根據日期來排序一下，OK~這需求完成~

```
db.posts.find({ "$text" : { "$search" : "dog" }})
		.sort({"date" : 1})
		.limit(10)
```
#### 根據`author`來進行搜尋。
咱們來試試`mark`這位潮男po了多少篇文章。

```
db.posts.find({ "author" : "mark"}).count()
```

#### 根據`likes`來找出最受歡迎的po文
如果要找出最受歡迎的po文，也代表`likes`數最大，那只要用排序然後取第一個就ok囉~

```
db.posts.find().sort({"likes" : -1}).limit(1)
```
![](http://yixiang8780.com/outImg/20161219-2.png)

#### 找尋最新的po文
嗯~這也非常的簡單，如下，結果就懶貼囉……

```
db.posts.find().sort({"date" : 1}).limit(1)
```

## ~結語~
今天先到這邊，基本上都只是在將前幾篇文章的東西拿來使用，而搜尋方面你只要索引有建立好，那不論是搜尋或排序速度在100萬筆資料下速度都飛快~1秒都不到，從這邊可知索引真的很重要的~

`P.S` 我可以了解被追稿的感覺了，辛苦了所有有襖追稿的職業~ `+u` ~  