Exported Follow List 导出的追番列表
======
导出的追番列表会包括大部分追番信息，但是将不包括一些缓存之类的东西。导出的追番列表将优化为方便其他软件导入。

Format 格式 
------
追番列表采取JSON格式存储

Sample 样例
------
注意是**样例**

	{
		"follow_list_version":1,
		"timestamp":<TIMESTAMP>,
		"following":[
			{
				"name":"人类衰退之后",
				"description":"[人類は衰退しました] 我擦完全没有衰退的嘛。其实已经看过了这里只是样例",
				"type":"regular",
				"tracking":{
					"matcher":"人类衰退之后 (\d+)",
					"excluder":""
				},
				"checkInterval":518400,
				"total":12,
				"current":8,
				"cached":"@1"
			},
			{
				"name":"自新世界",
				"description":"[新世界より] 前面崩的唉，后面倒是妥妥神作展开了。",
				"type":"regular",
				"tracking":{
					"matcher":"自新世界 (\d+)",
					"excluder":"生肉"
				},
				"checkInterval":604800,
				"total":23,
				"current":22,
				"cached":"@2"
			},
			{
				"name":"微博上的不科学图片合集",
				"description":"微博上的搞笑图，不定期更新",
				"type":"simple",
				"tracking":{
					"matcher":"微博上各种不科学的图·第([一二三四五六七八九十百千万]+)辑",
					"excluder":""
				},
				"current":13
			},
			{
				"name":"狂乱家族日记",
				"description":"这里介绍分P视频的追法",
				"type":"collection"
				"tracking":{
					"origin":"@A"
				},
				"current":13,
				"total":26
			}
		],
		"finished":[
			{
				"name":"未来都市No.6",
				"description":"[No.6] 儿童文学，不评",
				"tracking":"{\"matcher\":\"OMITTED\",\"excluder\":\"\",\"type\":\"regular\"}",
				"total":11
			},
			{
				"name":"命运石门",
				"description":"[Steins;Gate]",
				"tracking":"",
				"total":24
			}
		],
		"wishlist":[
			{
				"name":"问题儿童都来自异世界",
				"description":"[問題児たちが異世界から来るそうですよ？] 感觉会是很萌，唉，没法追。",
				"tracking":{
					"matcher":"问题儿童都来自异世界？(\d+)"
				},
				"cached":"@3",
				"image":"@4"
			},
			{
				"name":"曾几何时天黑的魔兔",
				"description":"[いつか天魔の黒ウサギ]没看过，但不阻止咱们黑一下命名。Wishlist记录可以没有tracking信息。因为这里的记录可能是由别的站点）（比如 Bangumi） 得联动插件同步进入的，这些情况下，就只有 name 和 description 了",
				"image":"http://some.com/image.jpg?这是一个封面图，可选"
			},
			{
				"name":"",
				"description":"av345取材的那个动画 (Wishlist 里面可以松散到没有标题，虽然不推荐这么做)"
			}
		],
		"refs":{
			"@1":["avXXX","avXXX","avXXX"...""],
			"@2":[...],
			"@3":[...],
			"@4":"http://image.bilibili.tv/nonexistant.jpg",
			"@A":"av46448",
			"PLATFORM":{
				"origin":"Chottobilibili v1.2 (Chrome)/Export",
				"other_items":["author","tags","sp"],
				"author":[],
				"tags":[],
				"sp":[],
				"templates":{
					"description":"(\\[.+?\\]){0,1}(.*)",
					"cache":"av(\d+)",
					""
				}
			}
		}
	}


1. Specification
------
(MAND) : Defines a mandatory field or property, any export file without this field should be labelled incorrect and no further efforts should be made to parse it. 这个标签定义了一个必要的属性或者字段，任何一个 export 的 follow list 如果缺少这个字段将会被视为无效，并放弃解析。

(RECM) : Defines a recommended field or property, an export file (or portion of a file) without this field or property should be parsed, but errors or warnings can be given. Clients may depend on (RECM) fields and it is expected that most exporters create these fields anyway. 定义了一个推荐的字段，任何一个不存在这个字段的 export 文件虽然有效，但是可能引发客户端的错误或者警告。客户端可以依赖 RECM 字段的存在来工作。理论上大部分靠谱的导出器都会包含这个字段的。

(OPTI) : Defines optional fields or properties. A client SHOULD NOT rely on OPTI fields to exist and SHOULD NOT throw any errors or warnings on absence of OPTI fields. 这里定义的是可选字段，字段不能被任何实现所依赖，不过大致属性应该保持基本连贯。客户端不得因为这个字段的不存在而抛出错误。

(IMPL) : Implementation Specific. A client should ACTIVELY IGNORE this field if it does not recognize it. This is to guarantee extra data for a main plugin to create a healthy resurrection when re-inserting/importing an exported follow list. For example, this field could define an "id" value, which may be a number, a hash or anything the client determines. If another client also uses "id", it MUST check that its interpretation of "id" is the same as what is given when "id" is implementation specific. 这是一条因人而异的设置，客户端不能依赖这个设置，且使用之前必须检测其实现正确（不违背插件自己的理解）。 

- (MAND) follow_list_version :

	This defines an integer representation of the version of the exported list format. This spec is for Version 1, which is (hopefully) the only version available. A version # above the interpreter's expected version may differ from the spec, so it should not be parsed further. A version # below this version may not have implemented all MAND or RECM features, so a client should treat all fields as (MAND=>)OPTI or (RECM=>)IMPL. 
	
- (RECM) timestamp :
	
	An integer/numerical timestamp of when the list was generated. This is recommended for versioning of the list itself. It should be in a consistant timezone (GMT is recommended). It should be at least precise to the date.
	
- (MAND) following :
	  
	This defines a list of all the currently following series. All implementations must at least have a list.
	  
- (RECM) finished : 

	This defines a list of all the watched series, it compacts and serializes data required for follows, and strips down the record for archiving.
	
- (RECM) wishlist :

	This defines a list of loosly-defined series information. Some keys may be filled in detail while others may just be a stub.

- (RECM) refs : 

	The refs section is a hasmap object of keys => objects. This defines correspondance between some non-important strings/objects. It could, also, be used in place of weakly typed records (follow cache lists that could be String, list, listlist...). Readers may choose to omit the refs field reference if it cannot handle it (mobile clients may choose to discard refs to and display weakly typed/non-important data as a string of the ref-id. However, the refs key SHOULD BE present.

