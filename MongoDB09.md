# 30-9之CRUD搜尋(2)---陣列欄位與regex的搜尋
 
本篇文章將要說明其它幾個搜尋方法，包含如何搜尋`document`中的陣列欄位的值以及運用正規表達式`regex `來進行搜尋。

## ~搜尋陣列內容~
這邊我們將要介紹幾個陣列搜尋符號`$all`、`$size`、`$slice`。

| Tables        | Are           | 
| :-------------: |:-------------:| 
| `$all`      | 當需要尋找多個元素節合的`document`時，就可以使用它 | 
| `$size`      | 當要尋找特定長度的陣列時，就可以用它~      |  
| `$slice` | 可以指定回傳的陣列指定的範例 ex. `10`就為前十條，`-10`就為後十條。      |  
| `$elemMatch` | 它會只針對陣列，進行多組`query`。      |

假設情況我們資料庫中有下列`document`。

```
{"id":"1","name":"mark",
	"fans":["steven","stanly","max"],
	"x":[10,20,30]};

{"id":"2","name":"steven",
	"fans":["max","stanly"],
	"x":[5,6,30]};

{"id":"3","name":"stanly",
	"fans":["steven","max"],
	"x":[15,6,30,40]};

{"id":"4","name":"max",
	"fans":["steven","stanly"],
	"x":[15,26,330,41,1]};


```

### 我們這時想要尋找`fans`中同時有`steven`、`max`的網紅
我們這時就可以使用`$all`。

```
db.user.find({"fans":{"$all":["steven","max"]}})

```
結果如下，應該是只找到`mark、stanly`這兩個人。

![](http://yixiang8780.com/outImg/20161207-1.png)

### 我們想要尋找`fans`總共有三位的網紅。
我們這時可以用`$size`，不過有點可惜的一件事，`$size`無法與搜尋條件(ex.`$gte`)使用，所以無法尋找3人以上之類的，通常要來實現這種需求就只能多加個欄位了。

我們來看看`$size`的使用方法。

```
db.user.find({"fans":{"$size" :3}})

```

![](http://yixiang8780.com/outImg/20161207-2.png)

### 我們希望尋找`mark`的第一個`fans`。
`$slice`主要功能就是將陣列切割只回傳你指定的範例。

```
db.user.find({"name":"mark"},{"fans":{"$slice":1}})

```

![](http://yixiang8780.com/outImg/20161207-3.png)

### 我們想要尋找`x`中至少有一個值為大於30小於100的網紅。

```
db.user.find({"x":{"$elemMatch" : {"$gt" : 30 , "$lt" : 100}}})

```

![](http://yixiang8780.com/outImg/20161207-4.png)

## ~正規表達式搜尋~
`mongodb`當然有提供正規表達式的搜尋，如果你正規表達式夠強，那幾乎可以直接找到你所有想要的資料。

測試資料如下，事實上和上面一樣。

```
{"id":"1","name":"mark",
	"fans":["steven","stanly","max"],
	"x":[10,20,30]};

{"id":"2","name":"steven",
	"fans":["max","stanly"],
	"x":[5,6,30]};

{"id":"3","name":"stanly",
	"fans":["steven","max"],
	"x":[15,6,30,40]};

{"id":"4","name":"max",
	"fans":["steven","stanly"],
	"x":[15,26,330,41,1]};


```

### 我們想要尋找`name`為`s`開頭的網紅。

```
db.user.find({"name":/^s/})

```
結果如下，應該會尋找到`steven、stanly`。

![](http://yixiang8780.com/outImg/20161207-5.png)

### 我們想要尋找`fans`中有包含`m`開頭的網紅。

```
db.user.find({"fans": /^m/})

```
結果如下，應該會尋找到`mark、steven、stanly`三位。

![](http://yixiang8780.com/outImg/20161207-6.png)

## ~結語~
本章說明了陣列欄位的搜尋方法，同時也簡單的說明正規表達式的搜尋，這些方法都很重要，
往後幾章時都還有可能繼續用到。

P.S 終於復活囉……
 
## ~參考資料~
* [https://docs.mongodb.com/manual/reference/operator/query/elemMatch/#op._S_elemMatch](https://docs.mongodb.com/manual/reference/operator/query/elemMatch/#op._S_elemMatch)
* [https://docs.mongodb.com/manual/reference/operator/query/all/](https://docs.mongodb.com/manual/reference/operator/query/all/)
* [https://atedev.wordpress.com/2007/11/23/%E6%AD%A3%E8%A6%8F%E8%A1%A8%E7%A4%BA%E5%BC%8F-regular-expression/](https://atedev.wordpress.com/2007/11/23/%E6%AD%A3%E8%A6%8F%E8%A1%A8%E7%A4%BA%E5%BC%8F-regular-expression/)
* [https://docs.mongodb.com/getting-started/shell/query/](https://docs.mongodb.com/getting-started/shell/query/)