# 30-2 : 使用Docker來建構MongoDB

由於網站上已經有很多`MongoDB`的安裝方法，所以本篇將來說明，如何使用`Docker`來建立`可使用MongoDB的環境`，這也代表你的電腦只要有安裝`Docker`，都可以使用`MongoDB`，不需要再去找各種系統的安裝方法，以及最後幾篇會用`Docker`來模擬擴展多台的`MongoDB`。


## 安裝Docker

### Mac安裝
[https://docs.docker.com/docker-for-mac/](https://docs.docker.com/docker-for-mac/)

Docker最開始時還沒支援Mac，而是需要用到其它方法來使用，但現在已經有出`Docker-for-Mac`了，但注意雖然他是穩定版，但在mac自動休眠後，常常發生`Bad response from Docker engine`，這目前好像沒啥解法，只能reset docker……

### Windows7 安裝
[https://www.docker.com/products/docker-toolbox](https://www.docker.com/products/docker-toolbox)

雖然出了`Docker-for-windows`但目前只支援`Windows10和Server 2016`，windows7哭哭了。

### Windows10 安裝
[https://docs.docker.com/docker-for-windows/](https://docs.docker.com/docker-for-windows/)

### Ubuntux 安裝
請參考這篇安裝。
[https://philipzheng.gitbooks.io/docker_practice/content/install/ubuntu.html](https://philipzheng.gitbooks.io/docker_practice/content/install/ubuntu.html)