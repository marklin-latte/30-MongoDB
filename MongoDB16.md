# 30-16之聚合(3)---潮潮的MapReduce
前兩篇說明完`mongodb`所提供的第一種聚合工作`aggregate framework`，本篇文章將要說明`mongodb`所提供的第二種聚合工作，`MapReduce`，嗯…只要有微微研究過大數據，應該都有聽個這個潮潮的名詞，尤其應該有不少人有看過這篇『[我是如何向老婆解释MapReduce的？](http://blog.jobbole.com/1321/)』，不過它原文版好像消失了，扣惜。

## ~MapReduce~
`MapReduce`是`google`所提出的軟體架構，主要用來處理大量的數據，而`mongodb`根據它的架構建構出可以在`mongodb`中使用的聚合工作，`MapReduce`它可以將一個複雜的問題拆分為多個小問題(`map`)，然後發送到不同的機器上，完成時再合併為一個解決方案(`reduce`)，簡單的畫張圖來看看。

![](http://yixiang8780.com/outImg/20161216-1.png)

但這個方法和`aggregate framework`有什麼差別 ? 

> `aggregate framework` 提供較優透的性能。
> 
> `MapReduce`性能較差，但可提供更複雜的聚合功能。

## ~ Mongodb 的 MapReduce 使用~
`mongodb`中的`MapReduce`使用的方法如下。

```
db.collection.mapReduce(
    map,    
    reduce, 
    {
        <out>,    
        <query>, 
        <sort>,   
        <limit>,  
        <finalize>, 
        <scope>
    }
)
```
其中參數的說明如下。

| 參數        | 說明           |
| ------------- |:-------------:|
| `map`      | `map`函數，主要功能為產生`key`給`reduce`。 |
| `reduce`      | `reduce`函數。      |
| `out` |    輸出結果集合的名稱。   |
| `query`      | 在`map`前，可用`query`先進行篩選。      |
| `sort` |      在`map`前，可用`sort`進行排序。 |
| `limit`      | 在`map`前，可限制數量。      |
| `finalize` |  可以將`reduce`的結果，丟給某個`key`。     |
| `scope`      | 可以在js中使用變數。      |

### 實際應用1 ~ 根據 class 分組計算每組訂單收入
是的，這個例子我們在`aggregate framework`時有用過，事實上這種簡單的例子用`MapReduce`來解決，有點用到牛刀了，不過我們只是要看看如何使用，所以就不用在意太多囉。

先看看我們有的資料。

```
{ "class" : "1", "price" : 10,"count" : 180},
{ "class" : "1" ,"price" : 10,"count" : 350},
{ "class" : "2" ,"price" : 10,"count" : 90},
{ "class" : "2" ,"price" : 10,"count" : 320},
{ "class" : "2" ,"price" : 10,"count" : 150}
```
然後因為我們要根據`class`進行分組，所以我們`map`的拆分基礎就是`class`，
而`reduce`要做的工作就是將`map`出的結果進行運算，詳細的`MapReduce`過程請看下圖。

首先是`map`的工作，它將`colleciton`中的`document`根據`map`函數進行歸納成`Key , Values`的結構。
![](http://yixiang8780.com/outImg/20161216-2.png)

然後在使用`Reduces`函數，進行運算。
![](http://yixiang8780.com/outImg/20161216-3.png)

以下為合在一起的程式碼。

```
var result = db.orders.mapReduce(
    function(){ 
    	var total = this.price * this.count
    	emit(this.class,total) 
    },
    function(key,values){ 
      var total = 0 ;
      for(var i=0;i<values.length;i++){
        total += values[i];
      }
       return total;
    },
    { out : "test" }
)

```
然後如果這時想看執行結果可以輸入下列指令，其中`result`為一個`collection`，是由`Reduces`所產生出的最後結果。

```
result.find()
```
結果如下。

```
{ "_id" : "1", "value" : 5300 }
{ "_id" : "2", "value" : 5600 }
```

### 實際應用2 ~ 根據 class 進行分組，並且我們只想知道 2 與 3 的總收入，並且加上 dollar 單位。

這個應用事實上有不少做法，這裡我們的作法是先用`query`篩選出`2`與`3`，然後在來計算它們的總收入，最後在用`finalize `來加上`dollar`。

首先看看我們有的資料。

```
{ "class" : "1", "price" : 10,"count" : 180},
{ "class" : "1" ,"price" : 10,"count" : 350},
{ "class" : "2" ,"price" : 10,"count" : 90},
{ "class" : "2" ,"price" : 10,"count" : 320},
{ "class" : "2" ,"price" : 10,"count" : 150},
{ "class" : "3" ,"price" : 10,"count" : 100},
{ "class" : "3" ,"price" : 10,"count" : 200},
{ "class" : "3" ,"price" : 10,"count" : 300}
```
程式碼如下，事實上這個範例我們只是要看`query`和`finalize`的用法，這些事實上也可以寫在`map`或`reduces`裡……。

```
var result = db.orders.mapReduce(
    function(){ 
    	var total = this.price * this.count
    	emit(this.class,total) 
    },
    function(key,values){ 
      var total = 0 ;
      for(var i=0;i<values.length;i++){
        total += values[i];
      }
       return total;
    },
    { out : "test",
      query : { class : {"$in" : ["2","3"]} },
      finalize : function(key, reducedVal){
        reducedVal = reducedVal + " dollar ";
		 return reducedVal;
      }
    }
)
```
結果如下。

```
{ "_id" : "2", "value" : "5600 dollar " }
{ "_id" : "3", "value" : "6000 dollar " }
```

## ~結語~
本篇文章簡單的說明`mongodb`中的`MapReduce`的用法，但還沒有說明到資料量大時要如何使用，這方面就在後面講完分片的概念後，將會一起說明。

## ~參考資料~
* [https://docs.mongodb.com/manual/core/map-reduce/](https://docs.mongodb.com/manual/core/map-reduce/)
* [https://zh.wikipedia.org/zh-tw/MapReduce](https://zh.wikipedia.org/zh-tw/MapReduce)
