# 30-18之運用研究---PO文模擬情境(1)
咱們來細數一下，我們在前面的幾篇學了那些東西~

* `mongodb`的新增、刪除、更新、搜尋。
* `mongodb`的索引運用。
* `mongodb`的資料分析工具`Aggregate`聚合。
* `mongodb`的設計。

是的~雖然看起來很少，但基本上基礎都差不多學會了，接下幾篇我們將要實際上的寫寫程式，來將我們之前學習到的東西都複習一次。

## ~需求說明~
我們這邊想要簡單的模擬FB的貼文，我們可以新增貼文或做一些事情，並且我們希望還可以進行一些貼文分析，最後這項模擬會建立在有100萬筆下貼文的情況下，我們簡單的先列出我們要做的需求。


1. 使用者可以簡單的新增發文，並且會存放`Text`、`Date`、`Author`、`likes`、`Message`。
2. 建立`100`萬筆模擬`po`文。
3. 使用者可以刪除發文。
4. 使用者可以對自已的po文進行更新。
5. 使用者可以進行留言。
6. 使用者可以`like`發文。
7. 使用者可以根據`Text`、`Author`、`likes`、`Date`進行搜尋。
8. 管理者可以速行分析個案(那些個案之後再想)

以下的步驟不代表上述列表的序號，而只是我們完成這需求的過程。

### Step1 . 先想想`MongoDB`的架構
首先咱們先來想想，我們應該會有一個`collection`是會存放貼文資料，我們就取名為`posts`，然後再想想他裡面大概會長成啥樣，應該是如下的`json`。

```
{
	"id" : 1,
	"text" : "XXXXXX",
	"date" : "20160101",
	"author" : ?? ,
	"likes" : 1,
	"message" : ??
}
```

這時應該遇到兩個問題，`author`與`message`的格式如何，`author`應該是比較簡單，應該只要建立者的`name`，但這時你要考慮一件事，要不要為使用者建立個`users`的`collection`，首先回答幾個以下幾個問題。

* 使用者資料在其它地方會不會使用到 ? Ans:會的，在留言時會需要用到。
* 使用者是否會高的頻率修改`name` ? Ans:不會，頻率很低。

根據上述回答，第一點是建議正規化，而第二點則是建議反正規化，那麼要選擇那個呢? 
因為我們這`case`比較注重搜尋的速度，所以建議選用『反正規化』，也就是如下的結構，而不另外建立`users`的`collection`。

```
{
	"id" : 1,
	"text" : "XXXXXX",
	"date" : "20160101",
	"author" : "mark" ,
	"likes" : 1,
	"messages" : ??
}
```
而第二個問題`messages`結構要如何建立 ? 我們先想一下他是長什麼樣子，它應該需要有`author` 、`msg`、`date`，那麼再來思考看看要選用正規化還是反正規化，一樣來回答幾個問題。

* `messages`資料是否會很大 ? Ans : 不敢保證，因為如果是很熱門的貼文，留言數量會很多，並且有些人還會貼長長的，但熱門貼文也是很少數。
* `messages`是否其它地方會重複用到 ? Ans : 某也。
* `messages`是否常異動 ? Ans : 會長新增，但修改留言內容不常見。

我們根據以上幾點，決定選用『反正規化』模式，雖然留言數量可能很大，在目前沒考慮圖片檔狀況下，一個`document`要超過`16mb`有點難度，戰爭與和平這本厚厚的東西，字數130萬字左右，也才`3.14mb`，而且我們進行留言修改時，也只是針對單個`document`進行修改，不需要整個`collection`都進行修改，所以我們的整個的結構會如下。

```
{
	"id" : 1,
	"text" : "XXXXXX",
	"date" : "20160101",
	"author" : "mark" ,
	"likes" : 1,
	"messages" : [
		{"msgId" : 1,"author" : "steven" , "msg" : "what fuc." , "date" :20160101},
		{"msgId" : 2,"author" : "ian" , "msg" : "hello world java","date":20160101}
	]
}

```
### Step2 . 程式碼環境
這邊的程式碼，小的我打算使用`mongodb`的`native MongoDB Node.js driver `來進行建立，首先我們先看看我們的`package.json`檔看所需要的東西，其中我們需要的為`mongodb`與`sentencer`，其中`sentencer`的功能是可以幫助我們產生模擬的訊息。

```
{
  "name": "30-18",
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
    "sentencer": "^0.1.5"
  }
}
```

### Step3 (需求1) 使用者可以簡單的新增發文

首先，我們要先產生貼文的資料，而且可以的話盡可能模擬的和實際資料一樣，來看看我們的模擬資料的程式碼。[全部程式碼在這喔]()

首先是模擬的貼文`Post`產生，該方法可以自動產生一筆貼文，其中`sentencer`為自動產生句子的`libary`，假設一個範例`This is {{ adjective }} {{ noun }}.`，其中`{{adjective}}`代表改位置他會隨機產生個形容詞，而`{{noun}}`代表它會隨機產生名詞，所以他最後可能產生`This is handsome boy`，這類似的句子。

```
//模擬資料的設定

//隨機亂數
var randNum = function(min, max) {
  return Math.floor((Math.random() * max) + min);
}

//模擬的句子，其中{{}}的內容sentencer會自動幫我們產生。
var sentences = [
  "This is {{ an_adjective }} people.",
  "This sentence has {{ a_noun }} and {{ an_adjective }} {{ noun }} in it.",
  "It is very {{ adjective }} event",
  "Stop ~ you are a {{ noun }}",
  "This is {{ adjective }} {{ noun }}."
]

//====================================================================


//主要用來產生貼文的方法
var randomPost = function() {
  return  {
    "text": sentencer.make(sentences[randNum(0, sentencesLen)]),
    "date": new Date(),
    "author": users[randNum(0, 9)],
    "likes": randNum(0, 1000),
    "messages": randomMessages()
  }
}

//用來產生模擬留言的方法
var randomMessages = function() {
  var rand = randNum(1, 50),
    messages = [],
    date = new Date();

  for (var i = 0; i < rand; i++) {
    messages.push({
      "msgId" : i,
      "author": users[randNum(0, usersLen)],
      "text": sentencer.make(sentences[randNum(0, sentencesLen)]),
      "date": date.setDate(date.getDate() + randNum(1, 300))
    })
  }
  return messages;
}
```
以上程式碼都為模擬資料的產生，會產生出大致如下的資料。

```
{
	"id" : 1,
	"text" : "XXXXXX",
	"date" : "20160101",
	"author" : "mark" ,
	"likes" : 1,
	"messages" : [
		{ "msgId" : 1, "author" : "steven" , "msg" : "what fuc." , "date" :20160101},
		{ "msgId" : 2, "author" : "ian" , "msg" : "hello world java","date":20160101}
	]
}
```
然後我們就可以來建立`Posts`新增貼文的方法了，我們使用`Bulk`方法來新增，想複習一下它的可以到這[此篇文章](http://ithelp.ithome.com.tw/articles/10185051)複習兩下。

```
db.open(function() {
  db.collection('posts', function(err, collection) {
    var bulk = collection.initializeUnorderedBulkOp();
    for (var i = 0; i < count; i++) {
      bulk.insert(randomPost());
    }
    bulk.execute(function(err, res) {
      console.log("Success");
    });
  });
});
```

>[全部程式碼在這喔~Again]()

### Step4 .再來處理需求(2)的模擬個100萬筆

開始吧，咱們來建立個100萬筆來試試，大約`1GB`左名的資料，並且請用這行來執行。

```
node --max-old-space-size=8192 server.js 
```
對沒錯，我開掛，我把node的記憶體限制拉到`8g`……，不然一直`memory of out`，但這應該不是個好解法……

```
var count = 100000;

db.open(function() {
  db.collection('posts', function(err, collection) {
    var bulk = collection.initializeUnorderedBulkOp();
    for (var i = 0; i < count; i++) {
      bulk.insert(randomPost());
    }
    bulk.execute(function(err, res) {
      console.log("Success");
    });
  });
});
```

## ~結語~
本篇文章先說明該模擬應用的資料建立以及`mongodb`的架構分析，接下來的幾篇還會繼續實作它的需求。

`P.S` 30天平常時覺得說長不長，說短不短，但著麼感覺過好久了…… 

