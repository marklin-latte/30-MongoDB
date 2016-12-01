# 30-1 MongoDB基礎

由於是第一天，所以基本上就是要文言文一下，說明一下`mongodb`是啥。

## 什麼是MongoDB

`MongoDB`一種強大，靈活、且易於擴展的文件導向式(document-oriented)資料庫，與傳統的關聯式導向資料庫相比，它不再有`row`的概念，取而代之的是`document`的概念，如下圖的fu。

![](http://yixiang8780.com/outImg/20161128-2.png)


## MongoDB的優缺與缺點


### 優點
* Schema-less : MongoDB擁有非常彈性的`Schemam`，這對RDBMS來說非常的難以高效能的方法來實現。
*  易於擴展 : MongoDB的設計採用橫向擴展，它的`document`的數據模型使寫能很容易在多台伺服器之間進行數據分割。
*  優透的性能 : MongoDB能預分配，以利用額外的空間換取穩定，同時盡可能把多的內存用作cache，試圖為每次查詢自動選擇正確的索引。


### 缺點
* 不支援事務操作 : 所以通常不適合應用在銀行或會計這種系統上，因為不包證一致性。
*  占用比較多空間 : 主要是有兩個原因，首先是它會預分配空間，為了提高效能，而第二個原因是欄位所占用的空間。


## MongoDB的組成`Document`與`Collection`


### Document
`Document`是`mongodb`的核心，它就是`Key`對應個`Value`組合，例如下列範例。

	{
		name : "mark".
		age : 100 , 
		title : 'Mark BIG BIG'
	}

`document`中的值可以是多種不同的類型，並且`Key`有幾個規定，首先它是區分大小寫，例如下面的範例這兩種是不同的，`mongodb`會存成兩份`document`。
	
	{ name : "mark" }
	{ Name : "mark" }

而另一個規定是`Key`不能相同的，例如下面的範例是非法的。

	{ age : "100" , age : "1000" }

### Collection

`Collection`就是一組`Document`，如果把它用來與關聯式資料庫比較，他就是`Table`裡面存放了很多`Row`。

`Collection`是動態的，這代表這一個`collection`裡的`document`可以是各種類型，例如下面這幾種文檔都可以存放在同一個`collection`裡，不像關聯式規定的好好。

	{ id :1, name : "mark" }
	{ age : 100 }
	

整體而言他們兩個關係長這樣。

![](http://yixiang8780.com/outImg/20161128-2.png)


## 結語
第一天，沒啥好結語的fu，只能說`+u`，給所有參賽者。

## 參考資料

* [http://www.adathedev.co.uk/2011/02/thoughts-on-mongodb-from-sql-server-dev.html](http://www.adathedev.co.uk/2011/02/thoughts-on-mongodb-from-sql-server-dev.html)
* [https://read01.com/BznRQJ.html
](https://read01.com/BznRQJ.html)
* [http://stackoverflow.com/questions/5244437/pros-and-cons-of-mongodb](http://stackoverflow.com/questions/5244437/pros-and-cons-of-mongodb)
* [https://docs.mongodb.com/manual/](https://docs.mongodb.com/manual/)
