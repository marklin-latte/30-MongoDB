# 30-12之索引(2)---複合索引
本文將會說明以下幾點

* 複合索引是啥
* 複合索引的運用

## ~複合索引~
假設有下列資料。

```
{ "name" : "mark" , "age" : 20}
{ "name" : "mark" , "age" : 25}
{ "name" : "steven" , "age" : 30}
{ "name" : "max" , "age" : 15}

```
在上一篇文章中，如果要建立`name`的索引，是像下面這樣。

```
db.user.ensureIndex({"name" : 1})
```
這時`mongodb`就會大致上將索引建成如下。

```
索引目錄         存放位置
["mark"]    -> xxxxxxxx
["mark"]    -> xxxxxxxx
["max"]     -> xxxxxxxx
["steven"]  -> xxxxxxxx

```
而所謂的`複合索引`事實上就是只是針對多個欄位建立索引，如下。

```
db.user.ensureIndex({"name" : 1 , "age" : 1})
```

而`mongodb`就會建立索引如下。

```
索引目錄         存放位置
["mark",20]    -> xxxxxxxx
["mark",25]    -> xxxxxxxx
["max",15]     -> xxxxxxxx
["steven",30]  -> xxxxxxxx

```
>索引的值是按一定順序排序的，因此使用索引鍵對`document`進行排序非常的快。

## ~複合索引的使用與注意事項~
在前一篇文章中有說過，索引是把雙刃刀，建立的不好反而會浪費更多資源，而複合索引更是雙刃刀中連握把可能都有刀刃，以下舉個例子來說明說明。

假設我們有以下的資料

```
{ "name" : "mark00" , age:20  }
{ "name" : "mark01" , age:25  }
{ "name" : "mark02" , age:10  }
{ "name" : "mark03" , age:18  }
{ "name" : "mark04" , age:26  }
{ "name" : "mark05" , age:40  }
{ "name" : "mark06" , age:51  }
{ "name" : "mark07" , age:20  }
{ "name" : "mark08" , age:51  }
{ "name" : "mark00" , age:30  }
{ "name" : "mark00" , age:100  }

```
這時我們要來思考一件事情，我們是要建立索引`{ "name" : 1, "age" :1 }`還是`{"age":1,"name" :1 }`，這兩個是不同的。

首先下列索引列表為 `{ "name" : 1, "age" :1 }`，索引的值都按一定順序排序，所以它會先依`name`的值進行排序，然後相同都在按`age`進行排序。

``` 
db.user.ensureIndex({ "name" : 1 , "age" : 1 })

["mark00",20] -> xxxxxxx 
["mark00",30] -> xxxxxxx 
["mark00",100] -> xxxxxxx 
["mark01",25] -> xxxxxxx  
["mark02",10] -> xxxxxxx  
["mark03",18] -> xxxxxxx  
["mark04",26] -> xxxxxxx  
["mark05",40] -> xxxxxxx  
["mark06",51] -> xxxxxxx  
["mark07",20] -> xxxxxxx  
["mark08",51] -> xxxxxxx  

```
然後在來是`{ "age": 1 , "name" : 1 }`的索引列表

```
db.user.ensureIndex({ "age": 1 , "name" : 1 })

[10,"mark02"] -> xxxxxxx
[18,"mark03"] -> xxxxxxx
[20,"mark00"] -> xxxxxxx
[20,"mark07"] -> xxxxxxx
[25,"mark01"] -> xxxxxxx
[26,"mark04"] -> xxxxxxx
[30,"mark00"] -> xxxxxxx
[40,"mark05"] -> xxxxxxx
[51,"mark06"] -> xxxxxxx
[51,"mark08"] -> xxxxxxx
[100,"mark00"] -> xxxxxxx
```
這兩種所建立出來的索引會完全的不同，但這在搜尋時會有什麼差呢，首先我們先來試試看下列的搜尋指令會有什麼不同。

### 情境1 

我們執行下列的指令來進行搜尋，主要就是先全部抓出來，然後在根據`age`進行排序。

```
db.user.find({}).sort({"age" : 1})
```

首是`{ "name" : 1, "age" :1 }`的索引尋找過程與執行結果，`memUsage : 660` 代表有使用到內存進行排序。

執行過程
![](http://yixiang8780.com/outImg/20161210-3.png)

執行結果
![](http://yixiang8780.com/outImg/20161210-1.png)

再來看看`{ "age": 1 , "name" : 1 }`的執行過程與執行結果。

執行過程
![](http://yixiang8780.com/outImg/20161210-4.png)

執行結果
![](http://yixiang8780.com/outImg/20161210-2.png)

>是的，明明都有建立索引，但只有`{ "age": 1 , "name" : 1 }`有利用到索引進行排序，而另一個還是需要用到內存來進行排序，主因就在於`age`先行的索引，它本來就依照`age`的大小先排序好，而`name`先行的索引，只先排序好`name`，後排序`age`，但後排序的`age`只是在同樣`name`下進行排序，所以如果是找『全部』的資料再進行排序，`age`先行較快。

### 情境2 

```
db.user.find({"name" : "mark00"}).sort({"age" : 1})
```
先來看看 `{ "name" : 1, "age" :1 }`的執行過程與結果，有使用索引進行尋找。

執行過程
![](http://yixiang8780.com/outImg/20161210-7.png)

執行結果
![](http://yixiang8780.com/outImg/20161210-5.png)

再來看看`{ "age": 1 , "name" : 1 }`的執行結果，也有使用索引進行尋找。

執行過程
![](http://yixiang8780.com/outImg/20161210-8.png)

執行結果
![](http://yixiang8780.com/outImg/20161210-6.png)

>從上面兩張結果可以看出，他們都有使用到索引進行搜尋與排序，但`name`先行的索引只花了3次就得出結果，而`age`先行的卻花11次才得出結果，主要原因`name`先行的`name`已經排序好，三個`mark00`就堆在一起，要找到全部的`mark00`非常快，而`age`先行的就要全部慢慢找，才能找出全部的`mark00`。

## ~結語~
從上面的實驗可知，在實際應該時`{ "sortKey" : 1 , "queryKey" : 1 }`是很有用的，也就是說如果你的該欄位很常被排序或是排序很耗時，在建立索引時請放至到前面。

還有另一點，當你建立`{"name" : 1, "age" : 1}`時，等同於建立了`{"name" : 1}`和`{"age" : 1}`，他們都可以用索引來搜尋`name、age`，但注意，這種建法排序索引只能用在上`name`。

## ~參考資料~
* [https://docs.mongodb.com/v3.2/indexes/](https://docs.mongodb.com/v3.2/indexes/)
