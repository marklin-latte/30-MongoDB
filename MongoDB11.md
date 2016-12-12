# 30-11之索引的哩哩扣扣
本篇文章將會說明以下幾點。

*  什麼是索引?
*  索引的優點與缺點
*  索引與非索引搜尋比較

P.S  `+u^11`鐵人們 ~ 事實上我已快gg了

## ~什麼是索引~
索引是什麼?最常見的說法是，一本字典中，你要找單字，會先去前面的索引找他在第幾頁，是的這就是索引，可以幫助我們更快速的尋找到`document`，下面畫張圖來比較一下不使用索引和使用索引的搜尋概念圖。

![](http://yixiang8780.com/outImg/20161209-1.png)

## ~索引的優缺點~
索引竟然可以幫助我們著麼快的找到目標，那是不是以後都用索引就好??著麼可能!~
索引好歸好，但他就像雙刃刀，用的不好會gg的。

### 優點
* 搜尋速度更(飛)快 ~
* 在使用分組或排度時更快 ~

### 缺點
* 每次進行操作(新增、更新、刪除)時，都會更費時，因為也要修改索引。
* 索引需要佔據空間。

### 使用時機
所以根據以上的優缺點可知，不是什麼都要建立索引的，通常只有下列時機才會使用。

* 搜尋結果佔原`collection`越小，才越適合(下面會說明更清楚)。
* 常用的搜尋。
* 該搜尋造成性能瓶頸。
* 在經常需要排序的搜尋。
* 當索引性能大於操作性能時。


## ~建立索引~
我們簡單建立個索引使用範例。

```
db.tests.insert( {"x" : "hello"} )

```
然後這時我們建立`x`欄位的索引。

```
db.tests.ensureIndex({ "x" : 1 })

```
然後我們可以達行下列指令，來查看有沒有建立成功。

```
db.tests.getIndexs()

```
結果如下，建立成功`x`的索引，其中`_id`那個是預設的，`mongodb`會自動幫`objectId`建立索引。

![](http://yixiang8780.com/outImg/20161209-2.png)

## ~索引排序與不用索引排序差別~
在`mongodb`中排序是非常的耗費內存資源，如果排序時內存耗費到`32mb`([這裡](https://docs.mongodb.com/v3.0/tutorial/sort-results-with-indexes/))，`mongodb`就會報錯，如果超出值，那麼必須使用索引來獲取經過排序的結果。

>索引的值是按一定順序排序的，因此使用索引鍵對`document`進行排序非常的快。

我們這裡建立先資料，來比較看看兩者的資源耗費不同點。

```
for (var i=0;i<100000;i++){
	db.test.insert({
		"x" : i
	})
}
```
然後建立`x`的索引。

```
db.test.ensureIndex({ "x" : 1 })

```

然後我們在有索引與無索引的情況下指行下列指令。

```
db.test.find({ "x" : {"$gt" : 50000}})
		.sort({"x" : -1})
		.explain("executionStats")
```
首先來看看`無索引`的，可知它耗用了不少的內存，並且速度也比較慢。

![](http://yixiang8780.com/outImg/20161209-3.png)

在來看看`有索引`的，由於有使用到索引進行排序，所以不需要在內存中進行排序。

![](http://yixiang8780.com/outImg/20161209-4.png)

>從上面兩張圖的結果可知有用索引的速度較快，也較省內存，但要注意並不是建立了索引就代表它一定會用索引排序，這在下一章複合索引會提到。


## ~不要使用索引的時機~
我們這邊將使用時機的`搜尋結果佔原collection越小，才越適合`來進行分析一下。

### 我們來試試結果佔原`collection`比大於60%會如何
我們這邊將要來驗證一下，在這種情況下，索引搜尋和全文搜尋(未使用索引)那個比較快。

首先來建立資料一百萬筆，然後有`60%`的`x`都為`1`。

```
for (var i=0;i<1000000;i++){
	var value = (i<600000)?"1":"2" ;
	db.test.insert({
	  "x" : value
	})
}

```
然後建立`x`的索引。

```
db.test.ensureIndex({ "x" : 1 })

```
然後我們來比較看看兩者的搜尋速度，我們要尋找`x`為`1`的。

首先看看沒有用索引的速度，嗯…`418ms`

![](http://yixiang8780.com/outImg/20161209-5.png)

在來看看有索引的速度，嗯…`657ms`

![](http://yixiang8780.com/outImg/20161209-6.png)


>從上面結果可看出有用索引的比較慢，主要原因為他要先去掃索引然後，再去找全文，正常情況下索引會比較快，但是如果`結果`佔`原collection`比過多時就會發生索引反而比較慢。
>
>所以記好當你要找的結果可能會佔你原資料太多部份的，請不要用索引 ~

## ~結語~
索引是一把雙刃刀，用的好的話效能非常的好，用的不好就和大便一樣，所以要學好~

## ~參考資料~
* [https://docs.mongodb.com/v3.0/tutorial/sort-results-with-indexes/](https://docs.mongodb.com/v3.0/tutorial/sort-results-with-indexes/)
* [https://kknews.cc/zh-tw/other/xpp5mg.html](https://kknews.cc/zh-tw/other/xpp5mg.html)
* [http://www.mongoing.com/eshu_explain3](http://www.mongoing.com/eshu_explain3)
* [https://docs.mongodb.com/v3.0/core/indexes-introduction/](https://docs.mongodb.com/v3.0/core/indexes-introduction/)





