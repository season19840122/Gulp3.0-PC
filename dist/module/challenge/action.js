define(['jquery', 'vue', 'commons'], function ($, Vue, COMMONS) {
	//初始化配置
	COMMONS.init({
		hostImg: "../../",
		baseUrl: {
			dev: "./testUrl/",
			pub: localPath
		},
		staticPath:"../../",
		barId: 1211,
		playerAccount : 254332471,
		needShowRecord : $('#needShowRecord').val(),
		needShowRules : $('#needShowRules').val(),
		useOn: "dev"
	});

	var urlObj = {
		queryState: {
			name: "初始化状态",
			url: {
				dev: "queryState.json",
				pub: "challenge/queryChallengeMatchState"
			},
			data:function(challengeMatchId) {
				return "challengeMatchId="+challengeMatchId
			}
		},
		getAllChallenge: {
			name: "挑战赛信息",
			url: {
				dev: "allChallenge.json",
				pub: "challenge/getAllChallengeMatchInfo"
			}
		},
		getChallengeLevelInfo: {
			name: "挑战场次",
			url: {
				dev: "challengeLevelInfo.json",
				pub: "challenge/getChallengeLevelInfo"
			},
			data: function(challengeMatchId) {
				return "challengeMatchId="+challengeMatchId+"&playerAccount="+ClientAPI.getSubAccount(GameID.LOL);
			}
		},
		challengeApply: {
			name: "开启挑战",
			url: {
				dev: "challengeApply.json",
				pub: "challengeApply/challenge"
			},
			data: function(challengeLevelId) {
				return "barId="+COMMONS.options.barId+"&challengeLevelId="+challengeLevelId+"&playerAccount="+ClientAPI.getSubAccount(GameID.LOL);
			}
		},
		enterRoom: {
			name: "进入房间",
			url: {
				dev: "enterRoom.json",
				pub: "challengeApply/enterRoom"
			},
			data: function(challengeLevelId,orderId) {
				return "barId="+COMMONS.options.barId+"&challengeLevelId="+challengeLevelId+"&orderId="+orderId+"&playerAccount="+ClientAPI.getSubAccount(GameID.LOL);
			}
		},
		payStatus: {
			name: "查询支付",
			url: {
				dev: "payStatus.json",
				pub: "recharge/payFinished"
			},
			data: function(orderId) {
				return "orderId="+orderId;
			}
		},
		listRecordsUrl: {
			name: "挑战纪录",
			url: {
				other:function() {
					var baseUrl = COMMONS.options.baseUrl[COMMONS.options.useOn];
					if(COMMONS.options.useOn == "pub") {
						return baseUrl+"challenge/listChallengeRecords";
					} else {
						return baseUrl+"listRecords.json";
					}
				}
			}
		},
		listDetailUrl: {
			name: "记录详情",
			url: {
				other:function() {
					var baseUrl = COMMONS.options.baseUrl[COMMONS.options.useOn];
					if(COMMONS.options.useOn == "pub") {
						return baseUrl+"challenge/listChallengeRoomPlayers";
					} else {
						return baseUrl+"listDetail.json";
					}
				}
			}
		},
		url_checkChallengeMatchUserState:function(challengeMatchId, gameId) {
			var baseUrl = COMMONS.options.baseUrl[COMMONS.options.useOn];
            return baseUrl + "challenge/checkChallengeMatchUserState?challengeMatchId=" + challengeMatchId +
                "&playerAccount=" + ClientAPI.getSubAccount(GameID.LOL)+
                "&gameId=" + gameId;
		}
	};

	var vue = new Vue({
		el: ".box",
		data: {
			cha_state:{},
			flag: {
				rules: false, //是否显示规则
				game: true, //是否显示主列表
				alert: false, //是否显示弹出框
				apply: false, //是否显示报名框
				pay: false, //是否显示支付框
				records: false, //是否显示列表框
				shun1: true, 
				shun2: true, 
				shun3: true,
				switch: false,//账号切换框
				qrcode: true, //是否显示二维码框
				sd: false, //是否显示顺豆框
				noSd: false, //顺豆支付按钮是否可点
				onlyQ: false, //是否只有二维码支付
				noLogin: false, //是否登录游戏
				onlyS: false, //是否只有顺豆支付
				vipTip: false, //是否显示顺豆支付vip
				lastSd: false //是否显示顺豆支付剩余顺豆
			},
			timeBackInte:null,
			timeBackStr:"",
			account:"",//已登录火马的账号
			level_1:{},
			level_2:{},
			level_3:{},
			loginPic:"",//切换用户的头像
			title:"",
			sd_word:"",//顺豆支付按钮文字
			sd_last:"",//顺豆支付剩余顺豆数目
			challengeMatchId:"",
			challengeLevelId:"",//挑战接口成功后的参数
			alert_msg:"",
			alert_title:"",
			pay: {
				money: "",
				orderId: "",
				timeNum: 300,
				timeBack: "",
				timeQuery: "",
				isCloseQrcodeBack: ""
			}
		},
		computed: {
			
		},
		mounted: function () {
			document.onselectstart = function() {
				return false;
			}
			this.getAllChallenge();
			this.showChallengeRulesList();
		},
		watch: {
			'flag.alert': function () {
				if (this.flag.alert) {
					this.flag.apply = false;
					this.flag.pay = false;
				}
			}
		},
		methods: {
			switchLi: function (e) {
				var target = e.target;
				var type = $(target).attr('data-type');
				this.flag.qrcode = false;
				this.flag.sd = false;
				var t = this;
				if (target.className != "active") {
					$(target).siblings('li').removeClass('active');
					$(target).addClass('active');
					this.flag[type] = true;
				}
				//点击顺豆标签后关闭扫码倒计时
				if (type == 'sd') {
					t.closeQrcode();
				} else {
					this.pay.timeNum = 300;
					this.qrcodeTimeBack();
					//重新开始查询支付状态
					this.pay.timeQuery = setInterval(function () {
						t.payFinished();
					}, 3000);
				}
			},
			flush:function() {
				var hostUrl = location.href;
				if(hostUrl.indexOf('needShowRecord') != -1) {
					hostUrl = hostUrl.replace('needShowRecord','a');
				}
				if(hostUrl.indexOf('needShowRules') != -1) {
					hostUrl = hostUrl.replace('needShowRules','a');
				}
				location.replace(hostUrl);
			},
			showAlert: function (title, msg) {
				this.alert_title = title;
				this.alert_msg = msg;
				this.flag.alert = true;
			},
			queryState: function (challengeMatchId) {
				var URLOBJ = urlObj.queryState;
				if (URLOBJ.again) return;
				URLOBJ.again = true;
				var t = this;
				COMMONS.ajax({
					urlObj:URLOBJ,
					name: URLOBJ.name,
					url: URLOBJ.url,
					data:URLOBJ.data(challengeMatchId),
					success: function (obj) {
						URLOBJ.again = false;
						if (obj['success'] && obj['code'] == 0 && obj['data']) {
							var data = obj.data;
							t.cha_state.isLogin = data.isLogin;
							t.cha_state.matchType = data.matchType;
							t.cha_state.allowTeam = data.allowTeam;
							t.cha_state.limitMinute = data.limitMinute;
							t.cha_state.levelLimitMin = data.levelLimitMin;
							t.cha_state.levelLimitMax = data.levelLimitMax;
							t.cha_state.rankRemark = data.rankRemark;
						} else if (!obj['success']) {
							
						}
					}
				});
			},
			getAllChallenge: function () {
				var URLOBJ = urlObj.getAllChallenge;
				if (URLOBJ.again) return;
				URLOBJ.again = true;
				var t = this;
				COMMONS.ajax({
					urlObj:URLOBJ,
					name: URLOBJ.name,
					url: URLOBJ.url,
					success: function (obj) {
						URLOBJ.again = false;
						if(obj['success'] && obj['code'] == 0) {
							var data = obj['data'],
								challengeMatchId = data[0].challengeMatchId,
								limitApply = data[0].limitApply,
								matchType = data[0].matchType,
								title = "";
							if(matchType == 1) {
								title = "十人场";
							} else if(matchType == 2) {
								title = "百人场";
							} else if(matchType == 3 && limitApply == 2) {
								title = "双人场";
							} else if(matchType == 3 && limitApply == 3) {
								title = "三人场";
							}
							t.title = title;
							t.challengeMatchId = challengeMatchId;
							t.queryState(challengeMatchId);//初始化状态
							t.getChallengeLevelInfo(challengeMatchId);//初始化场次列表
							
						}
					}
				});
			},
			getChallengeLevelInfo: function (challengeMatchId) {
				var URLOBJ = urlObj.getChallengeLevelInfo;
				if (URLOBJ.again) return;
				URLOBJ.again = true;
				var t = this;
				COMMONS.ajax({
					urlObj:URLOBJ,
					name: URLOBJ.name,
					url: URLOBJ.url,
					data:URLOBJ.data(challengeMatchId),
					success: function (obj) {
						URLOBJ.again = false;
						var data = obj['data'];
						data.map(function(v) {
							var awardSwBean = v.awardSwBean,
								levelName = v.levelName,
								challengeLevelId = v.challengeLevelId,
								countdown = v.countdown,
								levelType = v.levelType,
								applySwBean = v.applySwBean,
								gameType = v.gameType,
								applyWay = v.applyWay,
								applyMoney = v.applyMoney,
								//0：可挑战; 1：挑战倒计时; 2：不可挑战；3:暂未开放；4：明日再战
								state = v.state;
							var joinStr = "SwBean"==applyWay?"报名费：<span>"+applySwBean+"</span>顺豆":"报名费：<span>"+applyMoney+"</span>元";
							
							t['level_'+levelType] = {};
							t['level_'+levelType].name = levelName;
							t['level_'+levelType].type = gameType;
							t['level_'+levelType].joinStr = joinStr;
							t['level_'+levelType].awardSwBean = awardSwBean;
							t['level_'+levelType].challengeLevelId = challengeLevelId;
							analysisChallenge(v);
						})
						function analysisChallenge(v) {
							if(v.state == 1) { //挑战倒计时
								var countTime = new Date().getTime() + v.countdown * 1000;
								t.flag['shun'+v.levelType] = false;
								
								//处理倒计时
								t.countBack(countTime);
								t['level_'+v.levelType].className = "game";
								t['level_'+v.levelType].aName = "开始游戏";
								t['level_'+v.levelType].clickFlag = true;
								t['level_'+v.levelType].beginGame = true;
								t['level_'+v.levelType].beginCha = false;
							} else if(v.state == 0) { //可挑战
								t.flag['shun'+v.levelType] = true;
								t['level_'+v.levelType].className = "cha";
								t['level_'+v.levelType].aName = "开始挑战";
								t['level_'+v.levelType].clickFlag = true;
								t['level_'+v.levelType].beginGame = false;
								t['level_'+v.levelType].beginCha = true;
							} else if(v.state == 2 || v.state == 3 || v.state == 4) { //不可挑战
								t.flag['shun'+v.levelType] = true;
								t['level_'+v.levelType].className = "close";
								t['level_'+v.levelType].aName = "开始挑战";
								t['level_'+v.levelType].clickFlag = false;
							}
						}
						console.log(t.level_1);
						console.log(t.level_2);
						console.log(t.level_3);
					}
				});
			},
			loginGame:function() {
				var gameId = GameID.LOL;
				ClientAPI.switchStartInfo(gameId, true);
				this.flag.noLogin = false;
				this.flag.alert = false;
			},
			challengeValidate:function(
				validateLoginOnly, 
				challengeMatchId, 
				levelLimitMin,
				levelLimitMax, 
				rankRemark,
				callBack
			) {
				var t = this;
				var gameId = GameID.LOL;
				//校检火马登录
				var user = ClientAPI.getLoginXingYun();
				if(!user.hasOwnProperty("userId") || user.userId == 0) {
					//调起登陆窗
					ClientAPI.startLogin('VC_LOGIN');
					return;
				}
				//只校检登陆
				if(validateLoginOnly) {
					callBack();
					return;
				}
				//校检游戏登录
				var loginGame = ClientAPI.getLoginGame(gameId);
				if(!loginGame) {
					t.flag.noLogin = true;
					t.showAlert("友情提示","请先登录<span>" + GameName.get(gameId) + "</span>，才能报名参加比赛哦");
					return;
				}
		
				//校检等级
				if(loginGame.level < levelLimitMin) {
					t.showAlert("友情提示","召唤师等级<span>未满"+levelLimitMin+"级</span>，不能参与挑战哦~");
					return;
				}
				//校检等级
				if(loginGame.level > levelLimitMax) {
					t.showAlert("友情提示","召唤师等级<span>超过"+levelLimitMax+"级</span>，不能参与挑战哦~");
					return;
				}
		
				//校检挑战赛状态和用户绑定关系
				var postData = {};
				postData.challengeMatchId = challengeMatchId;
				postData.gameId = gameId;
				postData.account = loginGame.account;
				var resultData = Action.getData(urlObj.url_checkChallengeMatchUserState(gameId), postData);
				if(!resultData) {
					t.showAlert("","服务器异常，请稍后再试！");
					return;
				}
		
				console.log(!resultData['success'] && resultData['code'])
				if(!resultData['success'] && resultData['code']) {
					if(resultData['code'] == 1004) {
						var otherUser = resultData['data'];
						t.loginPic = COMMONS.options.staticPath + "upload/userhead/middle/" + ((otherUser.headImgUrl) ? otherUser.headImgUrl : "1") + ".png";
						t.account = loginGame.account;
						t.flag.switch = true;
						$("#alert_switch img").off("click").on("click", function() {
							//调起客户端快速登录窗
							User.loginOtherUser(otherUser.userIdHex, function(retData) {
								if(retData.success) {
									t.flag.switch = false;
								} else {
									t.showAlert("",retData.message);
								}
							});
						});
					} else {
						t.showAlert("",resultData.message);
					}
					return;
				}
				callBack();
				return;
			},
			goGame:function() {
				console.log("开始游戏");
			},
			beginAction:function(num) {
				if(!this['level_'+num].clickFlag) return;
				if(this['level_'+num].beginGame) {
					this.goGame();
				} else if(this['level_'+num].beginCha) {
					var challengeLevelId = this['level_'+num].challengeLevelId;
					var t = this;
					this.challengeValidate(
						false, 
						this.challengeMatchId, 
						this.cha_state.levelLimitMin,
						this.cha_state.levelLimitMax, 
						this.cha_state.rankRemark, 
						function() {
							t.doChallenge(challengeLevelId);
						});
				}
			},
			doChallenge:function(challengeLevelId) {
				var URLOBJ = urlObj.challengeApply;
				if (URLOBJ.again) return;
				URLOBJ.again = true;
				var t = this;
				COMMONS.ajax({
					urlObj:URLOBJ,
					name: URLOBJ.name,
					url: URLOBJ.url,
					data:URLOBJ.data(challengeLevelId),
					success: function (obj) {
						URLOBJ.again = false;
						if(obj['success'] && obj['code'] == 0) {
							var data = obj['data'];
							t.challengeLevelId = challengeLevelId;
							t.setPayWay(data);
						} else {
							t.showAlert(urlObj.challengeApply.name,obj['message']);
						}
					}
				});
			},
			setPayWay: function (objArr) {
				this.flag.pay = true;
				this.flag.apply = false;
				this.flag.onlyQ = true;
				this.flag.onlyS = true;
				var t = this;
				var qrcodeObj = objArr.length < 2 ? objArr[0].applyWay == "Qrcode" ? objArr[0] : {} : objArr[0].applyWay == "Qrcode" ? objArr[0] : objArr[1],
				    shunObj = objArr.length < 2 ? objArr[0].applyWay == "SwBean" ? objArr[0] : {} : objArr[0].applyWay == "SwBean" ? objArr[0] : objArr[1];

				if (objArr.length < 2) {
					if (objArr[0].applyWay == "Qrcode") {
						$('.pay_box li[data-type = qrcode]').addClass('active');
						this.flag.onlyQ = true;
						this.flag.qrcode = true;
						initQrcode();
					} else {
						$('.pay_box li[data-type = sd]').addClass('active');
						this.flag.onlyQ = false;
						this.flag.qrcode = false;
						initShun();
					}
					this.flag.onlyS = !this.flag.onlyQ;
					this.flag.sd = !this.flag.qrcode;
				} else {
					$('.pay_box li[data-type = qrcode]').addClass('active');
					$('.pay_box li[data-type = sd]').removeClass('active');
					this.flag.qrcode = true;
					this.flag.sd = false;
					//显示二维码支付
					initQrcode();
					initShun();
				}

				function initQrcode() {
					t.pay.money = qrcodeObj.money;
					$('.img_qrcode').empty().qrcode({ width: 130, height: 130, text: qrcodeObj.qrcodeUrl, render: "canvas", correctLevel: 1 });
					t.pay.orderId = qrcodeObj.orderId;
					t.qrcodeTimeBack();
					//轮训查询支付状态
					t.pay.timeQuery = setInterval(function () {
						t.payFinished();
					}, 3000);
				}
				function initShun() {
					t.flag.noSd = false;//是否可点击
					t.flag.lastSd = false;//是否显示剩余顺豆
					t.flag.fastTip = false;//是否显示快捷支付提示
					t.flag.vipTip = false;//是否显示vip
					t.sd_last = shunObj.useTimes+"/"+shunObj.totalTimes;
					if(!shunObj.isVip && shunObj.useTimes >= shunObj.totalTimes && shunObj.totalTimes>0) t.flag.vipTip = true;
					if (shunObj.swbean <= 0) {
						if(shunObj.isFree) {//第一次顺豆不足免费
							t.sd_word = "首次免费，立刻报名";
						} else {
							t.flag.fastTip = true;
							t.flag.noSd = true;
							t.sd_word = "顺豆余额不足";
						}
					} else if(shunObj.useTimes >= shunObj.totalTimes && shunObj.totalTimes > 0) {
						t.sd_word = "您的挑战次数已用完";
						t.flag.lastSd = true;
						t.flag.noSd = true;
					} else {
						t.flag.lastSd = true;
						if(shunObj.totalTimes <= 0) t.sd_last = "不限";
						t.sd_word = "扣除" + shunObj.swbean + "顺豆，立刻报名";
					}
				}
			},
			payFinished: function () {
				var URLOBJ = urlObj.payStatus;
				if (URLOBJ.again) return;
				URLOBJ.again = true;
				var t = this;
				COMMONS.ajax({
					urlObj:URLOBJ,
					name: URLOBJ.name,
					url: URLOBJ.url,
					data:URLOBJ.data(t.pay.orderId),
					success: function (obj) {
						URLOBJ.again = false;
						if (obj['success'] && obj['code'] == 0 && obj['data']) {
							var data = obj.data;
							t.goPay();
						}
					}
				});
			},
			qrcodeTimeBack: function () {
				//处理扫码倒计时
				this.pay.timeNum--;
				console.log("time back " + this.pay.timeNum);
				var t = this;
				this.pay.timeBack = setTimeout(function () {
					if (t.pay.timeNum <= 0) {
						t.closeQrcode();
						t.showAlert("扫码支付失败", "请重试");
						return;
					}
					t.qrcodeTimeBack();
				}, 1000);
			},
			closeQrcode: function () {
				//关闭二维码倒计时
				clearInterval(this.pay.timeQuery);
				clearTimeout(this.pay.timeBack);
				this.pay.timeNum = 300;
			},
			goPay: function (type) {
				var URLOBJ = urlObj.enterRoom;
				if (this.flag.noSd) return;//如果没有顺豆，不允许点击
				if (URLOBJ.again) return;
				URLOBJ.again = true;
				if(type != "sd") this.closeQrcode();//二维码支付扫码成功后关闭倒计时
				var t = this;
				COMMONS.ajax({
					urlObj:URLOBJ,
					name: URLOBJ.name,
					url: URLOBJ.url,
					data:URLOBJ.data(t.challengeLevelId,type == 'sd' ? "" : t.pay.orderId),
					success: function (obj) {
						URLOBJ.again = false;
						if (obj['success'] && obj['code'] == 0 && obj['data']) {
							var data = obj.data;
							var retSwbean = data.retSwbean;
							if("sd" == type) {
								t.showAlert("支付成功", retSwbean>0?"本次现金报名已返还<span>"+retSwbean+"</span>顺豆<br>正在为您启动游戏...":"正在为您启动游戏...");
							} else {
								t.showAlert("支付成功", "正在为您启动游戏...");
							}
							t.goGame();
							t.getChallengeLevelInfo(t.challengeMatchId);
						} else {
							t.showAlert(urlObj.enterRoom.name, urlObj.enterRoom.name + t.ALERT.ERROR);
						}
					}
				});
			},
			closePay: function () {
				this.flag.pay = false;
				this.closeQrcode();
			},
			countBack :function(date) {
				var t = this;
				this.timeBackInte = setInterval(function() {
					t.showCountDown(date);
				}, 1000);
			},
			showCountDown : function(date) {
				var now = new Date();
				var endDate = new Date(date);
				var leftTime = endDate.getTime() - now.getTime();
				var leftsecond = parseInt(leftTime / 1000);
				var day1 = Math.floor(leftsecond / (60 * 60 * 24));
				var hour = Math.floor((leftsecond - day1 * 24 * 60 * 60) / 3600);
				hour = hour < 10 ? "0" + hour : hour;
				var minute = Math.floor((leftsecond - day1 * 24 * 60 * 60 - hour * 3600) / 60);
				minute = minute < 10 ? "0" + minute : minute;
				var second = Math.floor(leftsecond - day1 * 24 * 60 * 60 - hour * 3600 - minute * 60);
				second = second < 10 ? "0" + second : second;
				this.timeBackStr = hour + ":" + minute + ":" + second;
				//倒计时结束后处理业务
				if(endDate <= now) {
					var hostUrl = location.href;
					if(hostUrl.indexOf('needShowRecord') != -1) {
						hostUrl = hostUrl.replace('needShowRecord','a');
					} else if(hostUrl.indexOf('needShowRules') != -1) {
						hostUrl = hostUrl.replace('needShowRules','b');
					}
					if(hostUrl.indexOf('#') != -1) hostUrl = hostUrl.replace("#","");
					location.href = hostUrl;
					return;
				}
			},
			showChallengeRulesList:function() {
				if(COMMONS.options.needShowRecord == 1) {
					this.flag.rules = true;
				} else if(COMMONS.options.needShowRules == 1) {
					this.showRecords();
				}
			},
			showRecords: function () {
				var t = this;
				$('.records_box #tab_rooms').bootstrapTable('destroy');
				$('.records_box #tab_rooms').bootstrapTable({
					url: urlObj.listRecordsUrl.url.other(),
					method: 'get',
					striped: true, //是否显示行间隔色
					cache: false, //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
					pagination: true, //是否显示分页（*）
					paginationLoop: false,
					showPageDetail: false,
					paginationHAlign: 'center',
					sortable: false, //是否启用排序
					sortOrder: "asc", //排序方式
					pageNo: 1, //初始化加载第一页，默认第一页
					pageSize: 10, //每页的记录行数（*）
					queryParamsType: '', //默认值为 'limit' ,在默认情况下 传给服务端的参数为：offset,limit,sort
					queryParams: queryParamsRoom, //前端调用服务时，会默认传递上边提到的参数，如果需要添加自定义参数，可以自定义一个函数返回请求参数
					sidePagination: "server", //分页方式：client客户端分页，server服务端分页（*）
					minimumCountColumns: 1, //最少允许的列数
					clickToSelect: true, //是否启用点击选中行
					searchOnEnterKey: true,
					columns: [{
						field: 'challengeRoomId',
						title: '场次',
						align: 'center',
						width: '10%'
					}, {
						field: 'challengeDateTime',
						title: '时间',
						align: 'center',
						width: '20%',
						formatter: function(value, row, index) {
							return value;
						}
					}, {
						field: 'challengeType',
						title: '类型',
						align: 'center',
						width: '15%',
						formatter: function(value, row, index) {
							return value;
						}
					}, {
						field: 'serverName',
						title: '角色名/所在服务器',
						align: 'center',
						width: '20%',
						formatter: function(value, row, index) {
							return value;
						}
					},{
						
						field: 'score',
						title: '我的评分',
						align: 'center',
						width: '10%'
					},{
						field: 'rank',
						title: '我的成绩',
						align: 'center',
						width: '15%',
						formatter: function(value, row, index) {
							if(value.indexOf("成功") != -1) {
								return "<span style='color:#04e19e'>" + value + "</span>";
							} else {
								return "<span style='color:#b43709'>" + value + "</span>";
							}
				
						}
					}, {
						field: 'finished',
						title: '详情',
						align: 'center',
						width: '10%',
						formatter: function(value, row, index) {
							if(value) {
								return "<div id='checkDetail' data-challengeRoomId="+row.challengeRoomId+" data-challengeType="+row.challengeType+" style='text-decoration:underline;cursor:pointer; color:#00aeff'>查看详情</div>";
							} else {
								return "<div style='color:#565656'>查看详情</div>";
							}
				
						}
					}],
				});
				t.flag.records = true;
				function queryParamsRoom(params) {
					return {
						pageSize: params.pageSize,
						pageNo: params.pageNo,
						playerAccount:ClientAPI.getSubAccount(GameID.LOL)
					};
				}
			},
			showDetail:function(e) {
				console.log(e.target.id);
				if (e.target.id == "checkDetail") {
					var challengeRoomId = $(e.target).attr('data-challengeRoomId');
					var challengeType = $(e.target).attr('data-challengeType');
					this.initRoomTab(challengeRoomId);
	            }
			},
			initRoomTab:function(challengeRoomId) {
				$('#tab_rooms').bootstrapTable('destroy'); 
				$('#tab_rooms').bootstrapTable({
					url: urlObj.listDetailUrl.url.other(),
					method: 'get',
					striped: true, //是否显示行间隔色
					cache: false, //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
					pagination: true, //是否显示分页（*）
					paginationLoop: false,
					showPageDetail: false,
					paginationHAlign: 'center',
					sortable: false, //是否启用排序
					sortOrder: "asc", //排序方式
					pageNo: 1, //初始化加载第一页，默认第一页
					pageSize: 10, //每页的记录行数（*）
					queryParamsType: '', //默认值为 'limit' ,在默认情况下 传给服务端的参数为：offset,limit,sort
					queryParams: queryParamsRoom, //前端调用服务时，会默认传递上边提到的参数，如果需要添加自定义参数，可以自定义一个函数返回请求参数
					sidePagination: "server", //分页方式：client客户端分页，server服务端分页（*）
					minimumCountColumns: 1, //最少允许的列数
					clickToSelect: true, //是否启用点击选中行
					searchOnEnterKey: true,
					columns: [{
						field: 'rank',
						title: '排名',
						align: 'center',
						width:"10%",
						formatter: function(value, row, index) {
							if(value) {
								return "<span style='color:#9c9e9f'>" + value + "</span>";
							} else {
								return "-";
							}
						}
					}, {
						field: 'playerName',
						title: '角色名',
						align: 'center',
						width:"20%",
						formatter: function(value, row, index) {
							if(value) {
								return "<span style='color:#9c9e9f'>" + value + "</span>";
							} else {
								return "-";
							}
						}
					}, {
						field: 'serverName',
						title: '所在区服',
						align: 'center',
						width:"20%",
						formatter: function(value, row, index) {
							if(value) {
								return value;
							} else {
								return "-"	
							}
						}
					}, {
						field: 'challengeState',
						title: '挑战状态',
						align: 'center',
						width:"15%",
						formatter: function(value, row, index) {
							if(value) {
								return value;
							} else {
								return "-"	
							}
						}
					}, {
						field: 'challengeFinishDateTime',
						title: '完成挑战时间',
						align: 'center',
						width:"25%",
						formatter: function(value, row, index) {
							if(value) {
								return value;
							} else {
								return "-"	
							}
						}
					}, {
						field: 'score',
						title: '评分',
						align: 'center',
						width:"10%",
						formatter: function(value, row, index) {
							if(value) {
								return "<div style='color:#b55e0b'>" + (value.indexOf("超时") == -1?value:0) + "</div>";
							} else {
								return "-";
							}
						}
					}],
					rowStyle: function rowStyle(row, index) {
						if(row.self) {
							return {
								css: {
									"background": '#0f2a30',
									'color': '#9c9e9f'
								}
							}
						} else {
							return {}
						}
					}
				});
			
				function queryParamsRoom(params) {
					return {
						pageSize: params.pageSize,
						pageNo: params.pageNo,
						challengeRoomId:challengeRoomId,
						playerAccount:ClientAPI.getSubAccount(GameID.LOL)
					};
				}
			},
			goBack: function () {
				//返回
				ClientAPI.showMainFramePage(ClientPage.Iss);
			}
		}
	});

	COMMONS.alertMsg = vue.showAlert;
	
	$(function () {
		ClientAPI.finishLoading();
	});
});
