ChottoBilibili
==============

ChottoBilibili is a Chrome extension for 'following' feature in ACG sites in China. 
It allows view status syncing and other user-friendly features. 

稍微有点Bilibili，是一个（现开源）的Chrome扩展，其包含一套用于增强B站及其他ACG站点功能的工具套件。


Composition
==========

ChottoBilibili is composed of 3 parts. 1) /extension/ is the code for the Chrome Extension which can be compiled into a crx. 2) /server/ is server code for syncing, it is released as two versions /server/php and /server/node which correspond to different implementations of the server syncing functionality. 3) /openacgsync/ is a plugin for EXISTING sites to incorporate sync and notify functionality (expose an API) for ChottoBilibili to take advantage of. The protocol and sample implementations are defined in this folder.

组成
---
本工程由三个部分组成，1) /extension/ 部分是Chrome扩展的源代码，可编译为 crx 并安装到Chrome浏览器中。 2) /server/ 是同步服务器的实现，其中分为 php 和 nodejs 两种实现。 3) /openacgsync/ 是一个用于给现在站点当作扩展的一个API接口实现，其定义了一套可由ChottoBilibili 插件利用的通信通告和同步API，现有站点将可以很简单的嵌入 ChottoBilibili 的功能，同时开发者们也可以参考协议开发其他的插件来实现兼容。

