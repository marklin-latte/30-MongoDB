# 30-10之新手村CRUD---搜尋之Cursor運用與搜尋原理

本篇文章將要說明`cursor`的用法以及一些`curosr`的方法，可以搜尋後用來限制或排序結果的功能，以及說明一下在不考慮`索引`情況下`find`的搜尋原理。

* `Cursor`是啥
* `Cursor`的方法
* 搜尋的原理

`P.S` 三分之一囉，也代表基本的`mongodb`的`crud`要`Ending`囉。

## ~ Cursor 是啥 ~

`cursor`是`find`時回傳的結果，它可以讓使用者對最終結果進行有效的控制，它事實上也就是`Iterator 模式`的實作。

除了可以控制最終結果以外，它另一個好處是可以一次查看一條結果，像之前`insertMany`時，他會一次回傳全部的結果，`mongodb shell`就會自動一直輸出，結果看不到後來執行的東西。

我們實際來看一下`cursor`的用法，首先我們還是要先新增一些資料。

```
for (var i=0;i<10;i++){
	db.test.insert({x:i})
}
```

然後進行搜尋，並用一個變數`cursor`存放。

```
var cursor = db.test.find();

while (cursor.hasNext()){
	obj = cursor.next();
	print(obj.x + " ~呼呼~")
}
```

結行結果如下圖。

![](http://yixiang8780.com/outImg/20161208-1.png)


## ~ Cursor 的方法 ~ 

`limit、skip、sort`這三個是很常用的`cursor`方法，主要功能就是限制、忽略、排序。

### limit
要限制`find`結果的數量可以用`limit`，不過注意`limit`是指定上限而不是指定下限，
使用方法如下，`limit(10)`就是代表最多只回傳`10`筆資料。

```
db.test.find().limit(10)

```
### skip
當你想要忽略前面幾筆，在開始回傳值時，就是可以用`skip`，使用方法如下，`skip(10)`，代表忽略前十筆，然後在開始回傳，不過注意『 `skip`如果數量很多時速度會變很慢 』。

```
db.test.find().skip(10)
```

### sort
`sort`它主要就是將`find`出的資料，根據條件，進行排序。

例如假設我們有以下的資料。

```
{"name":"mark" , age:20}
{"name":"steven" , age:25}
{"name":"max" , age:10}
{"name":"stanly" , age:40}
{"name":"crisis" , age:5}
```

然後我們希望可以根據`age`排序，由小到大，`{age:1}`代表由小到大，而`{age:-1}`則相反由大到小。

```
db.user.find().sort({age:1})
```

結果如下~

![](http://yixiang8780.com/outImg/20161208-2.png)

### 三個都可以一起使用
這三個條件我們都可以一起使用，例如，你希望尋找先忽略前10筆，並且數量限制為50筆，最後在進行排序，則指令如下。

```
db.test.find().skip(10).limit(50).sort({x:1})
```

## ~ 搜尋的原理 ~

在不考慮有索引`(下一篇會開始說)`的條件下，`mongodb`會如下圖一樣開始搜尋。

![](http://yixiang8780.com/outImg/20161208-4.png)

所以說如果你要找的值是放在資料的最後面，你找到的時間會最久，給個程式實驗看看。

首先來個測試資料。

```
for (var i=0; i<1000000;i++){
	db.test.insert({"x":i})
}
```

來我們來測試看看找到`{"x" : 1}`和`{"x": 999999}`速度會差多少，其中加`limit(1)`是因為只讓它尋找第一個，如果沒限制它會一直繼續找，看還有沒有符合的，這樣兩者速度是相等的，因為都是全文掃描，而`explain("executionStats")`是叫`mongodb`列出詳細的執行結果。

```
db.test.find({"x" : 1}).limit(1).explain("executionStats")

db.test.find({"x" : 999999}).limit(1).explain("executionStats")
```

首先看看下圖，是 `{ "x" : 1 }`的，可以看到執行時間幾乎沒有，而掃描的`document`之有`2`，也就是只找兩個`document`就找到`{ "x" :1 }`，而那兩個就是` { "x" : 0 } 和 { "x" : 1 }`。

![](http://yixiang8780.com/outImg/20161208-5.png)

然後我們在來看看 `{ "x" : 999999 }`的結果，執行時間`413ms`差距和`{"x":1}`差距實在很大，而它幾乎要全部掃描完`document`才找到 `{ "x" : 999999 } `，難怪會著麼慢。

![](http://yixiang8780.com/outImg/20161208-6.png)

## ~ 結語 ~

或許會有人問我，為什麼要把搜尋原理放在搜尋的最後才講，這個麻，因為突然想到…… ， 不過我個人是比較喜好先寫的出來，在來想它的原理，這種道理就像大學如果一開始先教資料庫的正規化，然後才開始學著麼用資料庫的道理是一樣 ~ 不過這也只是個人的想法 ~  

呼 ~ 今天鐵人賽總於進行了三分之一了，也終於將`mongodb`的基本`CRUD`都『簡單』的說明一下，記好是『簡單』，如果是『詳細』的話那大概30天都在寫它了，這樣太無趣了。

## ~ 參考資料 ~

* [http://www.mongoing.com/eshu_explain3](http://www.mongoing.com/eshu_explain3)
* [https://docs.mongodb.com/v3.0/reference/method/js-cursor/](https://docs.mongodb.com/v3.0/reference/method/js-cursor/)
