# 30-29之忘了講的--- 事務操作的空虛感
本篇文章是用來補充一下，前面忘了講的觀念，記得在第一篇時，我們有提過下面這句話。

> MongoDB 不支持事務操作

但事實上這段話有很多觀念要來說明說明，不然很難讓人了解事務操作是啥，所以我們這篇要用來補充一下這個主題。

## ~ 事務操作是啥鬼 ~

咱們首先先來了解一下，**事務**是啥?根據`wiki`的定義。

> 資料庫事務是資料庫管理系統執行過程中的一個邏輯單位，由一個有限的資料庫操作序列構成。

這邊用白話文來簡單說明一下，事實操作你可以把他想成一個工作流程，例如煮菜，你首先要先洗菜、切菜、丟到鍋子、加調味料，『煮菜』這名詞就是一個事務，它裡面包含了剛剛說明的流程。

我們轉回的在資料庫中的事務，假設我們是個證券商，我們收到使用者的下單通知，那我們資料庫會著麼進行? 我們下面來試試列出該事務操作過程。其中我們有兩個資料表`accounts`為使用者的帳戶資料、第二個為`orders`下單資料，呃對了先不管交割日這鬼，也就是付錢日。

1. 首先我們會先在`orders`新增一筆訂單。
2. 再到`accounts`針對該使用者的帳戶進行扣款。

**那如果發生錯誤時，事務會著麼處理?**

根據以上的例子，我們拿來繼續使用，假設我們在第二個步驟，準備要扣款時，系統突然`gg`了，那要著麼樣?在一些資料庫中，當整個事務提交給資料庫時，**它會保證這整個事務要嘛全部完成，要嘛全部沒完成。**

也就是說，如果我們第二個步驟掛掉時，我們一開始在`orders`新增的一筆訂單會取消，會保持整個事務的完整性，不會只完成一半。

最後這邊我們來看一下事務操作的四個特性`ACID`，來腦補一下，以下內容為`wiki`，並且自已寫寫說明。

* 原子性（Atomicity） : 要麼全執行、要麼全取消，沒得商量。
* 一致性（Consistency）: 這個是指在事務開始與結束後，資料庫的完整性約束沒有被破壞。
* 隔離性（Isolation）: 多個事務執行時，任一個事務不會影響到其它的事務。
* 持久性（Durability）: 代表即時停電或啥，事務一旦提交後，則持久化保存在資料庫中。
 
## ~ MongoDB 不支援事務 ~
對`mongodb`不支援事務，但它還是有支援一些符合各別特性的操作，總共有三個。

### 1. 在單個 document 上有提供原子性操作 findAndModify 

`mongodb`有提供單個`document`，操作，也就是說如果你要針對該`document`進行更新，要麼全部更新完成，不然就全部不更新，我們簡單用個範例來說明如何設計成，符合原子性的功能。

我們把上面的例子拿下來用。

> 假設我們是個證券商，我們收到使用者的下單通知，那我們資料庫會著麼進行? 我們下面來試試列出該事務操作過程。其中我們有兩個資料表`accounts`為使用者的帳戶資料、第二個為`orders`下單資料，呃對了先不管交割日這鬼，也就是付錢日。

但注意一點，如果我們是建立將`accounts`與`orders`分成兩個`collection`來建立，那我們就沒辦法使用`mongodb`所提供的原子性操作，因為就變為多`document`的操作。

所以我們需要將它修改為都存放在同一個`collection`，沒錯也就是進行反正規化，資料大概會變成這樣。

```
{ "user" : "mark" , 
  balance : 10000 ,
  orders : [
  	{ "id" : 1 , "total" : 1000 , "date" : "20160101" },
  	{ "id" : 2 , "total" : 2000 , "date" : "20160103"}
  ]
}
```
然後我們進行交易時，我們需要先檢查`balance`確定是否有足的錢，然後在新增一筆下單到`orders`欄位中，最後才修改`balance`，而我們這時需要用到`findAndModify `，它可以確保這筆交易的，在確定完`balance`後，不會有其它線程來更新它的`balance`。

我們來說一下沒用`findAndModify`會發生什麼情況，假設`balance`有`10000`，有一筆下單要`6000`元，然後`A`是來處理這筆訂單的線程，我們來模擬情境一下。

* A : 我先來確定一下`balance`是否有足夠的錢，嗯嗯~~還有`10000`很夠的。
* B(另一個線程) : 我先來扣錢一下，總共要扣`5000`元，現在`balance`只剩`5000`。
* A : 好~那接下來新增一筆下單到`orders`欄位，然後再進行扣款。
* A : what fuc.... !!! 為啥`balance`現在不夠錢了 ! 錢呢 !?

嗯記好，這時要用`findAndModify`才不會發生上面這種鳥事。下面為更新的程式碼。

```
db.accounts.findAndModify({  
	"query" : { "user" : "mark" , "balance" : { "$gt" : 6000 }},
	"update" : { "$set" : { "balance" : 4000 },
					"$push" : { "orders" :
					 {"id":3,"total":6000,"date":"20160110"} } }

})
```

### 2. 對多個 document 使用 $isolate
`mongodb`還有提供一個東東，它可以讓你在更新大量`document`時，其它的線程無法針對這些更新的文檔進行讀與寫，也就是支援隔離性（Isolation）。

但當然它也是有缺點的，有以下三個缺點。

* 首先是性能的問題，因為你都把人家鎖住了，人家當然要等你解鎖，
* 他沒有支援原子性的功能，也就是你更新完一半囉，但發生錯誤了，你已經更新好的不會回復成原始狀態。
* 它不支援分片。

### 3. Two Phase Commits 來模擬事務操作
`mongodb`官方，有提供一種範例方法，讓我們手動的來建立事務操作，它可以讓我們在進行大量更新時，如果發生錯誤，則之前更新的會全部還原，這種方法就叫`Two Phase Commits`。

我們直接拿官方的例子來說明，假設有兩個銀行帳號。

```
db.accounts.save({name:"A", balance:1000, pendingTransactions: []})
db.accounts.save({name:"B", balance:1000, pendingTransactions: []})
```
然後我們這時要將帳號`A`轉帳`100元`到帳處`B`，我們這邊將用`two phase commits`來一步一步的完成這筆交易

#### Step 1. 設定事務初始狀態為 initial

首先我們會在一個新的`collection`名為`transaction`新增一筆資料，記錄這該筆事務的資訊，並且設定`state`為`initial`。

```
db.transactions.save(
{source:"A", destination:"B", value:100, state:"initial"}
)
```

#### Step 2. 開始修改 accounts 前，先修改初始狀態為 Pending 

首先先尋找出狀態為`inital`的事務。

```
t =db.transactions.findOne({state:"initial"})
```
結果。

```
{ "_id" :ObjectId("4d7bc7a8b8a04f5126961522"), "source" :"A",
     "destination" :"B", "value" :100, "state" :"initial"}
```
然後在針對該事務，將`status`更新為`pending`。

```
db.transactions.update({_id:t._id},{$set:{state:"pending"}})
```

這時我們的事務資訊更新為如下。

```
{ "_id" :ObjectId("4d7bc7a8b8a04f5126961522"), "source" :"A", 
    "destination" :"B", "value" :100, "state" :"pending"}
```

#### Step 3. 開始更新兩個帳戶
然後我們就可以開始更新兩個帳戶，並且將事務資訊，記錄到`pendingTransactions `這個欄位。

```
db.accounts.update({name:t.source, 
    pendingTransactions: { $ne: t._id }},
    {$inc:{ balance: -t.value }, 
    $push:{pendingTransactions:t._id }})
    
db.accounts.update({name:t.destination, 
    pendingTransactions: { $ne: t._id }},
    {$inc:{ balance: t.value }, 
    $push:{pendingTransactions:t._id }})
```
首先先看看這行，這行是要先尋找出我們指令要更新的帳戶，其中`pendingTransactions: { $ne: t._id }`代表的意思為`pendingTransactions`裡不含`t._id`才找出來。

```
{name:t.source, pendingTransactions: { $ne: t._id }}
```
然後下面這兩行，才是更新欄位，會將`balance`增加`t.value`，然後將該事務的`id`存放至`pendingTransactions `內。

```
 {$inc:{ balance: t.value }, 
    $push:{pendingTransactions:t._id }})
```
然後最後這是該階段帳戶的結果。

```
{ "_id" :ObjectId("4d7bc97fb8a04f5126961523"), "balance" :900, "name" :"A", 
    "pendingTransactions" :[ ObjectId("4d7bc7a8b8a04f5126961522") ] }
{ "_id" :ObjectId("4d7bc984b8a04f5126961524"), "balance" :1100, "name" :"B", 
    "pendingTransactions" :[ ObjectId("4d7bc7a8b8a04f5126961522") ] }
```

#### Step 4. 設置事務狀態為 committed 

```
db.transactions.update({_id:t._id},{$set:{state:"committed"}})
```
結果如下，`state`修改為`committed`。

```
{ "_id" :ObjectId("4d7bc7a8b8a04f5126961522"), "destination" :"B", 
    "source" :"A", "state" :"committed", "value" :100}
```

#### Step 5. 移出帳戶內事務資訊，並修改事務狀態為`done`
首先我們將帳戶內的事務資訊給刪除，因為已經不需要了。

```
db.accounts.update({name:t.source},{$pull:{pendingTransactions: t._id}})
db.accounts.update({name:t.destination},{$pull:{pendingTransactions: t._id}})
```
結果如下。

```
{ "_id" :ObjectId("4d7bc97fb8a04f5126961523"), "balance" :900, "name" :"A", 
    "pendingTransactions" :[ ] }
{ "_id" :ObjectId("4d7bc984b8a04f5126961524"), "balance" :1100, "name" :"B", 
    "pendingTransactions" :[ ] }
```
然後我們最後再將事務狀態修改為`done`。

```
db.transactions.update({_id:t._id},{$set:{state:"done"}})
```

結果如下。

```
{ "_id" :ObjectId("4d7bc7a8b8a04f5126961522"), "destination" :"B", 
    "source" :"A", "state" :"done", "value" :100}
```

上面這一整串`Step1`到`Step5`的流程就是`two phase commit`的流程。

### 發生失敗的操作
上面都是跑正常的轉帳流程，還看不出這麻煩的流程可以做啥，所以我們這時來看看，如果中途轉帳時發生錯誤時，則流程要著麼樣跑，可以回復成原始模樣。

我們只直接用如果已經更新帳戶內的`balance`後發生錯誤要著麼進行回復。

#### Step 1. 設置事務狀態為 canceling 

```
db.transactions.update({_id:t._id},{$set:{state:"canceling"}})
```

#### Step 2. 回復為原始狀態

```
db.accounts.update({name:t.source, 
    pendingTransactions: t._id},
    {$inc:{balance: t.value}, 
    $pull:{pendingTransactions:t._id}})
    
db.accounts.update({name:t.destination, 
    pendingTransactions: t._id},
    {$inc:{balance: -t.value}, 
    $pull:{pendingTransactions:t._id}})
```
然後我們可以看一下回復後的結果，嗯沒錯，就是原始的樣子。

```
{ "_id" :ObjectId("4d7bc97fb8a04f5126961523"), "balance" :1000, 
    "name" :"A", "pendingTransactions" :[ ] }
{ "_id" :ObjectId("4d7bc984b8a04f5126961524"), "balance" :1000, 
    "name" :"B", "pendingTransactions" :[ ] }
```
#### Step 3. 設置事務狀態為`canceled`
最後再修改事務狀態，然後收工。

```
db.transactions.update({_id:t._id},{$set:{state:"canceled"}})
```

## ~ 結語 ~
這篇文章說簡單的解釋了事務操作是啥以及特性，並且也有說明沒有事務操作會發生什麼事情，然後也說明了事務操作在`mongodb`內的假實現，因為他並沒有完全的實現，所以我很喜歡叫他假實現。

基本上這個鐵人賽已經進入尾尾聲了，基本上最後一篇已經不太會說技術的東西，也只是這三十天的心得，請見諒，因為我累囉~~~~~

## ~ 參考資料 ~
* [https://zh.wikipedia.org/wiki/%E6%95%B0%E6%8D%AE%E5%BA%93%E4%BA%8B%E5%8A%A1](https://zh.wikipedia.org/wiki/%E6%95%B0%E6%8D%AE%E5%BA%93%E4%BA%8B%E5%8A%A1)
* [https://docs.mongodb.com/manual/tutorial/perform-two-phase-commits/](https://docs.mongodb.com/manual/tutorial/perform-two-phase-commits/)
