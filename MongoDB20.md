# 30-20之運用研究---PO文情境模擬(3)
上篇文章中，基本上已經把po文的方法，大部份都完成了，也建立好了索引，並且也將po文常見的搜尋給實作出來，接下來本篇文章，我們將要站在資料分析者的角度，使用聚合工作`Aggregate framework`與`MapReduce`來進行一些分析案例，一樣為了怕使用者忘記需求，我們還是再再貼一次~~

## ~需求說明~
我們這邊想要簡單的模擬FB的貼文，我們可以新增貼文或做一些事情，並且我們希望還可以進行一些貼文分析，最後這項模擬會建立在有100萬筆下貼文的情況下，所以我們簡單的先列出我們可以用的功能。

1. 使用者可以簡單的新增發文，並且會存放`Text`、`Date`、`Author`、`likes`、`Message`。(完成)
2. 建立`100`萬筆模擬`po`文。(完成)
3. 使用者可以刪除發文。(完成)
4. 使用者可以對自已的po文進行更新。(完成)
5. 使用者可以進行留言和刪除留言。(完成)
6. 使用者可以`like`發文。(完成)
7. 使用者可以根據`Text`、`Author`、`likes`、`Date`進行搜尋。(完成)
8. 管理者可以速行分析個案(已經想到囉如下)

## ~分析個案 (需求8)~ 
1. Boss希望可以知道最多人留言的貼文，並且該貼文中前三位留言最熱絡的使用者，並計算留言次數。
2. Boss想知道最近貼文中最長出現的『單詞』是啥 ? 可以讓老大知道最近最熱門的東西 ~ 

嗯……才兩個好像有點少，但你往下來就知道可以寫很多了，都是要動腦想三下著麼做的啊…… 

### 1. Boss希望可以知道最多人留言的貼文，並且知道該貼文中，前三位留言最熱絡的使用者，並計算留言次數。

首先先來解決這需求，仔細看看不太難，將需求拆解成如下步驟就好。

1. 將每筆貼文的留言數量計算出來，並存放在`messagesCount`這變數中。
2. 根據`messagesCount`進行排序。
3. 將排序好的資料取第一個。
4. 在將`messages`中的`author`來進行分組統計，並將結果存放在`count`中。
5. 在針對`count`進行排序，取前三名。
6. 交給Boss看……

根據以上的步驟我們使用`mongodb`的`aggreagate framework`來寫出下列程式碼，啊咧啊咧…… 著麼只寫到步驟2的排序…… ? 

```
db.posts.aggregate(
{
	"$project" : { "messagesCount" : { "$size" : "$messages" } }
},
{
	"$sort" : { "messagesCount" : 1}
}
)

```
因為`GG`了，咱們的排序所耗用的記憶體超過`mongodb`的限制囉，請看下圖~

![](http://yixiang8780.com/outImg/20161220-1.png)

網路上有人推薦說，在建立`document`時就多建立一個欄位，來存放它的數量，然後直接建立索引，但在我們這邊是會`GG`掉的，因為我們的留言隨時都在變，而且沒新增或刪除個留言都還要去對那個存放欄位進行更新，而且還有索引，這樣會讓咱們的效能大大的下降，所以在這應用中否定這選項~

那要著麼辦呢 ? 後來又查到一個方法，那就是`allowDiskUse `參數，`mongodb`有個限制在`Pipeline`的階段中，規定記憶體只能用`100mb`，不然就會跳出上圖的錯誤，但如果將`allowDiskUse`設定為`true`，則它多出來的資料暫存寫入到臨時的`collection`，只是會不會有什麼問題或壞處，官網上都沒特別提到……

繼續正題，然後解決完這個`sort`的問題後，我們就可以使取得貼文的留言數最多的貼文。

```
db.posts.aggregate(
[
{
"$project" : { "messagesCount" : { "$size" : "$messages" },"messages" : 1 }
},
{ "$sort" : { "messagesCount" : -1}},
{ "$limit" : 1}
],
 { allowDiskUse: true }
)
```
咱們再繼續往下寫，取得了最多留言數的貼文後，我們要繼續來尋找留言最多的人是那位，我們先使用`$unwind`將`messages`的陣列欄位，拆分成多個`document`，以方便我們用來`group`，再下來我們就可以根據`messages`的`author`來進行分組，並且計算每一組的數量存放至`count`來欄位。

```
db.posts.aggregate(
[
{
"$project" : { "messagesCount" : { "$size" : "$messages" },"messages" : 1 }
},
{ "$sort" : { "messagesCount" : -1}},
{ "$limit" : 1},
{ "$unwind" : "$messages"},
{ "$group" : {"_id" : "$messages.author" , "count" : { "$sum" :1 }}},
{ "$sort" : { "count" : -1}}
],
 { allowDiskUse: true }
)
```
最後咱們在來進行排序 ~ 就完成這需求囉 ~ 看看下圖誰留言數最多，嗯最多留言的是一位叫`ian`的大大，我的`fans`之一。

![](http://yixiang8780.com/outImg/20161220-2.png)

想複習的請參考小的聚合章節~謝謝，還有我要更正一句話，在一開始這個需求時，有說過這句話`仔細看看不太難`，對不起事實上我想了很久……。

> [30-14之聚合(1)---Aggregate Framework的哩哩扣扣](http://ithelp.ithome.com.tw/articles/10185952)
> 
> [30-15之聚合(2)---Pipeline武器庫](http://ithelp.ithome.com.tw/articles/10186033)

### 2. Boss想知道最近貼文中最長出現的『單詞』是啥 ? 可以讓老大知道最近最熱門的東西 ~
嗯…這鬼問題 ~ 我腦袋著麼想都想不到如何用`aggregate framework`來解決，所以我只能使用`MapReduce`來解了。

先來想想要著麼解，首先假設我們的貼文大概長這樣。

```
{ "text" : "This is a pen"},
{ "text" : "This is an apple"}
```
然我們想想`map`出來的結果要啥樣，它需要個`Key`和`Vales`，所以它的`map`出的結果應該要長成這樣。

```
"this" : [1,1],
"is" : [1,1],
"a" : [1],
"an" : [1],
"pen" : [1],
"appale" : [1]
```
然後我們`reduces`出來後的結果應該是降。

```
{ "_id" : "this", "value" : 2 }
{ "_id" : "is", "value" : 2 }
{ "_id" : "a", "value" : 1 }
{ "_id" : "an", "value" : 1 }
{ "_id" : "pen", "value" : 1 }
{ "_id" : "apple", "value" : 1 }
```
想好`map`與`reduces`的結果後，我們就可以開始寫程式碼囉，首先是`map`函數，它會將每個`text`裡的句子分解出一個單字一個單，並且以陣列型式儲放，然後再建立`key`與`value`，就如同我們上面所想的那樣。

```
var map = function() {  
	var text = this.text;
  	var words = text.toLowerCase().split(" ");  	
  	for (var i = 0; i < words.length; i++) {
  		emit(words[i], 1);
  	}    
};
```
然後是`reduces`函數，它會將`map`產生出來的`key`與`values`進行加總的組裝，完成後也會如同我們上面所預期的那樣。

```
var reduce = function( key, values ) {    
    var count = 0;    
    values.forEach(function(v) {            
        count +=v;    
    });
    return count;
}
```
都準備好後，我們來執行`mapreduce`。

```
var result = db.posts.mapReduce(map, reduce, {out: "wordCount"})
```
最後在看看結果。

```
result.find().sort({value:-1}).limit(10)
```
結果如下，嗯……但是有沒有感覺這些單字很眼熟，嗯沒錯幾乎是我們模擬的句子裡的單字，`This`啊~或是`is`之類的，但這些單字都沒啥用。

![](http://yixiang8780.com/outImg/20161220-3.png)

```
var sentences = [
  "This is {{ an_adjective }} people.",
  "This sentence has {{ a_noun }} and {{ an_adjective }} {{ noun }} in it.",
  "It is very {{ adjective }} event",
  "Stop ~ you are a {{ noun }}",
  "This is {{ adjective }} {{ noun }}."
]
```

由於以上找到的單字都沒啥用處，所以我們將講`map`那，過濾掉那些我們預設的單字，
我們將`map`函數修改成如下，它會自動跳過我們預設的單字

```
var map = function() {  
	var text = this.text;
  	var words = text.toLowerCase().split(" "); 
  	var filterWords = ["this","is","people.","sentence","has","and","in","it.","very","event","stop","you","are","a","an","~","of","it"];
  	
  	for (var i = 0; i < words.length; i++) {
  		if(filterWords.indexOf(words[i]) == -1){
  		  	emit(words[i], 1);
  		}
  	}    
};
```

我們來看看執行結果，嗯嗯好多了，然後我們可以看到最熱門的單詞是`pair`……這啥鬼~不過也只好認囉~畢竟這也只是模擬資料。

![](http://yixiang8780.com/outImg/20161220-4.png)

本需求可以參考小的所寫的`mapReduces`的章節來回憶回憶
>[30-16之聚合(3)---潮潮的MapReduce](http://ithelp.ithome.com.tw/articles/10186195)

## ~結語~
呼呼~~模擬應用就到這暫時結束囉，也都將之前學習的東西全部都複習過囉，接下來咱們又要繼續學習新東西囉~哼哼~接下來學的東西事實上才和大數據有關~呼呼~