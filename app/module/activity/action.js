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
		ulStr.push('<li>{{ul_obj.totalCnt}}</li>');
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
				apply: false,
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
		methods: {
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
			goApply:function() {
				var t = this;
				COMMONS.do_Login(function() {
					$('#alert_know').show_();
					//设置电话、账号、大区
					t.input.subAccount = ClientAPI.getSubAccount(GameID.LOL);
					t.input.serverName = t.getServerName(GameID.LOL);
					t.input.account = t.getAccount(GameID.LOL);
				});
			},
			showAlert: function (flag,title, msg,confirm) {
				if(flag) {
					this.statusName = "success";
					this.flag.apply = true;
				} else {
					this.statusName = "fail";
					this.flag.apply = false;
				}
				this.alert_title = title;
				this.alert_msg = msg;
				this.alert_confirm = confirm;
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
							t.list_arr = obj.data.rankList;
							if(obj.data.userRank) {
								t.flag.myList = true;
								t.my_arr = obj.data.userRank;
							}
						} else if (!obj['success']) {
							t.showAlert(false,"列表获取失败","","确定");
						}
					}
				});
			},
			applyConfirm:function() {
				if(this.flag.apply) {
					window.open("http://mjdj.cn/");
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
							t.showAlert(true,"报名成功","请在比赛阶段完成<span>50场</span>个人排位赛","立即前往");
							t.detial_tip = "您已成功注册为摩杰电竞会员，点击立即访问摩杰电竞官网查看信息";
						} else if (!obj['success']) {
							t.detial_tip = "";
							t.mjUrl = obj.data;
							t.showAlert(false,"报名失败",obj.message,"确定");
						}
					}
				});
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
