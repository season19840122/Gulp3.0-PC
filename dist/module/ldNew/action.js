define(['jquery', 'vue', 'commons'], function ($, Vue, COMMONS) {
	//初始化配置
	COMMONS.init({
		hostImg: "../../",
		baseUrl: {
			dev: "./testUrl/",
			pub: localPath
		},
		barId: 1211,
		showApply: $('#showApply').val(),
		showEndList: $('#showEndList').val(),
		useOn: "dev"
	});

	var urlObj = {
		listTimes: {
			name: "乱斗时间",
			url: {
				dev: "listMeleePeriods.json",
				pub: "melee/listMeleePeriods"
			}
		},
		listDetail: {
			name: "乱斗详情",
			url: {
				dev: "getMeleeOeriodInfo.json",
				pub: "melee/getMeleePeriodInfo"
			},
			data:function(meleePeriod) {
				return "meleePeriod="+meleePeriod
			}
		},
		getPayWay: {
			name: "获取支付方式",
			url: {
				dev: "getPayWay.json",
				pub: "meleeApply/getPayWay"
			},
			data:function(now_gameId,now_period,now_account,now_applyCnt) {
				return "barId="+COMMONS.options.barId+
				"&gameId="+now_gameId+
				"&meleePeriod="+now_period+
				"&playerAccount="+now_account+
				"&applyCnt="+now_applyCnt;
			}
		},
		meleeApply: {
			name: "支付",
			url: {
				dev: "meleeApply.json",
				pub: "meleeApply/pay"
			},
			data:function(now_gameId,now_period,now_account,now_applyCnt,orderId) {
				return "barId="+COMMONS.options.barId+
				"&gameId="+now_gameId+
				"&meleePeriod="+now_period+
				"&playerAccount="+now_account+
				"&applyCnt="+now_applyCnt+
				"&orderId="+orderId
			}
		},
		payStatus: {
			name: "查询支付",
			url: {
				dev: "payStatus.json",
				pub: "recharge/payFinished"
			},
			data:function(orderId) {
				return "orderId="+orderId;
			}
		},
		listRecordsUrl: {
			name: "达成列表",
			url: {
				other:function() {
					var baseUrl = COMMONS.options.baseUrl[COMMONS.options.useOn];
					if(COMMONS.options.useOn == "pub") {
						return baseUrl+"melee/listMeleeUserAchieveRecords";
					} else {
						return baseUrl+"listRecords.json";
					}
				}
			}
		}
	};
	var game_list = {
		props: ['game_name', 'img_url'],
		template: "<div><img :src='img_url'/>{{game_name}}</div>"
	};

	var vue = new Vue({
		el: ".box",
		data: {
			now_n: 0,
			support_game: [],
			game_id: {
				m3: 17049,
				lol: 13216
			},
			applyUniqueCnt: "",
			btn_name: "",
			btn_status: "",
			list_obj: {}, //详细时间段信息
			now_obj: {
				gameList: [],
				now_gameId: "",
				now_account: "",
				now_applyCnt: "",
				now_gameList: "",
				now_period: ""
			},
			flag: {
				circle: true, //是否显示初始圆盘
				rules: false, //是否显示规则
				records: false, //是否显示达成列表
				notBtn: false, //报名按钮是否可点
				apply: false, //是否显示报名框
				alert: false, //是否显示提示框
				pay: false, //是否显示支付框
				noInfo: false, //是否显示没有赛事框
				qrcode: true, //是否显示二维码框
				sd: false, //是否显示顺豆框
				noSd: false, //顺豆支付按钮是否可点
				onlyQ: false, //是否只有二维码支付
				onlyS: false, //是否只有顺豆支付
				switch: false //是否显示切换用户确定按钮
			},
			gameInfo: "",
			single_num: "",
			all_num: "",
			applySwBean: "",
			applyMoney: "",
			game_info: "",
			alert_title: "",
			alert_msg: "",
			sd_word: "",
			no_title: "",
			no_msg: "",
			no_remind: "",
			time_list: {
				now: "",
				list: []
			},
			ALERT: {
				TITLE: "友情提示",
				ERROR: "接口出错"
			},
			pay: {
				money: "",
				orderId: "",
				timeNum: 300,
				timeBack: "",
				timeQuery: "",
				isCloseQrcodeBack: ""
			}
		},
		components: {
			'game_list': game_list
		},
		computed: {
			com_circle: function () {
				if (this.flag.circle) {
					return false;
				} else {
					return true;
				}
			},
			com_gameList: function () {
				var gameName = this.support_game.map(function (v) {
					return v.game_name;
				});
				return gameName.join("");
			},
			com_team: function () {
				var teamStr = ["不允许组队", "允许组队", "必须组队"];
				return teamStr[this.list_obj.allowTeamState];
			}
		},
		mounted: function () {
			this.domDis();
			this.initTimes();
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
			domDis:function() {
				document.onselectstart = function() {
					return false;
				}
			},
			flush:function() {
				var hostUrl = location.href;
				if(hostUrl.indexOf('showApply') != -1) {
					hostUrl = hostUrl.replace('showApply','a');
				}
				if(hostUrl.indexOf('showEndList') != -1) {
					hostUrl = hostUrl.replace('showEndList','a');
				}
				location.replace(hostUrl);
			},
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
			showAlert: function (title, msg) {
				this.alert_title = title;
				this.alert_msg = msg;
				this.flag.alert = true;
			},
			showRules: function () {
				this.flag.circle = false;
				this.flag.rules = true;
			},
			closeRules: function () {
				this.flag.circle = true;
				this.flag.rules = false;
			},
			closeRecords: function () {
				this.flag.circle = true;
				this.flag.records = false;
			},
			getGame: function (gameId) {
				var game = this.support_game;
				if (gameId == this.game_id.m3) {
					//meng3
					game.push({
						img_url: COMMONS.options.hostImg + 'images/m3_logo.png',
						game_name: '梦三国'
					});
				} else if (gameId == this.game_id.lol) {
					//lol
					game.push({
						img_url: COMMONS.options.hostImg + 'images/lol_logo.png',
						game_name: '英雄联盟'
					});
				}
			},
			initTimes: function () {
				var URLOBJ = urlObj.listTimes;
				if (URLOBJ.again) return;
				URLOBJ.again = true;
				var t = this;
				COMMONS.ajax({
					urlObj:URLOBJ,
					name: URLOBJ.name,
					url: URLOBJ.url,
					success: function (obj) {
						URLOBJ.again = false;
						if (obj['success'] && obj['code'] == 0 && obj['data']) {
							var data = obj.data;
							t.time_list.list = data;
							data.map(function (v, index) {
								if (v.activated == "true" || v.activated == true) {
									t.now_obj.now_period = v.period;
									t.getTime(index, t.now_obj.now_period);
									if (v.onMelee) {
										//设定当前时段
										t.time_list.list[index].nowWord = true;
									} else {
										t.time_list.list[index].nowWord = false;
									}
								}
							});
						} else if (!obj['success']) {
							t.flag.noInfo = true;
							var data = obj.data;
							var msg = obj.message;
							t.no_title = "开放时间：" + data.nextOpenTime;
							t.no_msg = msg;
							t.no_remind = "下期预告：" + data.nextNotice;
						}
					}
				});
			},
			getTime: function (n, period) {
				var URLOBJ = urlObj.listDetail;
				if (URLOBJ.again) return;
				URLOBJ.again = true;
				var t = this;
				this.now_obj.now_applyCnt && $('#limitInput').slider('destroy');
				this.support_game = [];
				this.btn_status = "";
				this.now_n = n;
				this.now_obj.now_period = period;
				COMMONS.ajax({
					urlObj:URLOBJ,
					name: URLOBJ.name,
					url: URLOBJ.url,
					data:URLOBJ.data(period),
					success: function (obj) {
						URLOBJ.again = false;
						if (obj['success'] && obj['code'] == 0 && obj['data']) {
							var data = obj.data;
							t.list_obj = data;
							t.now_obj.gameList = obj.supportGames;

							for (var i = 0; i < data.supportGames.length; i++) {
								t.getGame(data.supportGames[i]);
							}

							t.now_obj.now_gameList = data.supportGames;

							var state = data.state; //时间段0, "未开始"；1, "进行中";2, "已结束";3, "禁止报名";
							var hasUserApply = data.hasUserApply; //用户是否报名
							var hasUserGameFinished = data.hasUserGameFinished; //用户是否完成游戏
							var hasUserCalculated = data.hasUserCalculated; //游戏是否结算
							var hasUserAchieved = data.hasUserAchieved; //是否达成目标

							//是否开启达成列表框
							if (COMMONS.options.showEndList == 1) {
								t.listRecords();
							}

							//status1 时段未开始(提示开始时间)
							if (state == 0) {
								t.flag.notBtn = true;
								t.btn_name = data.applyBeginTime + "开始报名";
								return;
							}

							//status2 时段进行中/已报名/游戏未完成（提示已报名）
							if (state == 1 && hasUserApply && !hasUserGameFinished) {
								t.flag.notBtn = true;
								t.btn_name = "已报名";
								return;
							}

							//status3 时段进行中/已报名/游戏已完成||时段进行中/未报名 （提示立即报名）
							if (state == 1 && hasUserApply && hasUserGameFinished || state == 1 && !hasUserApply) {
								t.flag.notBtn = false;
								t.btn_name = "立即报名";
								data.applySwBean != 0 && (t.btn_status = "（" + data.applySwBean + "顺豆）");

								//设置账号
								var gameInfo = ClientAPI.getLoginGameList();
								if (gameInfo) {
									var gameArr = gameInfo.map(function (v, index) {
										var strInfo = GameName.get(v.gameId) + "-" + v.playerName + "-" + v.serverName;
										var liStr = "<li data-id='" + v.gameId + "' data-ac='" + v.subAccount + "'>" + strInfo + "</li>";
										if (index == 0) {
											t.game_info = strInfo;
											t.now_obj.now_gameId = v.gameId;
											t.now_obj.now_account = v.subAccount;
										}
										return liStr;
									});
									if (gameInfo.length > 3) $('.apply_box input[name=gameInfo]').siblings('ul').addClass('isScroll');
									$('.apply_box input[name=gameInfo]').siblings('ul').html(gameArr.join(""));
								}

								//设置份数
								data.limitGroups.map(function (v, index) {
									$('.limitEachCnt li').eq(index).html(v);
								});
								//拖动份数
								$('#limitInput').slider({
									tooltip: 'hide',
									min: 1,
									max: data.limitEachCnt,
									value: 1,
									formatter: function (value) {
										$(".limitEachCnt .fix").removeClass('active');
										$(".limitEachCnt .auto").addClass('active');
										$('.limitEachCnt li').eq(3).html(value);
										if (obj.applySwBean == 0) {
											t.all_num = "￥" + COMMONS.accMul(data.applyMoney, value);
										} else {
											t.all_num = data.applySwBean * value + "顺豆/￥" + COMMONS.accMul(data.applyMoney, value);
										}
										t.now_obj.now_applyCnt = value;
										return 'width:' + value;
									}
								});

								if (data.applySwBean == 0) {
									t.single_num = "￥" + data.applyMoney;
									t.all_num = "￥" + data.applyMoney;
									t.applySwBean = 0;
								} else {
									t.single_num = data.applySwBean + "顺豆/￥" + data.applyMoney;
									t.all_num = data.applySwBean + "顺豆/￥" + data.applyMoney;
									t.applySwBean = data.applySwBean;
								}
								t.applyMoney = data.applyMoney;
								//点击份数
								$(".limitEachCnt .fix").off('click');
								$(".limitEachCnt .fix").each(function (index) {
									$(this).click(function () {
										t.now_obj.now_applyCnt = $(this).html();
										$(".limitEachCnt li").removeClass('active');
										$(this).addClass('active');

										if (obj.applySwBean == 0) {
											t.all_num = "￥" + COMMONS.accMul(data.applyMoney, t.now_obj.now_applyCnt);
										} else {
											t.all_num = data.applySwBean * t.now_obj.now_applyCnt + "顺豆/￥" + COMMONS.accMul(data.applyMoney, t.now_obj.now_applyCnt);
										}
									});
								});

								//拖动点击
								$(".limitEachCnt .auto").off('click');
								$(".limitEachCnt .auto").on('click', function () {
									$(".limitEachCnt .fix").removeClass('active');
									$(".limitEachCnt .auto").addClass('active');
									var autoValue = $('.limitEachCnt li').eq(3).html();
									if (obj.applySwBean == 0) {
										t.all_num = "￥" + COMMONS.accMul(data.applyMoney, autoValue);
									} else {
										t.all_num = data.applySwBean * autoValue + "顺豆/￥" + COMMONS.accMul(data.applyMoney, autoValue);
									}
									t.now_obj.now_applyCnt = autoValue;
								});

								//下拉框点击
								$(".drop-select input").off('click');
								$(".drop-select input").click(function (e) {
									var ul = $(this).siblings("ul");
									if (ul.css("display") == "none") {
										ul.slideDown("fast");
										$(this).addClass("open");
									} else {
										ul.slideUp("fast");
										$(this).removeClass("open");
									}
								});

								//游戏下拉框内容点击
								$("#gameInfo li").off('click');
								$("#gameInfo li").click(function (e) {
									var txt = $(this).html();
									var gameId = $(this).attr('data-id');
									var subAccount = $(this).attr('data-ac');

									t.game_info = txt;
									t.now_obj.now_gameId = gameId;
									t.now_obj.now_account = subAccount;
									$(".drop-select ul").hide();
								});

								//是否开启报名框
								if (COMMONS.options.showApply == 1) {
									t.do_challengeValidate(t.now_obj.now_gameList, function () {
										if (t.flag.notBtn) return;
										t.flag.apply = true;
									});
								}
								return;
							}

							//status4 时段已结束/已结算/达成目标 （提示以达成目标和获得的奖励）
							if (state == 2 && hasUserCalculated && hasUserAchieved) {
								t.flag.notBtn = true;
								t.btn_name = "成功达成目标";
								t.btn_status = "获得" + data.achieveSwBean + "顺豆";
								return;
							}

							//status5 时段已结束/已结算/未达成目标 （提示已结束）
							if (state == 2 && hasUserCalculated && !hasUserAchieved) {
								t.flag.notBtn = true;
								t.btn_name = "已结束";
								return;
							}

							//status6 时段已结束/未结算 （提示报名结束，附加结算时间）
							if (state == 2 && !hasUserCalculated) {
								t.flag.notBtn = true;
								t.btn_name = "报名结束";
								t.btn_status = "结算时间：" + data.calculateTime;
								return;
							}

							//status7 时段禁止报名 （提示禁止报名）
							if (state == 3) {
								t.flag.notBtn = true;
								t.btn_name = "禁止报名";
								return;
							}
						} else if (!obj['success']) {
							//显示下期预告
							t.flag.noInfo = true;
							var msg = obj.message;
							t.no_title = msg;
							t.no_msg = "没有赛事";
							t.no_remind = "";
						}
					}
				});
			},
			apply: function () {
				var t = this;
				if (t.flag.notBtn) return;
				this.do_challengeValidate(this.now_obj.now_gameList,function() {
					if(ClientAPI.isProccessExist(Proccess.LOL)) {
						t.showAlert("友情提示", "您已在游戏中，不可报名");
					} else {
						t.flag.apply = true;
					}
				})
			},
			getPayWay: function () {
				var URLOBJ = urlObj.getPayWay;
				if (URLOBJ.again) return;
				URLOBJ.again = true;
				var t = this;
				COMMONS.ajax({
					urlObj:URLOBJ,
					name: URLOBJ.name,
					url: URLOBJ.url,
					data:URLOBJ.data(t.now_obj.now_gameId,t.now_obj.now_period,t.now_obj.now_account,t.now_obj.now_applyCnt),
					success: function (obj) {
						URLOBJ.again = false;
						if (obj['success'] && obj['code'] == 0 && obj['data']) {
							var data = obj.data;
							t.setPayWay(data);
						} else {
							COMMONS.alertMsg(t.ALERT.TITLE, obj['message']);
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
					t.flag.noSd = false;
					if (shunObj.swbean <= 0) {
						t.flag.noSd = true;
						t.sd_word = "顺豆余额不足";
					} else if (shunObj.useTimes >= shunObj.totalTimes && shunObj.totalTimes > 0) {
						t.flag.noSd = true;
						t.sd_word = "您的挑战次数已用完";
					} else {
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
						if (obj['success'] && obj['code'] == 0) {
							t.goPay();
						}
					}
				});
			},
			qrcodeTimeBack: function () {
				//处理扫码倒计时
				this.pay.timeNum--;
				var t = this;
				this.pay.timeBack = setTimeout(function () {
					if (t.pay.timeNum <= 0) {
						t.closeQrcode(false);
						t.showAlert("扫码支付失败", "请重试");
						return;
					}
					t.qrcodeTimeBack();
				}, 1000);
			},
			closeQrcode: function (result) {
				//关闭二维码倒计时
				clearInterval(this.pay.timeQuery);
				clearTimeout(this.pay.timeBack);
				this.pay.timeNum = 300;
			},
			goPay: function (type) {
				var URLOBJ = urlObj.meleeApply;
				if (this.flag.noSd && type == 'sd') return;
				if (URLOBJ.again) return;
				URLOBJ.again = true;
				this.closeQrcode(true);
				var t = this;
				COMMONS.ajax({
					urlObj:URLOBJ,
					name: URLOBJ.name,
					url: URLOBJ.url,
					data:URLOBJ.data(t.now_obj.now_gameId,t.now_obj.now_period,t.now_obj.now_account,t.now_obj.now_applyCnt,type == 'sd' ? "" : t.pay.orderId),
					success: function (obj) {
						URLOBJ.again = false;
						if (obj['success'] && obj['code'] == 0 && obj['data']) {
							var data = obj.data;
							var successStr = "本时段乱斗规则：<span>"+data.rule+"</span>。请在<span>"+data.calculateTime+"之前</span>完成一场"+data.gameTypeRemark+"模式的比赛！";
							t.showAlert("支付成功", successStr);
							t.getTime(t.now_n, t.now_obj.now_period);
						} else {
							COMMONS.alertMsg(t.ALERT.TITLE, URLOBJ.name + t.ALERT.ERROR);
						}
					}
				});
			},
			closePay: function () {
				this.flag.pay = false;
				this.closeQrcode();
			},
			listRecords: function () {
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
						field: 'Number',
						title: '序号',
						align: 'center',
						width: '10%',
						formatter: function (value, row, index) {
							return index + 1;
						}
					}, {
						field: 'roleName',
						title: '角色名',
						align: 'center',
						width: "20%",
						formatter: function (value, row, index) {
							if (value) {
								return "<span style='color:#9c9e9f'>" + value + "</span>";
							} else {
								return "-";
							}
						}
					}, {
						field: 'serverName',
						title: '服务器',
						align: 'center',
						width: "20%",
						formatter: function (value, row, index) {
							if (value) {
								return value;
							} else {
								return "-";
							}
						}
					}, {
						field: 'achieveDateTime',
						title: '达成时间',
						align: 'center',
						width: "20%",
						formatter: function (value, row, index) {
							if (value) {
								return value;
							} else {
								return "-";
							}
						}
					}, {
						field: 'rewardCnt',
						title: '奖励份数',
						align: 'center',
						width: "15%",
						formatter: function (value, row, index) {
							if (value) {
								return value;
							} else {
								return "-";
							}
						}
					}, {
						field: 'rewardSwbean',
						title: '奖励顺豆',
						align: 'center',
						width: "15%",
						formatter: function (value, row, index) {
							if (value && value != 0) {
								return value;
							} else {
								return "";
							}
						}
					}],
					onLoadSuccess: function (data) {
						t.applyUniqueCnt = data.applyUniqueCnt || 0;
					}
				});
				t.flag.records = true;
				t.flag.circle = false;
				t.flag.rules = false;
				function queryParamsRoom(params) {
					return {
						meleePeriod: t.now_obj.now_period,
						pageSize: params.pageSize,
						pageNo: params.pageNo
					};
				}
			},
			do_challengeValidate:function(gameIdList, callBack) {
				//校检火马登录
				var t = this;
				var user = ClientAPI.getLoginXingYun();
				if(!user.hasOwnProperty("userId") || user.userId == 0) {
					//调起登陆窗
					ClientAPI.startLogin('VC_LOGIN');
					return;
				}
				
				//校检游戏登录
				if(gameIdList.length == 1){
					var loginGame = ClientAPI.getLoginGame(gameIdList[0]);
					if(!loginGame) {
						this.flag.switch = true;
						this.showAlert("友情提示","请先登录<span>" + GameName.get(gameIdList[0]) + "</span>，才能报名参加比赛哦");
						$(".alert_box .confirm").off("click").on("click", function() {
							t.flag.alert = false;
							t.flag.switch = false;
							//调起游戏登录
							ClientAPI.switchStartInfo(gameIdList[0], true);
						});
						return;
					}
				}else if(gameIdList.length > 1){
					if(!ClientAPI.getLoginGame(gameIdList[0]) && !ClientAPI.getLoginGame(gameIdList[1])){
						this.flag.switch = true;
						this.showAlert("友情提示","请先登录<span>" + GameName.get(gameIdList[0])
							+ "或" + GameName.get(gameIdList[1]) + "</span>，才能报名参加比赛哦");
						$(".alert_box .confirm").off("click").on("click", function() {
							t.flag.alert = false;
							t.flag.switch = false;
							//调起游戏登录
							ClientAPI.switchStartInfo(gameIdList[0], true);
						});
						return;
					}
				}else{
					this.showAlert("","报名失败，请稍后再试");
				}
		
				callBack();
				return;
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