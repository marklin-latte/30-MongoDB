# 30-30之這三十天的學習總結

不知不覺~漫長的鐵人賽就進入了尾聲，當初會參加鐵人賽也只是因為，沒參加過 ~ 來試試看，而且也剛好我今年的時間比較多點兒，話說回來，為什麼我會選`MongoDB`來當題目呢?事實上也只是因為我自已無聊在做的專案，有把`mongoDB`拿來用，所以就想說認真的來研究一下`mongoDB` ~ 

我們簡單的總結一下我們這三十天學了那些東西。

首先最基本的一定是一個資料庫的`CRUD`，這階段就像玩天堂時的說話島一樣，你要打打哥布林。

* [30-3之新手村CRUD---新增](http://marklin-blog.logdown.com/posts/1392616--30-3-new-crud-released)
* [30-4之新手村CRUD---新增之Bulk與新增效能測試](http://marklin-blog.logdown.com/posts/1392642)
* [30-5之新手村CRUD---更新](http://marklin-blog.logdown.com/posts/1392773)
* [30-6之新手村CRUD---更新之陣列欄位](http://marklin-blog.logdown.com/posts/1392802)
* [30-7之新手村CRUD---刪除](http://marklin-blog.logdown.com/posts/1393739-novice-village-crud-of-30-7mongodb-delete)
* [30-8之新手村CRUD---搜尋之find與搜尋操作符號](http://marklin-blog.logdown.com/posts/1393753-novice-village-crud-of-30-8mongodb-search-the-find-and-search-operation-symbol)
* [30-9之新手村CRUD---搜尋之陣列欄位與regex](http://marklin-blog.logdown.com/posts/1393776-30-9-new-array-field-of-the-crud-search-regex)
* [30-10之新手村CRUD---搜尋之Cursor運用與搜尋原理](http://marklin-blog.logdown.com/posts/1393789-30-10mongodb-crud-novice-village-search-cursor-using-the-principles-of-and-search-for)

然後在基礎的新手村畢業以後，你就可以坐船前往大陸，不過下船的地方在那我有點忘了，
接下來我們要學習的事情就是，要如何的使我們搜尋速度更快速。

* [30-11之索引(1)---索引的哩哩扣扣](http://marklin-blog.logdown.com/posts/1394035-30-11-index-of-mongodb-1-button)
* [30-12之索引(2)---複合索引的坑](http://marklin-blog.logdown.com/posts/1394050-30-12-index-of-mongodb-2-composite-index)
* [30-13之索引(3)---比較特別的索引使用](http://marklin-blog.logdown.com/posts/1394068-30-13-index-of-mongodb-3-special-indexes)

在我們了解了如何將搜尋速度提升更快後，我們就可以來研究如何使用`mongodb`來進行資料分析，這個階段就像是龍之谷吧……年代有點久遠有點快忘了。

* [30-14之聚合(1)---Aggregate Framework的哩哩扣扣](http://marklin-blog.logdown.com/posts/1394100-mongodb-polymerization-of-30-14-1-aggregate-framework-with-buckle)
* [30-15之聚合(2)---Pipeline武器庫](http://marklin-blog.logdown.com/posts/1394127)
* [30-16之聚合(3)---潮潮的MapReduce](http://marklin-blog.logdown.com/posts/1394143-30-16-polymerization-of-3-the-drying-of-mapreduce)
可以分析後，我們發覺有些，地方效能還不是不太好，明明索引那些都處理好囉 ? 這時我們只能往架構方面來解決。

* [30-17之MongoDB的設計---正規與反正規化的戰爭](http://marklin-blog.logdown.com/posts/1394159-mongodb-30-17-design-the-formal-war-with-anti-normalization)

在以上的東西都已經學習的差不多時，這時我們就要來驗證一下，我們是否真的有學習進腦袋裡，這時最簡單的驗證方法，就是自已想個題目，然後從`0 → 1 `自已建立看看。順到一題[`0 → 1`](http://www.books.com.tw/products/0010651050)這本書真的不錯看。

* [30-18之運用研究---PO文模擬情境(1)](http://marklin-blog.logdown.com/posts/1394193)
* [30-19之運用研究---PO文模擬情境(2)](http://marklin-blog.logdown.com/posts/1394219-mongodb-30-19-study-po-simulation-of-use-situations-2)
* [30-20之運用研究---PO文情境模擬(3)](http://marklin-blog.logdown.com/posts/1394233-mongodb-30-20-study-po-simulation-3)

在驗證完以上的東西都學習會後，我們可以往分散式的東西進行學習囉，這邊應該就是傲慢之塔的等級囉。

* [30-21之MongoDB的副本集 replica set(1)](http://marklin-blog.logdown.com/posts/1394442-30-21-mongodb-replica-set-replica-set-1)
* [30-22之MongoDB的副本集 replica set(2)---使用Docker建立MongoDB Cluster](http://marklin-blog.logdown.com/posts/1394457-30-22-mongodb-replica-set-replica-set-2-using-the-docker-build-mongodb-cluster)
* [30-23之分片Sharding(1)---Hello Sharding](http://marklin-blog.logdown.com/posts/1394470-mongodb-30-23-sliced-sharding-hello-sharding)
* [30-24之分片Sharding(2)---Chunk的札事](http://marklin-blog.logdown.com/posts/1394490-mongodb-30-24-patch-sharding-2-chunk)
* [30-25之分片Sharding(3)---片鍵的選擇](http://marklin-blog.logdown.com/posts/1394504-mongodb-30-25-patch-sharding-3-key-choices)

然後接下來的最後一部份也是驗證你上面的東西有沒有學會。

* [30-26之運用研究---股價應用模擬(1)](http://marklin-blog.logdown.com/posts/1394511)
* [30-27之運用研究---股價應用模擬(2)](http://marklin-blog.logdown.com/posts/1394543-30-27-mongodb-applications-price-simulation-2)
* [30-28之運用研究---股價應用模擬(3)](http://marklin-blog.logdown.com/posts/1394562)

事實上到這邊應該就可以結束了，但我事實上有忘記一個主題，所以補充在最後面。

* [30-29之補充---忘了講的事務操作](http://marklin-blog.logdown.com/posts/1394578)

### 30天結束~~~~~

> 最後忘了講幾句感言的話，事實上我很感謝上天，還能給予我可以參加30天鐵人賽的腦袋與體力，2016年應該是我目前的人生轉哲最大的年度，我生了一場重病，我得的病就是你們腦袋中最不想得的病排行板前三名，癌症 ~ 啊喲啊喲 ~ 小的才2開頭而以 ~ 啊喲啊喲 ~ 得這病是真的失去不少東西，而且治療過程，有時後我會想，似乎上天堂好像會輕鬆點兒，上一句只是完笑，得這鬼病也只有一條路，面對現實就對囉~
> 
> 不過呢~我是想和有看過這篇文章的人說，請好好珍惜你的『正常的生活』，所謂的正常生活就是你們覺得一切很正常的事情，但對我們生病的人來說『正常的生活』是很奢侈的，不過我算幸運，還可以回到50%的正常生活，至少還可以讓我寫寫程式，看看書。
> 
> 最後呢~送給看過的這篇文章的幾個建議，首先請保持充足的睡眠，再來是充足的運動，最後是健康的飲食，這樣至少你的『正常生活』才可長久， 記好好好覺、好好動、好好吃 ~。

## 30天正式結束
