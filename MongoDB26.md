# 30-26之運用研究---股價應用模擬(1)
前面幾篇文章我們說明完了分片的運用後，我們接下來，就來實際的模擬個情景，我們來學習要如何的一步一步完成，咱們選擇的模擬情境為股價應用，現在`Fintech`幾乎天天在報紙上看到，所以我們就來應景一下，來嘗試這建立看看金融應用。

## ~ 情景說明 ~
二哈是一位二貨，他平常就有在進行投資，大部份都是買買股票，但平常都只是直接卷商的平台看看資料，然後就直接投資囉，但是這貨兒每買必輸每賣必虧，然後有一天他聽到天賴之音說『請分析一下』，然後它就決定走上資料分析一途……這貨真的很二

![](http://yixiang8780.com/outImg/20161226-2.jpeg)

回歸主題，二哈的需求只是分析，所以我們再分析前，我們要先建立好資料，通常能分析的資料量是越大越好，所以我們這邊一定會需要用到分片，並且我們先從最基本的股票資料k線與成交量來建立資料，首先我們的資料結構應該如下。

```
{
股價代碼	"code" : 1011,
日期		"date" : 20160101,
開盤價  	"open" : 100,
最高價  	"height" : 100,
收盤價  	"close" : 90,
最低價  	"low" : 80,
成交量  	"volume" : 1000
}
```
然後我們來正試開始吧。

## ~ Step 1. 架構分析 ~

### 索引架構思考
首先我們根據以上的資料結構可知，我們該主題目前不太需要考慮到正規化與反正規化的問題，那接下來我們來思考看看**索引**的問題，但那蠢二哈只想到分析但不知道分析啥，我們來幫他想想。

我們來一條一條列出，我們想到的需求。

* 二哈最基本應該會輸入股價代碼，然後輸出該股票的全部資料。
* 二哈想尋找出該股票某段區間的資料。
* 二哈想找出當日交易最熱絡的股票。
* 二哈想找出某日價格波動最高的股票。

細細想一下，大部份的使用情境都一定需要時間，而且是個範圍，然後有時在搭配某個股票，所以我們基本上會針對`date`和`code`來考慮建立索引，那要選用那種索引呢，目前有三種選擇我們先列出。

```
第一種
{ "date" : 1 , "code" : 1 }

第二種
{ "code" : 1 , "date" : 1 }

第三種
{ "code" :1 },{ "date" :1 } 
```
還記得`{ "sortKey" : 1 , "queryKey" : 1 }`這個複合索引時有提到的東西麻，很常用來排序的請放前面，日期和股價代碼，理論上來說日期會很常用到排序，所以我們第二種索引可以刪除。

那第一種與第三種要選那種? 首先我們要先知道第三種佔的空間一定會比較多，然後我們在思考一件事，我們股價代碼會很常用到排序麻，如果沒有那我們選用第一種就好，嗯的確沒有，所以我們目前『暫定』選第一種`{ "date" : 1 , "code" : 1 }`為索引。

### 分片的片鍵選擇
接下來我們要來決定我們的分片依據要選誰 ? 首先我們先複習一下昨天才說過的良好的片鍵特性。

* 容易分割片鍵
* 高隨機性的片鍵
* 可以指向單個分片的片鍵 

但以上三點都符合不太可能，所以我們這時要先思考我們的需求用最多的是啥 ? 答案是搜尋，
就是所謂的讀取操作，然後我們在搜尋時最常使用的欄位是誰?`code`與`date`，那是單一搜尋較多還是範圍搜尋，應該是範圍，知道了以上的需求我們來想想我們的片鍵要選誰?

首先第一候選人`code`，先想一下它有沒有符合上面三個特性的其中一個，容易分割的片鍵，嚴格來說一般般，不過以基數來看也算充足，應該是還行~ 高隨機就一定沒有，而最後一個可以指向單個分片，嗯有~因為當你有尋找某個股票時它就一定會去所屬的分片找，所以嚴格來說它第一和第三個特性都有符合。

再來是第二候選人`date`，首先是容易分割片鍵，嗯這一定有，第二個高隨機性，沒有而且它是個升序片鍵，第三點指向單個分片這點也算有，所以嚴格來說它第一和第三個特性也都有符合。

兩個候選人第一和第三都符合，但有點要注意，`date`這種候選人，它是升序片鍵，也就是說接下來新增的資料都會塞在最後面的`chunk`，所以這種類型的經常會導致資料均衡壓力會很重，所以暫不考慮它。

在去除了`date`，就選擇`code`了嗎 ? NO~NO~ 還有一個東西需要考慮，我們要用這兩個建立複合片鍵嗎 ? 

說實話適合，它就需要大量讀取範圍時很適合使用，但我們目前的欄位好像都沒辦法達至它的要求，複合片鍵要求第一個片鍵是基數較低的欄位，無論是`code`或`date`都不適合，所以我們就先取掉這選項。

根據以上種種原因，我們先暫定分片為`code`，除非後來有根據可以換別的。

## ~ Step 2. 建立模擬資料 ~
首先一樣看看我們的`pack.json`，我們一樣需要使用`mongodb`而另一個需要使用的`randgen`，我要用它產生出常態分配股價，這邊是[全部的程式碼](https://github.com/h091237557/30-MongoDB/blob/master/Test/30-26/test.js)。

```
{
  "name": "30-26",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "mongodb": "^2.2.16",
    "randgen": "^0.1.0"
  }
}

```
我們這邊簡單說一下常態分配產生股價的方法，常態分配是統計學上，用來描述某些群體的機率分配，我們來看看下面這張圖，圖片來自於`wiki`。

![](http://yixiang8780.com/outImg/20161226-1.png)

上面這張圖主要就是說某些群體，它的值會有`６８％`在深藍的範圍內，也就是所謂的一個標準差內，而有`９５％`的機率是會在二個標準差以內。

然後我們看一下，我們上面使用的`lib``randgen`來看看他的用法。

```
num = rnorm(2, 5);
```
第一個參數為平均數，第二個參數為標準差，也就是說它有68%的機率，`num`會座落在`2-5 ~ 2+5 `之間也就是`-3~7`之間，而有95％的機率會落在`2-5*2 ~ 2+5*2`也就是`-8~12`之間。

上面大概說明完常態分配後，我們接下來就可以來看一下我們模擬股價的程式碼，不算太難，其中該方法的第一個參數為你想模擬幾天的資料，而第二個參數是上一個股標的結果，代入繼續丟資料進這個陣列中，這樣我們比較好丟到`mongodb`中。

然後我來說一下幾個值，首先是`price`，它是每天要用常態時的平均數，我們只有在第一天時會先隨機產生個價格，然後接下來的每天我們的`price`會改用前一天的收盤價，然後再用它來產生出當天的其它價格。而至於`sd`就是標準差，我們乘上`0.07`是因為台股`７%`限制，然後在除`3`是因為三個標準差以常態分配來看是`99.9%`，也就是說我這個模擬股價只有`0.1%`的情況下才會超過`7%`上限，這只是模擬～～～ 

```
//　用來建立單筆多天的股價資料
function createStockDatas(count, result) {
  var randPrice = randNum(10, 1000);
	var code = randCode();
  var date = new Date(),
    temp;

  for (var i = 0; i < count; i++) {
    var price = temp || randPrice,
      sd = price * 0.07 / 3,
      open = Math.floor(rnorm(price, sd)),
      low = Math.floor(rnorm(price, sd)),
      heigh = randHeigh(open, price, sd),
			close = Math.floor(rnorm(price,sd)),
		 	volume = randNum(1000, 100000);

    result.push({
      "code": code,
      "date": date.setDate(date.getDate() + i),
      "open": open,
      "heigh": heigh,
      "close": close, 
      "low": low,
      "volume": volume
    })
    temp = low;
  }
  return result
}

// 產生常態分配的最高價，但最高價不能小於開盤價。
function randHeigh(open, avg, sd) {
  var result = 0;
  while (result <= open) {
    result = rnorm(avg, sd);
  }
  return Math.floor(result);
}

// 產生常態分配的最底價，但最低價不能大於最高價。
function randlow(heigh, avg, sd) {
  var result = 0;
  while (result == 0 || result >= heigh) {
    result = rnorm(avg, sd);
  }
  return Math.floor(result);
}

// 產生亂數 min ~ max 範圍。
function randNum(min, max) {
  return Math.floor((Math.random() * max) + min);
}

// 隨機產生股價代碼。
function randCode() {
  return randNum(1, 9).toString() + randNum(0, 9).toString() + randNum(0, 9).toString() + randNum(0, 9).toString()
}
```
建立好個股模擬多天的方法後，我們就可以模擬多筆多天的資料新增的`mongos`裡囉，注意我們的`port`要用`20006`。

```
var mongodb = require('mongodb');
var rnorm = require('randgen').rnorm;

var mongodbServer = new mongodb.Server('localhost', 20006, {
  auto_reconnect: true,
  poolSize: 10
});

var db = new mongodb.Db('test', mongodbServer);
var stockCount = 1000;
var days = 3600;


// 執行新增至mongodb動作。
db.open(function() {
	db.collection('stocks', function(err, collection) {
		var datas = testDatas(stockCount, days);
		collection.insert(datas, function(err, res) {
			if (res) {
				console.log(res);
			} else {}
		});
	});
});

// 用來建立模擬資料
function testDatas(stockCount, days) {
  var result = [];
  for (var i = 0; i < stockCount; i++) {
    result = createStockDatas(days, result);
  }
	return result;
}
```
然後我們這個測試準備打算建立`10000`筆股票，然後模擬天數為`5000`，基本上總共有5000千多萬筆資料。

fight ~~~

別忘了開掛。

```
node --max-old-space-size=8192 test.js 
```
今天先到這囉。

## ~ 結語 ~
本篇文章中，我們說明了我們這個應用的架構設計，已經索引與分片的架構，下一篇文章我們將會說明二哈這貨的使用說明。


