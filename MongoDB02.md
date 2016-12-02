# 30-2之使用Docker來建構MongoDB

由於網站上已經有很多`mongodb`的安裝方法，所以本篇將說明，如何使用`Docker`來建立`可使用mongodb的環境`，這也代表你的電腦只要有安裝`docker`，都可以使用`mongodb`，不再需要去找各種東西的安裝方法。

## 安裝`Docker`

### Mac安裝
[https://docs.docker.com/docker-for-mac/](https://docs.docker.com/docker-for-mac/)

`docker`最開始時還沒支援`mac`，而是需要用到其它方法來使用，但現在已經有出`docker-for-Mac`了，但注意雖然他是穩定版，但在`mac`自動休眠後，常常發生`Bad response from Docker engine`……，這目前好像沒啥解法，只能`reset docker` 或 重開機 ……

### Windows7 安裝
[https://www.docker.com/products/docker-toolbox](https://www.docker.com/products/docker-toolbox)

雖然出了`docker-for-windows`但目前只支援`windows10和Server 2016`，windows7哭哭。

### Windows10 安裝
[https://docs.docker.com/docker-for-windows/](https://docs.docker.com/docker-for-windows/)

懶講。

### Ubuntu 安裝

[https://philipzheng.gitbooks.io/docker_practice/content/install/ubuntu.html](https://philipzheng.gitbooks.io/docker_practice/content/install/ubuntu.html)

請參考這篇安裝。

## 建立`docker-compose.yml`

在某個檔案夾下建立`docker-compose.yml`，並且內容如下，然後在執行`docker-compose up`指令，它就自動幫你建立一個裝有`mongodb`的環境。

```
version: '2'

services:
  mongo:
    image: mongo
    ports:
      - "27017:27017"
    volumes_from:
      - mongodata
  mongodata:
    image: tianon/true
    volumes:
      - /data/db
```

下圖為在該檔案夾下執行`docker-compose up`結果。可以看到他建立一個port為27017並且資料存放在環境`/data/db`的`mongodb`。

![Alt text](http://yixiang8780.com/outImg/20161129-1.png)

## 進入Docker Container裡操作MongoDB

在執行完`docker-compose up`後，換到另一個`shell`，然後你可以執行`docker ps`指令來確定有`mongodb`的`container`有沒有執行，你可以把`container`想成為一個很小的`VM`。

從下圖可知，執行`docker ps`後可看到你這台電腦有在執行的`container`，其中`mongo`就是我們剛剛執行的。

![Alt text](http://yixiang8780.com/outImg/20161129-2.png)

接下來我們就執行`docker exec -ti 333fba82b57e bash`，其中`333fba82b57e`為`CONTAINER ID`，如下圖，你就進入到這個`container`中囉。

![Alt text](http://yixiang8780.com/outImg/20161129-3.png)

最後在執行`mongo`你就可以執行`mongodb`的指令囉。

![Alt text](http://yixiang8780.com/outImg/20161129-4.png)


## 結語
`docker`如果學會真的是很方便，如果是在`team`中，有新人來，不在需要和他說要安裝啥、安裝啥、然後卡到大喊學長救我，學長事實上會有點……，除非人真的很好，又或是他對你有意思。

各位`+u^2`。

## 參考資料

[https://joshhu.gitbooks.io/dockercommands/content/Containers/IntoContainers.html](https://joshhu.gitbooks.io/dockercommands/content/Containers/IntoContainers.html)





