# 30-21 MongoDB的副本集 (replica set)

本篇文章將要說明，`mongodb`的副本集，嗯~想想一個情況，現在咱們只使用一台`server`來存放資料，我們現在只是測試和開發，`GG`囉也只是啊一聲，但如果是正式上線環境呢 ? 
`GG`囉可不是啊一聲就可以解決的，你可能就被老闆不要不要的，很慘的~ 而副本集就是用來解決這問題，事實上也就只是被備份。

* 副本集原理
* 副本集建立(單機版給你好測試)

## ~副本集原理~

首先我們先看看`mongodb`官網所提供的圖。

![](http://yixiang8780.com/outImg/20161221-1.png)

上面這張圖，你可以想成這個系統它有三個`mongodb`，其中`primary`節點接受所有`client`端的讀或寫，整個副本集只有一個`primary`，並且每當有資料新增時，`primary`會同步到其它兩個`secondary`。

然後當`primary`節點`GG`的話，會變成下面這張圖的結果(一樣來至官網)。

![](http://yixiang8780.com/outImg/20161221-2.png)

在這裡面，各節點都是通過一個叫心跳請求(`heartbeat request`)的機制來通信，如果當`primary`節點如果在10秒內無法和其它節點進行通信，這系統會自動從`secondary`節點中選取一個當主節點。

## ~副本集建立~
在上面大概簡單的了解完它的原理後，我們就實際上的來操作看看，首先我們執行下面指令，
來進行到沒有`db`的`mongodb shell`環境。

```
mongo --nodb
```
然後通過下面的指令，就可以建立一個副本集，其中`nodes : 3`代表三個節點，一個`primary`其它兩個為`secondary`。

```
replicaSet = new ReplSetTest({"nodes":3})
```
不過執行完上面這行指令它還沒啟動喔還需要執行下面兩行，`startSet`為啟動那三個節點的進程，而`initiate`為設定複制功能。

```
replicaSet.startSet()
replicaSet.initiate()
```
當執行完上面兩行後，我們就要跳到另一個`Shell`，然後連接到`primary`的節點，喲~?那它的`port`是啥?雖然有些文章中說預設是`31000`、`31001`、`31002`但我的電腦卻不是，所以建議還是在執行`startSet`時看一下，它應該會輸出下面這張圖的資訊。

![](http://yixiang8780.com/outImg/20161221-3.png)

嗯看到了吧，通常第一個就是`primary`，不是的話就試試其它的，然後我們這時就可以執行下面指令進入到它的裡面了。

```
conn1 = new Mongo("127.0.0.1:20000")
```

接下來我們就可以執行一些指令來看看這個副本集的狀態。

```
primaryDB = conn1.getDB("test")
primaryDB.isMaster()
```
結果如下，其中`isMaster`這欄位就是說明這節點是`primary`節點。


![](http://yixiang8780.com/outImg/20161221-4.png)

## ~驗證一下有沒有備份到`secondary`節點~

首先我們先新增一些資料。

```
var objs = [];
for (var i=0;i<10;i++){
	objs.push({"name":"user"+i});
}
primaryDB.users.insert(objs);
```
然後我們這時連到`secondary`。

```
conn2 = new Mongo("127.0.0.1:20001")
```
進去後在輸入。

```
secondaryDB = conn2.getDB("test")
secondaryDB.find()
```
然後你會看到下面的錯誤訊息。

```
error : { "$err" : "not master and slaveok=false","code" :13435 }
```
這時要要再執行這行指令才能在`seoncdary`才能開啟。

```
coon2.setSlaveOk()
```
這時你在執行一次搜尋應該就可以看到結果囉~如下。

![](http://yixiang8780.com/outImg/20161221-5.png)

## ~結語~
對不起我今天真的想不到結啥語，只能說+u~

## ~參考資料~
* [http://www.cnblogs.com/zhanjindong/p/3251330.html](http://www.cnblogs.com/zhanjindong/p/3251330.html)
* [https://docs.mongodb.com/v3.2/reference/configuration-options/#net.port](https://docs.mongodb.com/v3.2/reference/configuration-options/#net.port)
* [https://docs.mongodb.com/manual/tutorial/deploy-replica-set/](https://docs.mongodb.com/manual/tutorial/deploy-replica-set/)