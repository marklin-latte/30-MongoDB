# 30-6之新手村CRUD---更新之陣列欄位攻略

本篇文章將要說明陣列修改器`$push`，主要就是針對`document`中的陣列進行修改，同時他也可以搭配`$each`、`$slice`、`$ne`、`$addToSet`、`$pop`、`$pull`來使用。

* 陣列更新修改器攻略

呼好多……

## ~ 陣列更新修改器攻略 ~
---
### `$push`

`$push`是陣列修改器，假如一個`document`中已經有陣列的結構，使用`push`會在陣列的尾末加入一個新元素，要是本來就沒有這個陣列，則會自動新建一筆。

使用方法如下範例，首先先新增一筆資料，然後新增加一個叫`jack`的`fans`。

```
	db.user.insert({
		"name" : "mark",
		"fans" : ["steven","crisis","stanly"]
	})
	db.user.update({"name":"mark"},
		{$push:{"fans" : "jack"}
	})
```

結果如下圖。

![](http://yixiang8780.com/outImg/20161204-1.png)

### `$each`

`$push`一次新增只能新增一筆元素，而搭配`$each`就可以新增多筆。

使用方法如下範例，一樣首先新增一筆資料，然後這時我們一次新增三個`fans`分別為`jack`、`landry`、`max`。

```
	db.user.insert({
		"name" : "mark",
		"fans" : ["steven","crisis","stanly"]
	})

	db.user.update({"name":"mark"},
		{"$push" : {"fans" : {"$each" : ["jack","lnadry","max"]}}}
	)
```

結果如下圖

![](http://yixiang8780.com/outImg/20161204-2.png)

### `$slice`

如果你希望限制一個陣列的大小，就算多`push`進元素，也不要超過限制大小，這時你就可以用`$slice`，不過注意它是保留最後`n`個元素。

使用方法如下範例，新增一筆資料，然後我們希望`fans`人數不超過`5人`，但我們硬多塞一個人進去。

```
	db.user.insert({
		"name" : "mark",
		"fans" : ["steven","crisis","stanly"]
	})

	db.user.update({"name":"mark"},
		{"$push" : {"fans" : 
			{"$each" : ["jack","lnadry","max"],
			 "$slice" : -5 }}}
	)
```

執行結果如下，可以看到第一位`steven`被刪除，只保留了最後5位。

![](http://yixiang8780.com/outImg/20161204-3.png)

### `$addToSet`

你可能有這個需求，假設你要新增一個元素到陣列裡，並且保證陣列內的元素不會重複，這時就可以使用`$addToSet`。

使用方法如下範例，新增一筆資料，然後`fans`有`steven、landry、stanly`，這時我們在新增`steven`和`jack`進去，預期應該`steven`不會被新增進去，也就是不會產生兩個`steven`。

```
	db.user.insert({
		"name" : "mark",
		"fans" : ["steven","crisis","stanly"]
	})
	
		db.user.update({"name":"mark"},
		{"$addToSet" : {"fans" : 
			{"$each" : ["steven","jack"] }}}
	)
```

執行結果如下，符合預期。

![](http://yixiang8780.com/outImg/20161204-4.png)

### `$pop`與`$pull`

`$pop`與`$pull`這兩個修改器都是用來刪除元素用的，`$pop`可以從頭或尾刪除，而`$pull`則是基於特定條件來刪除。

先來看看`$pop`的使用範例。其中`"fans":1`代表從`fans`陣列尾刪除`"fans":-1`則從陣列頭刪除。

```
	db.user.insert({
		"name" : "mark",
		"fans" : ["steven","crisis","stanly"]
	})
	
	db.user.update({"name":"mark"},
		{"$pop" : {"fans":1}}
	)

```

下圖為執行結果。

![](http://yixiang8780.com/outImg/20161204-5.png)

這時我們在來看看`$pull`用法，假設我們要將`crisis`這`fans`刪除，使用方法如下。

```
	db.user.insert({
		"name" : "mark",
		"fans" : ["steven","crisis","stanly"]
	})
	
	db.user.update({"name":"mark"},
		{"$pull" : {"fans":"crisis"}}
	)
```

執行結果如下圖

![](http://yixiang8780.com/outImg/20161204-6.png)

## ~ 結語 ~
---
今天說了不少個修改器簡單的進行總結一下。

* 要將元素丟進陣列時可用`$push`。
* 要將『多個』元素丟進陣列時可搭配`$each`。
* 要限制陣列大小時請用`$slice`。
* 要保證陣列內容不重複請用`$addToSet`。
* 要刪除陣列元素請用`$pop`和`$pull`。

結束……又快要燒起來的`fu`，`+u^6`。
 
## ~ 參考資料 ~
---
* [https://docs.mongodb.com/v3.2/reference/operator/update-array/](https://docs.mongodb.com/v3.2/reference/operator/update-array/)