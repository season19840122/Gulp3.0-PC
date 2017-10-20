define(['jquery', 'vue', 'commons'], function ($, Vue, COMMONS) {
	//初始化配置
	COMMONS.init({
		hostImg: "../../",
		baseUrl: {
			dev: "./testUrl/",
			pub: localPath
		},
		staticPath:"../../",
		useOn: "dev"
	});

	var urlObj = {
		listRank: {
			name: "排行数据",
			url: {
				dev: "listRank2.json",
				pub: "mjAudition/listRank"
			}
		},
		apply: {
			name: "报名",
			url: {
				dev: "apply.json",
				pub: "mjAudition/apply"
			},
			data:function(userName,phone,account,subAccount,serverName) {
				return "userName="+userName+
				"&phone="+phone+
				"&account="+account+
				"&subAccount="+subAccount+
				"&serverName="+serverName;
			}
		}
	};

	var ulStr = new Array('<ul class="ul_content">');
		ulStr.push('<li>{{ul_obj.rank}}</li>');
		ulStr.push('<li>{{ul_obj.nickName}}</li>');
		ulStr.push('<li>{{ul_obj.playerName}}</li>');
		ulStr.push('<li>{{ul_obj.serverName}}</li>');
		ulStr.push('<li>{{ul_obj.totalCnt+"/50"}}</li>');
		ulStr.push('<li>{{ul_obj.winRate}}</li>');
		ulStr.push('<li>{{ul_obj.score}}</li>');
		ulStr.push('</ul>');
	var temUl = {
		props: ['ul_obj'],
		template:ulStr.join("")
	}
	var vue = new Vue({
		el: ".box",
		data: {
			flag: {
				alert:true,
				apply:true,
				switch:false,
				myList:false
			},
			input:{
				userName:"",
				phone:"",
				temPhone:"",
				subAccount:"",
				serverName:"",
				account:""
			},
			list_arr:[],
			my_arr:[],
			statusName:"",
			error_tip:"",
			alert_title:"",
			alert_confirm:"",
			detial_tip:"",
			alert_msg:"",
			btn_name:"btn_apply",
		},
		components: {
			'tem_ul': temUl
		},
		mounted: function () {
			var t = this;
			require(['tools'],function() {
				t.listRank();
				t.domAction();
			});
		},
		watch: {
			'input.phone': function() {
				if(isNaN(this.input.phone) || this.input.phone.length > 11) {
					this.input.phone = this.input.temPhone;
				} else {
					this.input.temPhone = this.input.phone;
				}
			}
		},
		computed: {
			tem_subAccount:function() {
				return this.input.subAccount.substring(this.input.subAccount.indexOf("_")+1);
			}
		},
		methods: {
			flush:function() {
				this.listRank();
			},
			domAction:function() {
				var t = this;
				$('.btn_rule').on('click',function() {
					$('#alert_rules').show_();
				})
				//协议提示框点击确认按钮触发事件
				$('#alert_know').confirm_(true,function() {
					$('#alert_apply').show_();
				})
				//报名提示框点击确认按钮触发事件
				$('#alert_apply').confirm_(false,function() {
					if(!t.input.userName || !t.input.phone) {
						t.error_tip = "参数不能为空";
						return;
					}
					t.apply();
				})
				
				$('#alert_apply').close_(function() {
					t.error_tip = "";
				});
			},
			getServerName:function(gameId) {
				var game =  ClientAPI.getLoginGame(gameId);
				if(game){
					return game.serverName;
				}
				return null;
			},
			getAccount:function(gameId) {
				var game =  ClientAPI.getLoginGame(gameId);
				if(game){
					return game.account;
				}
				return null;
			},
			getLevel:function(gameId) {
				var game =  ClientAPI.getLoginGame(gameId);
				if(game){
					return game.level;
				}
				return null;
			},
			goApply:function() {
				var t = this;
				if(this.btn_name.indexOf('disable') != -1 || this.btn_name.indexOf('close') != -1 ) return;
				this.do_challengeValidate(function() {
					$('#alert_know').show_();
					//设置电话、账号、大区
					t.input.subAccount = ClientAPI.getSubAccount(GameID.LOL);
					t.input.serverName = t.getServerName(GameID.LOL);
					t.input.account = t.getAccount(GameID.LOL);
				});
			},
			showAlert: function (title, msg) {
				this.alert_title = title;
				this.alert_msg = msg;
				$('#alert_msg3').show_();
			},
			showLogin: function (title, msg) {
				this.alert_title = title;
				this.alert_msg = msg;
				$('#alert_msg2').show_();
			},
			showResponse: function (flag,msg) {
				if(flag) {
					this.statusName = "success";
					this.alert_title = "报名成功";
					this.alert_confirm = "立即前往";
					this.detial_tip = "您已成功注册为摩杰电竞会员，点击前往官网查看详情";
				} else {
					this.statusName = "fail";
					this.alert_confirm = "确定";
					this.alert_title = "报名失败";
					this.detial_tip = "";
				}
				this.flag.apply = flag;
				this.alert_msg = msg;
				$('#alert_msg').show_();
			},
			listRank: function () {
				var URLOBJ = urlObj.listRank;
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
							t.input.phone = data.phone || "";
							var rankList_ = obj.data.rankList.map(function(v) {
								v.nickName = COMMONS.checkName(v.nickName);
								return v;
							})
							t.list_arr = rankList_;
							if(obj.data.userRank) {
								obj.data.userRank.nickName = COMMONS.checkName(obj.data.userRank.nickName);
								t.btn_name = "btn_apply disable";
								t.flag.myList = true;
								t.my_arr = obj.data.userRank;
							} else if(!obj.data.allowApply) {
								t.btn_name = "btn_apply close";
							}
						} else if (!obj['success']) {
							t.showAlert("友情提示","获取列表失败");
						}
					}
				});
			},
			applyConfirm:function() {
				if(this.flag.apply) {
					window.open(this.mjUrl);
				} else {
					$('#alert_msg').hide_();
				}
			},
			checkNull:function() {
				if(!this.input.phone || !this.input.userName) {
					this.error_tip = "参数不能为空";
				} else {
					this.error_tip = "";
				}
			},
			apply: function () {
				var URLOBJ = urlObj.apply;
				if (URLOBJ.again) return;
				URLOBJ.again = true;
				var t = this;
				COMMONS.ajax({
					urlObj:URLOBJ,
					name: URLOBJ.name,
					url: URLOBJ.url,
					data:URLOBJ.data(t.input.userName,t.input.phone,t.input.account,t.input.subAccount,t.input.serverName),
					success: function (obj) {
						URLOBJ.again = false;
						if (obj['success'] && obj['code'] == 0 && obj['data']) {
							t.showResponse(true,"请在比赛阶段完成<span>50场</span>个人排位赛");
							t.mjUrl = obj.data;
							t.listRank();
						} else if (!obj['success']) {
							t.error_tip = "报名失败："+obj.message;
						}
					}
				});
			},
			do_challengeValidate:function(callBack) {
				//校检火马登录
				var t = this;
				var user = ClientAPI.getLoginXingYun();
				if(!user.hasOwnProperty("userId") || user.userId == 0) {
					//调起登陆窗
					ClientAPI.startLogin('VC_LOGIN');
					return;
				}
				
				//校检游戏登录
				var loginGame = ClientAPI.getLoginGame(GameID.LOL);
				if(!loginGame) {
					t.showLogin("友情提示","请先登录英雄联盟，才能报名参加比赛");
					return;
				} else if(t.getLevel(GameID.LOL)<30) {
					//判断等级是否符合要求
					t.showAlert("友情提示","召唤师等级必须满30级才能参加比赛");
					return;
				}
		
				callBack();
				return;
			},
			login:function() {
				ClientAPI.switchStartInfo(GameID.LOL, true);
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
