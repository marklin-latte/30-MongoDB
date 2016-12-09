# 30-12之索引(2)---複合索引
本文將會說明以下幾點

* 複合索引是啥
* 複合索引的運用

## ~複合索引~
假設有下列資料。

```
{ "name" : "mark" , "age" : 20}
{ "name" : "mark" , "age" : 25}
{ "name" : "steven" , "age" : 30}
{ "name" : "max" , "age" : 15}

```
在上一篇文章中，如果要建立`name`的索引，是像下面這樣。

```
db.user.ensureIndex({"name" : 1})
```
這時`mongodb`就會大致上將索引建成如下。

```
索引目錄         存放位置
["mark"]    -> xxxxxxxx
["mark"]    -> xxxxxxxx
["max"]     -> xxxxxxxx
["steven"]  -> xxxxxxxx

```
而所謂的`複合索引`事實上就是只是針對多個欄位建立索引，如下。

```
db.user.ensureIndex({"name" : 1 , "age" : 1})
```

而`mongodb`就會建立索引如下。

```
索引目錄         存放位置
["mark",20]    -> xxxxxxxx
["mark",25]    -> xxxxxxxx
["max",15]     -> xxxxxxxx
["steven",30]  -> xxxxxxxx

```

