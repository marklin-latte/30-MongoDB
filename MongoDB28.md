# 30-28之運用研究---股價應用模擬(3)
上一篇研究簡單的說明完，股價分析的運用操作後，接下來我們這篇文章將要說明一些程式交易的東西，不過雖然說是程式交易，但事實上也只是簡單的計算出技術分析指標然後產生出買賣時間點，要說是程式交易好像也不太算兒……。

## ~ 二哈的需求分析 ~
今天咱們的二哈和我說，啊鳴~ 最近我想搞搞程式交易 ~ 幫我一下，然後我問他你想做啥，他竟然回，我也不知道也 ~ 我只是聽說那很潮、很容易賺錢 ~ 幫我咱 ~咱們是好哥吧，然後我一直在笑他你傻了啊，最後他就用出這種表情。

![](http://yixiang8780.com/outImg/20161228-1.jpeg)

雖然很想和他說~你何不食屎忽 ~ 但想到要愛護動物就想是幫他想一下。

回到正題，說到程式交易我們先看一下智庫的定義。

> 　　程式交易在英文中叫做Program Trading, 就是將自己的金融操作方式，用很明確的方式去定義和描述，且遵守紀律的按照所設定的規則去執行交易。

上面只是定義，不過我簡單的說明一下我的認知，就是『寫個策略計算出買賣點，然後叫電腦乖乖的進行交易』。

網路上以及論文都有提供一些策略，你可以自已去試試看，不過會不會賺錢小的我就不知道了，順到幫我老師打廣告一下，如果對金融應用感興趣的可以看看他寫的書，[傳送門在此](http://www.books.com.tw/products/0010731726)。

好再一次回來正題，那我們在這邊就簡單的講幾個策略……真的很簡單，因為我模擬的資料只有`k線`別忘囉。

1. 二哈可以利用30天移動平均線與當日開盤價進行買點與賣點的計算。
2. 二哈可以用五天期的平均成交量低於十天前的五天期平均成交量的 75%這策略來進行交易。

就來這兩個吧~

## ~ 實作 ~

### 二哈可以利用30天移動平均線與當日開盤價進行買點與賣點的計算
首先咱們先來完成這個需求，在投資股票時，有個東西你在看k線時，幾乎所有的開盤軟體都會提供，它就是移動平均線，其中它又有十天線、月線、季線、年線、二年線等，簡單來說，十天線就是用前十天的平均來計算出來的一條件，非常的`Easy`。

然後我們來看看我們的月線也就是30天期線的產生，首先先看看最外面有個變數`temp`，它是一個陣列，用來存放`30`天的開盤價，為了用來計算平均數用的，但有點注意，如果只是在外面宣告個`var temp = []`這樣在`mongodb`的`mapreduce`函數是無法使用的。

那要著麼使用呢 ? 拉下面一點會看到有個參數物件，其中的`scope`就是讓我們可以使用`全域變數 temp` 。

`temp`看完後在來看看我們的主體`mapreduce`，但在執行`mapreduce`之前，我們會先進行`query`，將`code`為`8111`的尋找出來，這邊有個金句要注意一下。

> 盡可能的在進行資料分析時，先將不需要的資料篩選剔除掉，這是個黃金法則。

```
var temp =[];
var result = db.stocks.mapReduce(
    function(){
		if(temp.length < 30){
			temp.push(this.open);
			emit(this.date,0);
		}else{
			temp.splice(0,1);
			temp.push(this.open)
			var sum =0,
				avg =0,
		    	tempCount = temp.length;
			for (var i=0;i<tempCount;i++){
				sum += temp[i];
			}
			avg = sum/tempCount;
			var diff = Math.round(this.open - avg);
			emit(this.date,diff);
		}
	},
    function(key,values){
     	return values[0];
    },
    { 
     	out : "test",
     	query : { "code" : "8111" },
     	scope : {
     		"temp" : temp
     	}
     }
)
```
然後我們繼續的來看`map`函數，我們這邊打算直接輸出`30天平均值與開盤價的差`，當差值由負轉正時為買點，由正轉負時為賣點。我們首先會先處理前30天，的資料，在這前30天中，我們就直接輸出`0`，並且同時將開盤價存入`temp`，接下來在開始計算每一天的30天移動平均值。

```
    function(){
		if(temp.length < 30){
			temp.push(this.open);
			emit(this.date,0);
		}else{
			temp.splice(0,1);
			temp.push(this.open)
			var sum =0,
				avg =0,
		    	tempCount = temp.length;
			for (var i=0;i<tempCount;i++){
				sum += temp[i];
			}
			avg = sum/tempCount;
			var diff = Math.round(this.open - avg);
			emit(this.date,diff);
		}
	}

```

最後我們會產生出如下的結果，例如在`20170517`，差值由負轉正時就是一個買點，更金融一點的說法是，當開盤價突破30天移動平均線時，就可以進場囉。

```
{ "_id" : ISODate("2017-05-15T14:21:08.037Z"), "value" : -31 }
{ "_id" : ISODate("2017-05-16T14:21:08.037Z"), "value" : -32 }
{ "_id" : ISODate("2017-05-17T14:21:08.037Z"), "value" : 3 }
{ "_id" : ISODate("2017-05-18T14:21:08.037Z"), "value" : 5 }
…
…
…
```

好這個需求就先做到這囉，來換換下個，呃對了至於`reduces`麻，事實上沒啥用到……。

### 二哈可以用五天期的平均成交量低於十天前的五天期平均成交量的 75%這策略來進行交易

嗯……事實上這策略是還在研究生時期看的一本書名很長的書寫的，有興趣的朋友可以去找找。

>Quantitative Trading Strategies: 
Harnessing the Power of Quantitative Techniques to Create a Winning Trading Program [就素這本](https://www.amazon.com/Quantitative-Trading-Strategies-Harnessing-McGraw-Hill/dp/0071412395)。

不過事實上這個策略還需要搭配其它的策略一起使用勝率才比較高，不過不前只是借來模擬模擬，就懶的考慮著麼多囉。嗯好吧咱們來開始寫點程式。

首先我們需要三個全域變數，一個為陣列取名為`tempVol5`，存放用來計算5天平均成交量的值，而第二個變數取名為`temp`，用來存放十天前的五天期平均成交量，最後一個為`tempVol10`是存放，十天內的所有五天平均成交量。


```
var temp = 0,tempVol10 = [],tempVol5 = [];
var result = db.stocks.mapReduce(
    function(){
		if(tempVol5.length < 5){
			tempVol5(this.volume);
			tempVol10(this.volume);
			emit(this.date,0);
		}else{
			var sum =0,avg =0,last10avg = 0,
		   		tempCount = tempVol5.length;
			tempVol5.splice(0,1);
			tempVol5.push(this.volume)
			for (var i=0;i<tempCount;i++){
				sum += tempVol5[i];
			}
			avg = sum/tempCount;
			if(tempVol10.length == 10){
				last10avg = tempVol10[0];
				tempVol10.splice(0,1);
				tempVol10.push(avg);
			}
			var values = Math.round((tempVol10 - avg)/tempVol10)*100);
			emit(this.date,values);
		}
	},
    function(key,values){
     	return values[0];
    },
    { 
     	out : "test",
     	query : { "code" : "8111" },
     	scope : {
     		"temp" : temp,
     		"tempVol5" : tempVol5,
     		"tempVol10" : tempVol10
     	}
     }
)
```
執行結果大概會長降，其中以`20170515`的結果來看，它的`80`代表的意思為當天的五天期平均成交量小於十天前的五天期成交量的80%，代表成交量極縮，可能會反彈，所以可考慮為買點，而反之成交量過大，可考慮為賣點。

```
{ "_id" : ISODate("2017-05-15T14:21:08.037Z"), "value" : 80 }
{ "_id" : ISODate("2017-05-16T14:21:08.037Z"), "value" : 82 }
{ "_id" : ISODate("2017-05-17T14:21:08.037Z"), "value" : 50 }
{ "_id" : ISODate("2017-05-18T14:21:08.037Z"), "value" : 58 }
…
…
…
```
呼呼~~就先到這邊吧，我真的不太喜歡在這寫回測，真的有點難寫，不過說實話，我只是想複習一下`mapreduce`才在這邊寫的，呼呼呼~。

## ~ 結語  ~
本篇文章運用了`mapreduce`來運算出這兩種策略的可買賣時機，說實話不是很好用，而且很不好`debug`，就算改寫成`node`然後使用`devtool`來進行`debug`，它還是不給我跳進去，真的很頭痛，所以當時只能慢慢的一行一行測，唉唉唉~~ 不知不覺一定到了第28天了，鐵人賽也將要結束囉，明天就補充一些之前忘了說的東西好囉。