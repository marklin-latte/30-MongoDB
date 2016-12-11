# 30-13之索引---特殊索引
本篇文章將要說明幾個比較特別索引如下。

* 索引陣列欄位
* 索引子欄位
* 全文索引

`P.S` 快要一半囉~~`+u^13`

## ~索引陣列欄位~

假設你有下列資料，但發現搜尋`fans`裡的值很慢，你想要建立索引，要著麼建呢?

```
{ "name" : "mark" , "fans" : ["steven","jack","mmark"]}
{ "name" : "steven" , "fans" : ["max","jack","mmark"]}
{ "name" : "jack" , "fans" : ["steven","hello","mmark"]}
```
事實上就和之前幾篇建立索引一樣。

```
db.user.ensureIndex({"fans":1})
```

那我們在再假設資料如下。

```
{ "name" : "mark" , 
  "fans" : [ 
    {"name" : "a" , "age" :11},
    {"name" : "b" , "age" :10},
    {"name" : "c" , "age" :21},
  ]
},
{ "name" : "steven" , 
  "fans" : [ 
    {"name" : "e" , "age" :10},
    {"name" : "f" , "age" :20},
    {"name" : "c" , "age" :21},
  ]
}
```
這時如果我們建立`fans`裡的`name`為索引，指令會如下。

```
db.user.ensureIndex({"fans.name":1})
```
通過以上的方法就可以很簡單的將陣列欄位建立索引，但要是有幾點要注意。

> * 陣列索引的代價比一般的索引高，因為它需要更新的更多。
>* 一個索引中的陣列只能有一個，這是為了避免索引爆炸性增長。

根據第二個注意點，我們來解釋一下，假設你有一個索引為`{ "a" : 1 , "b" : 1 }`
那麼下表會列出他的合法與否。

| 資料        | 合法與否           | 
| ------------- |:-------------:|
| `db.test.insert({ "a" : 1, "b" : 2 })`    | OK | 
| `db.test.insert({ "a" : [1,2,3] , "b" : 2 })`     | OK      |   
| `db.test.insert({ "a" : [1,2,3] , "b" : [1,2,3]})` | NO      |    

因為如果`a`有`n`個元素，而`b`有`m`個元素，那索引就會建立`n * m`個索引列表，會爆炸，所以才有這限制。

## ~索引子欄位~
假設有下列資料。

```
{ "name" : "mark",
  "address" : {
     "city" : "taipei",
     "zip" : 100,
  }
}
```
如果我們需要在`city`這子欄位上建立索引，可下達該指令。

```
db.user.ensureIndex({"address.city" : 1})
```
>注意，`{"address" : 1}`與 `{"address.city" : 1}`這兩種是不同的，
對主欄位建立索引，只能用下列指令，才能使用索引進行查詢。

```
db.user.find({ "address" : { "city" : "taipei" , "zip" : 100 }})
```
而無法使用如下的搜尋，除非索引為`{"address.city" : 1}`。

```
db.user.find( {"address.city" : "taipei" })
```
## ~全文索引~
`mongodb`中有一種專門用來搜尋`全文`的索引，前面有一篇有說到可以用正規表達式來進行搜尋，但它的缺點就在於大型全文的速度會非常慢，而且無法處理語言的理解。

以下有兩點要注意。
>* 創建全文索引的成本非常高，建議是在離線狀況下建立全文索引。
>* 目前不支援中文。

### 全文索引使用方法
假設測試資料如下。

```
{
   "id" : 1,
   "post_content" : "Indexes support the efficient execution of queries 
    		      in MongoDB"
},
{
   "id" : 2,
   "post_content" : "MongoDB can use the index to limit the number of
                  documents it must inspect."

},
{
	"id" : 3,
	"post_content" : "hello word"
}


```
然後我們來建立全文索引。

```
db.posts.ensureIndex({post_content:"text"})
```

當建立好索引後，我們就可以使用索引來進行搜尋，例如我們想要找出有包含`mongodb`單詞的文章。

```
db.posts.find({ "$text" : { "$search" : "mongodb" }})
```
執行結果如下，找到了兩筆，並且可以知道在全文索引中是不分大小寫的。

![](http://yixiang8780.com/outImg/20161211-1.png)

而如你想要精確的查詢例如尋找`mongodb can`，則可以用雙引號括起來，如下。

```
db.posts.find({ "$text" : { "$search" : "\"mongodb can\"" }})
```

結果如下。

![](http://yixiang8780.com/outImg/20161211-2.png)

而如想要要尋找`mongodb`或`word`的`document`，則如下

```
db.posts.find({ "$text" : { "$search" : "mongodb word" }})
```
結果如下，呃不小心多建立一個`id:3`。

![](http://yixiang8780.com/outImg/20161211-3.png)

## ~結語~
今天這篇簡單的說明下幾個比較特別但卻常用的索引，其中全文索引這邊事實上蠻多人不推用`mongodb`來建立索引，主因還是因為中文的關係，大部份還是建議用`elasticseach`或`Sphinx`，`elasticsearch`是真的不錯用，很多單詞都會解析，速度也快，目前在全文索引中還真看不出`mongodb`有啥優勢的~個人感想~

## ~參考資料~
* [https://docs.mongodb.com/v3.2/core/index-multikey/](https://docs.mongodb.com/v3.2/core/index-multikey/)
* [https://www.zhihu.com/question/19856707](https://www.zhihu.com/question/19856707)
* [https://docs.mongodb.com/v3.2/reference/operator/query/text/#op._S_text](https://docs.mongodb.com/v3.2/reference/operator/query/text/#op._S_text)