#30-23之分片Sharding---Hello Sharding
本篇文章將要說明`mongodb`的`分片`，上一章節說明了如何將資料同步到其它台節點上，而本篇文章是將要說明，如何將資料分割到其它台節點，讓我們可以更快速、更多容量空間的來做一些哩哩扣扣的事情。

* 分片原理。
* 分片實作。

## ~分片原理~
分片是啥 ? 它主要的概念就是將`collection`拆分，將其分散到不同的機器，來分擔單一`server`的壓力。

咱們先來看看我們平常單一`server`的`mongodb`結構，其中`mongod`就代表我們實際上存放資料的地方，它平常都是指令和`client`端通信，`client`就有點像咱們平常用的`mongodb shell`之類的。

![](http://yixiang8780.com/outImg/20161223-1.png)

而咱們在來看看，如果用了分片會變啥樣，如下圖，三個`mongod`都會統一通信到`mongos`，在和`client`進行通訊，`mongos`不存儲任何資料，它就是個路由`server`，你要什麼資料就發給它，它在去決定去那個`mongod`裡尋找資料。

![](http://yixiang8780.com/outImg/20161223-2.png)

那這邊有個問題來囉~這三個`mongod`要著麼決定誰要存放那些資料 ? 答案是下面標題`片鍵`~

### 片鍵`Shard Keys`

片鍵是啥 ? 它就是當你要進行分片時，你選定的`collection`切分的依據，假設我們有下面的資料。

```
{ "name":"mark" , "age" :18}
{ "name":"steven" , "age" :20}
{ "name":"ian" , "age" :20}
{ "name":"jack" , "age" :30}
{ "name":"stanly" , "age" :31}
{ "name":"jiro" , "age" :32}
{ "name":"hello" , "age" :41}
{ "name":"world" , "age" :52}
...
...
...
{ "name":"ho","age" : 100}
```
它就有可能會分片成這樣，假設咱們拆分為三片，然後我們指定片鍵為`age`欄位，它就大致上可能會分成這樣，會根據片鍵建立`chunk`，然後再將這堆`chunk`分散到這幾個分片中，`{min~10}`就是一個`chunk`，就是一組`document`。

| 分片001      | 分片002         | 分片003  |
| ------------- |:-------------:| -----:|
| { min ~ 10 }      | { 30 ~ 40 } | { 60 ~ 70 } |
| { 10 ~ 20 }      | { 40 ~ 50 } | { 70 ~ max } |
| { 20 ~ 30 }      | { 50 ~ 60 }|  |

這邊事實上有很多東西可以思考，例如片鍵的選者或分片設計等，這些主題將留在後面幾篇在來介紹，你之要先大概只知片鍵是啥的就好了。

## ~分片實作~
首先咱們先在單機上來建立看看，一樣先進入`mongodb shell`。

```
mongo --nodb
```

然後使用`ShardingTest`來建立分片用的`cluster`，其中`shards`為`3`代表建立3個分片，而`chungszie`之後會講，先簡單設`1`就好。

```
cluster = new ShardingTest({ "shards" : 3 , "chunksize" :1})
```
執行完我們可以看到它的輸出。

![](http://yixiang8780.com/outImg/20161223-3.png)

然後就準備換到另一個`shell`，接下來我們就可以連接到`mongos`囉，根據我們上面的結果可知，我們的`mongos`是建立在`port : 20006`的位置，來連吧~

```
db = ( new Mongo("127.0.0.1:20006")).getDB("test")
```
進去以後我們來丟些資料，來測試看看。

```
var objs = [];
for (var i=0;i<1000000;i++){
	objs.push({"name":"user"+i});
}
db.users.insert(objs);
```
然後我們可以執行`sh.status()`來看看這個`cluster`的運行狀況。

![](http://yixiang8780.com/outImg/20161223-4.png)

但是我們的分片可還沒啟用喔，它還需要執行這行指令。

```
sh.enableSharding("test")
```
呃對了~上面的指令只是允許`test`這資料庫可以使用分片了，但在進行分片前，我們還要先決定要如何針對`collection`進行拆分，這時我們就要選擇片鍵`sharing key`，它將根據某個欄位進行拆分，這邊注意，只要索引過的鍵才能夠作為片鍵，所以我們要先建索引。

```
db.users.ensureIndex({"name":1})
```
然後再針對`collection`分片，`test.users`第一個是資料庫，第二個是`collection`。

```
sh.shardCollection("test.users",{"name":1})
```
然後執行完看到這個結果就代表ok~

```
{ "collectionsharded" : "test.users", "ok" : 1 }
```
然後咱們在來看一下`sh.status()`的結果。

![](http://yixiang8780.com/outImg/20161223-5.png)

其中可以看到他`shared0000`裡已經將`collection`開拆成很多個`chunk`囉，不過因為我們`Balancer`的東西還沒啟動，所以還沒分配到其它`shard`，這篇我們下章節在來說說。

![](http://yixiang8780.com/outImg/20161223-6.png)

然後我們來搜尋看看詳細資訊，下圖結果可以知道它去這`shard0000`尋找到`doument`，並且就如同索引一樣，不需要全部掃描來尋找，是的你可以把片鍵想成索引。

```
db.users.find({"user889391"}).explain("executionStats")
```

![](http://yixiang8780.com/outImg/20161223-7.png)

## ~結語~
本篇文章中，我們學習了分片的基本知識，也簡單的介紹建立分片的方法，但事實上還有很多分片的原理我們沒有完全說到，例如如何分片、片鍵的選擇、`chunk`的拆分，這些我們後面幾篇都會來說明說明。

## ~參考資料~
* [https://docs.mongodb.com/v3.2/sharding/](https://docs.mongodb.com/v3.2/sharding/)
* [http://blog.fens.me/mongodb-shard/](http://blog.fens.me/mongodb-shard/)