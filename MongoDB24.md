# 30-24之分片Sharding(2)---Chunk的札事
在上一篇文章中說明完基本的分片概念後，我們本章節要更深的了解分片內的`chunk`，
它是每個分片組成的東西，我們這篇將要說明它的拆分與分配機制。

* `chunk`的分配與拆分。

## ~ chunk 的分配與拆分 ~
在上一篇文章中，我們知道每個分片中都包含了多個`chunk`，而每`chunk`中，又包含了某個範圍的`document`組，我們先簡單來畫個圖複習一下。

![](http://yixiang8780.com/outImg/20161224-1.png)

然後我們接下來要討論的就是，`mongodb`是如何拆分`chunk`和如何將`chunk`分片到`shard`裡，首先我們先來看看`chunk`的拆分。

### chunk 的拆分
首先我們先想一下，`chunk`它本身是一堆`document`的集合體，大概長降,我們使用上一章節的範例，來看一下`chunk`的詳細資訊，假設我們都已經分片好了，我們直接看結果。

首先我們需要先移動到一個名為`config`的資料庫。

```
use config
> switched to db config
```
然後再執行`db.chunks.find().pretty()`來看一下，目前只有一個`chunk`，它目前窩在`shard0000`，而它的範圍是`min ~ max`，呃對了忘了說，我們的資料是1萬筆的`{"name":"user"+i}`這種物件。

![](http://yixiang8780.com/outImg/20161224-3.png)

這時我們要問個問題囉，**它什麼時後會再分成另一個`chunk` ?** 

答案是`chunk`的大小，`mongodb`預設`chunk`最大限制為`64MB`，當超過時`mongos`會將它拆分為兩塊`chunk`，如下圖，此圖為官方圖片。

![](http://yixiang8780.com/outImg/20161224-2.png)

預設是`64MB`，當然我們也有辦法修改預設，指令如下，下面`32`代表為`32MB`。

```
use config
> switched to db config

db.settings.save({"_id" : "chunksize" : "value" : 32})
```
但是這邊要修改大小時有幾點要思考一下。

> `chunk` 越小時可以使分片的可以使分片的資料量更均衡，不會有差距太大的狀況，但缺點就是，因為小所以會常移動`chunk`，所以`mongos`壓力會比較重。

### chunk 的拆分實驗

咱們來簡單的測試看看`chunk`的拆分，首先來建立一些資料，大小約為`4188890 byte`大概為`4mb`左右，然後我們的`chunk`大小預設為`1mb`，所以理論上應會開拆為3~4個`chunk`。

```
var objs = [];
for (var i=0;i<100000;i++){
	objs.push({"name":"user"+i});
}
db.users.insert(objs);
```

建好後別忘了執行這兩個指令。

```
db.users.ensureIndex({"name":1})
sh.shardCollection("test.users",{"name":1})
```
然後我們指行`sh.status()`來看看結果，呃我淚囉為什麼會拆分為8個……

![](http://yixiang8780.com/outImg/20161224-4.png)

我們來檢查一下`chunk size`的設定，如下圖嗯沒錯~是`1`。

```
use config
db.settings.find()
```
![](http://yixiang8780.com/outImg/20161224-5.png)

那我們在來檢查一下資料大小是不是我們算錯，呃也沒算也，`size`為`4188890`的確是`4mb`左右。

```
user test
db.users.stats()
```
![](http://yixiang8780.com/outImg/20161224-6.png)

> 這問題目前無解，官網目前也只說當`chunk`成長到超過設定大小時會進行分拆。[傳送門](https://docs.mongodb.com/v3.0/core/sharding-chunk-splitting/)給你看。

### chunk 的分配
在說明完`chunk`的拆分後，我們要說明一下`chunk`的分配，也就是指`mongos`如何將`chunk`分配給分片。

`mongos`中有個東西叫`balancer`，這東西就是負責`chunk`的搬移，它會週期性的檢查分片是否存在不均衡，如果有不均衡情況，它就會自動開始搬遷`chunk`，你可以根據下面指令來看看`balancer`的訊息。

```
use config
db.locks.find()
```
執行結果如下，其中`who`就說明了我們的`balancer`在那個地方，我們的則是在`"who" : "LindeMBP:20006`這台上面。

![](http://yixiang8780.com/outImg/20161224-7.png)

這邊也要問題個問題，**什麼是不均衡情況?**

根據官網的說明，假設某個分片裡的`chunk`數量，多於其它的分片某個數量，就被認定為`不均衡情況`，但這邊也有個數量級距，請看下表一下，我們以第一行`小於20`這個來說明，它主要是說，當你的`chunk`數量小於20時，你的`最多chunk的分片`與`最少chunk的分片`差超過`2`時，就會開始進行搬遷。

| `chunk`數量        | 遷移閾值           | 
| ------------- |:-------------:| 
| 小於20      | 2 | 
| 20-79      | 4      |
| 大於80 | 8      |

這邊也有一點要注意。

> mongodb有提供手動分配`chunk`的功能，所以在沒打開`balancer `的情況下也可手動將`chunk`分配給其它的分片。

### chunk 分配的實作。
首先我們先來看看我們的分片狀態如何，我們執行`sh.status()`，我們可以發現，所有的`chunk`都集中在`shared0000`，正常來說應該是平均分配，為啥了? 

![](http://yixiang8780.com/outImg/20161224-8.png)

我們可以用下面指令，來檢查看看我們上面所說的`balancer`有沒有開啟。

```
use config
db.settings.find().pretty()
```
下圖為結果，你可以看到咱們的`balancer`的`stopped`為`true`，可以知道我們的`balancer`是停止的，所以咱們要用下面指令來打開來。

![](http://yixiang8780.com/outImg/20161224-9.png)

```
use config
sh.setBalancerState(true)
```
執行完後，`balancer`就是開始它的工作，來檢查分片有沒有均衡，如果不均衡就重分配，我在來執行看看`sh.status()`的結果。呼呼~分配完成`332`。

![](http://yixiang8780.com/outImg/20161224-10.png)

## ~結語~
本篇文章中，我們將上一章節所缺少的一些觀念補齊，讓我們更加的了解到分片的原理，其它包含了`chunk`的分割條件已經一些資訊查看，並且還有`chunk`如何分配到分片的說明，接下來的一篇我們將說明片鍵的策略。


## ~參考資料~
* [https://docs.mongodb.com/v3.2/tutorial/manage-sharded-cluster-balancer/#enable-the-balancer](https://docs.mongodb.com/v3.2/tutorial/manage-sharded-cluster-balancer/#enable-the-balancer)
* [https://kknews.cc/zh-tw/news/orlj8o.html](https://kknews.cc/zh-tw/news/orlj8o.html)
