## 30-22之MongoDB的副本集 replica set(2)---使用Docker建立MongoDB Cluster
上篇文章我們已經說明完，如何在本機上建立mongodb副本集，而本篇文章，我們將要實際的使用docker來建立有三個節點的副本集，也就是所謂`cluster`。

* 開始前的準備
* 建立架構圖
* fight ! 

## ~開始前的準備~
首先再開始之前你當然要先將`docker`裝好，可以參考下面這章，但你的`docker compose`那邊可以不用做到，因為我還沒研究出，如何用`docker compose`來建立`cluster`……QQ。

> [30-2之使用Docker來建構MongoDB環境](http://ithelp.ithome.com.tw/articles/10184657)

確定執行`docker --version`有類似下面的資訊出來就ok囉。

```
Docker version 1.12.3, build 6b644ec
```
接下來呢咱們需要下載`mongodb image`，平常我們都是用`docker compose`直接執行它都會幫我們偷偷下載好，而現在我們就需要自已下載，指令如下。

```
docker pull mongo
```
然後咱們就都準備好囉。

## ~建立架構圖~
我們來看看下圖，首先我們會先建立一個`cluster`取名為`my-mongo-cluster`，然後裡面有三個`mongodb`並且對外連接`port`設為`30001`、`30002`、`30003`，並且這三個的`container`都可以互相溝通。

![](http://yixiang8780.com/outImg/20161222-4.png)

## ~建立流程~
Fight !

### step1 將`my-mongo-cluster`加入到`docker network`裡

我們先執行看看`docker network ls`然後會出現下圖的列表。

![](http://yixiang8780.com/outImg/20161222-1.png)

然後我們再執行下面的指令將新增個`network`到`docker network`裡。

```
docker network create my-mongo-cluster
```
然後你就可以看到我們將`my-mongo-cluster`加入至`docker network`裡。

![](http://yixiang8780.com/outImg/20161222-2.png)

### Step2 建立三個 MongoDB 的 Container，並加入至 my-mongo-cluster 這 network 中

首先來看看指令，然後我們來解釋一下每個指令是啥意思。

* `docker run` : 就只是執行`docker`而以。
* `-p 30001:27017` : 將`port:27017`暴露出來，為了讓其它`mongodb`可連接到，而`30001`則為該`container`的本機`port`。
* `--name mongo1` : 將該`container`命名為`mongo1`。
* `--net my-mongo-cluster ` : 將該`container`加入到`my-mongo-cluster`這`docker network`裡面，然它們可以互相通信。
* `mongo mongod --replSet my-mongo-set` : 運行`mongod`時將該`mongo`加入到名為`my-mongo-set`的副本集中。

```
docker run 
-p 30001:27017 
--name mongo1 
--net my-mongo-cluster 
mongo mongod --replSet my-mongo-set
```
記好上面這些是要縮成一行來執行，如下。

```
docker run -p 30001:27017 --name mongo1 --net my-mongo-cluster mongo mongod --replSet my-mongo-set
```
執行完這行指令後，你就建立好了一個`container`呢，但別忘囉我們要建立三個，所以還要再執行兩次，另外兩個只是修改一下`port`，對了在執行其它兩個建立時要新開兩個`Shell`。

```
docker run 
-p 30002:27017 
--name mongo1 
--net my-mongo-cluster 
mongo mongod --replSet my-mongo-set
```

```
docker run 
-p 30003:27017 
--name mongo1 
--net my-mongo-cluster 
mongo mongod --replSet my-mongo-set
```
建立完後你可以執行`docker ps`指令看首你所建立的`container`。

![](http://yixiang8780.com/outImg/20161222-3.png)

### Step3 設定副本集
建立完後，咱們就可以連到`container`裡控制`mongodb`囉。

```
docker exec -it mongo1 mongo
```
然後進行後我們想看看它的副本集資訊，我們執行下面的程式碼。

```
db = (new Mongo('localhost:27017')).getDB('test')
db.isMaster()
```
![](http://yixiang8780.com/outImg/20161222-5.png)

然後看到上面的執行結果，會發現它提示我們還沒有可用的副本集設定，所以我們這時要寫一段段代碼，主要就是副本集設定，程式碼如下，其中`_id`要設定的與所設定的副本集名稱一樣。

```
config = {
  	"_id" : "my-mongo-set",
  	"members" : [
  		{
  			"_id" : 0,
  			"host" : "mongo1:27017"
  		},
  		{
  			"_id" : 1,
  			"host" : "mongo2:27017"
  		},
  		{
  			"_id" : 2,
  			"host" : "mongo3:27017"
  		}
  	]
  }

rs.initiate(config)
```
然後我們再執行一次`db.isMaster()`，你就會看到我們設定完成囉。


![](http://yixiang8780.com/outImg/20161222-6.png)

### Step4 測試是否有備份

首先我們先建立些測試資料，並新增到`primary`的`mongodb`中。

```
var objs = [];
for (var i=0;i<10;i++){
	objs.push({"name":"user"+i});
}
db.users.insert(objs);
```
然後再連線到`secondary`裡尋找看看。

```
db2 = (new Mongo('mongo2:27017')).getDB('test')
db2.setSlaveOk()
db2.users.find()
```
執行結果如下~完成~。

![](http://yixiang8780.com/outImg/20161222-7.png)

## ~結語~
副本集方面的事情我就先說明到這，雖然還有不少東西可以講，但那都是管理方面與副本集設計方面的問題，這些我就真的懶講囉……

`P.S` 今天打流感疫苗，但著麼打完後就要燒起來的感覺……

## ~參考資料~
* [http://www.sohamkamani.com/blog/2016/06/30/docker-mongo-replica-set/](http://www.sohamkamani.com/blog/2016/06/30/docker-mongo-replica-set/)
* [http://sofar.blog.51cto.com/353572/1640558](http://sofar.blog.51cto.com/353572/1640558)
* [https://cnodejs.org/topic/5590adbbebf9c92d17e734de](https://cnodejs.org/topic/5590adbbebf9c92d17e734de)
