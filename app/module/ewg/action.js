define(['jquery', 'vue', 'commons'], function($, Vue, COMMONS) {
	//初始化配置
	COMMONS.init({
		hostImg: "../../",
		globalData: {},
		baseUrl: {
			dev: "./testUrl/",
			pub: localPath
		},
		useOn: "dev"
	})

	COMMONS.alertMsg = function(msg) {
		$('.alert_box').html(msg).show();
		setTimeout(function() {
			$('.alert_box').hide();
		}, 3000)
	}

	var urlObj = {
		index: {
			name: "初始化信息",
			url: {
				dev: "index.json",
				pub: "cj/getCjInfo"
			}
		},
		save: {
			name: "报名",
			url: {
				dev: "save.json",
				pub: "cj/save"
			}
		}
	}
	var tem_status = {
		props: ['msg'],
		template: '<div id="msg_status"><h1>{{msg[0]}}</h1><h2>{{msg[1]}}</h2></div>',
	}
	var vue = new Vue({
		el: ".box",
		data: {
			alert_c: "*只有队长才能报名",
			status_msg: [],
			status: "notice", //提示类型：success，fail，notice
			flag: {
				remind_box: false,
				input_box: false,
				sheng_list: false,
				p: true,
				userInput: false,
			},
			phone_remind: "手机号码要求必须可用",
			card_remind: "身份证号必须正确",
			teamName: "",
			input: {
				phone: "",
				otherSchool: "",
				temPhone: "",
				card1: "",
				card2: "",
				card3: "",
				card4: "",
				card5: "",
				errorCard1: false,
				errorCard2: false,
				errorCard3: false,
				errorCard4: false,
				errorCard5: false,
				errorPhone: false,
				errorConfirm: false
			},
			confirmTip: "",
		},
		components: {
			'tem_status': tem_status
		},
		computed: {
			statusClass: function() {
				var classObj = {
					success: "iconfont icon-duigou",
					fail: "iconfont icon-duigou fail",
					notice: "iconfont icon-zhuyi1"
				}
				return classObj[this.status];
			},
			c_status_msg: function() {
				var classObj = {
					success: ["恭喜！", "您提交的信息已通过审核"],
					fail: ["您的参赛信息已提交", "请耐心等待工作人员的审批"],
					notice: ["很抱歉！", "您提交的信息未通过审核"]
				}
				return classObj[this.status];
			}
		},
		mounted: function() {
			var this_ = this;
			if(COMMONS.checkLogin()) { //已登录，初始化信息
				this.init();
			} else {
				this.showMsg('noLogin');
			}
			this.hoverAction();
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
			goPage:function(num) {
				if(COMMONS.checkLogin()) { //已登录，初始化信息
					if(num == 3) location.href = "八强.html";
					if(num == 4) location.href = "入围.html";
				} else {
					this.showMsg('noLogin');
				}
			},
			hoverAction: function() {
				$('.tip, .tip_content').hover(function() {
					$('.tip_content').show();
				}, function() {
					$('.tip_content').hide();
				})
				$('input').focus(function() {
					$(this).addClass('on');
				})
				$('input').blur(function() {
					$(this).removeClass('on');
				})
			},
			phoneChange: function() { //判断手机号是否正确
				if(this.input.phone.length != 11) {
					this.input.errorPhone = true;
				} else {
					this.input.errorPhone = false;
				}
			},
			cardChange: function(num) { //判断身份账号
				function isCardNo(card) {
					var reg = /(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
					if(reg.test(card) === false || parseInt(card.substr(16, 1)) % 2 == 1) {
						return false;
					} else {
						return true;
					}
				}
				if(!isCardNo(this.input['card' + num])) {
					this.input['errorCard' + num] = true;
				} else {
					this.input['errorCard' + num] = false;
				}
				
				if(this.input.card1 && this.input.card2 && this.input.card3 && this.input.card4 && this.input.card5) {
					var idCardList = [
						this.input.card1,
						this.input.card2,
						this.input.card3,
						this.input.card4,
						this.input.card5
					];
					this.checkRepeat(idCardList);
				}
			},
			checkRepeat:function(arr) {
				function isRepeat(arr) {
					var hash = {};
					for(var i in arr) {
						if(hash[arr[i]])
							return true;
						hash[arr[i]] = true;
					}
					return false;
				}
				//判断重复
				if(isRepeat(arr)) {
					this.input.errorConfirm = true;
					this.confirmTip = "身份证不可重复";
					return false;
				} else {
					this.input.errorConfirm = false;
					return true;
				}
			},
			confirm: function() { //提交报名
				var this_ = this;
				if(!this.input.phone || !this.input.card1 || !this.input.card2 || !this.input.card3 || !this.input.card4 || !this.input.card5) {
					this.input.errorConfirm = true;
					this.confirmTip = "必填参数不能为空";
					return;
				}
				var idCardList = [
					this.input.card1,
					this.input.card2,
					this.input.card3,
					this.input.card4,
					this.input.card5
				];
				if(!this.checkRepeat(idCardList)) return;
				var data = {
					mobile: this.input.phone,
					teamName: this.teamName,
					idCardList: idCardList
				}
				this_.input.errorConfirm = false;
				COMMONS.ajax({
					name: urlObj.save.name,
					type: "POST",
					url: urlObj.save.url,
					data: data,
					success: function(obj) {
						if(obj['success']) {
							location.reload();
						} else {
							this_.input.errorConfirm = true;
							this_.confirmTip = obj.message;
						}
					},
					error: function() {
						location.reload();
					}
				})
			},
			init: function() { //初始化信息
				var this_ = this;
				COMMONS.ajax({
					name: urlObj.index.name,
					url: urlObj.index.url,
					success: function(obj) {
						if(obj['success'] && obj['code'] == 0 && obj['data']) {
							var data = obj['data'];
							if(data) { //显示提示框
								var isApplyed = data.isApplyed,
									isLeader = data.isLeader,
									teamName = data.teamName,
									isHasCombatTeam = data.isHasCombatTeam;
								//status 1 没战队
								if(!isHasCombatTeam) {
									this_.showMsg('noTeam');
									return;
								}

								//status 2 有战队不是队长 
								if(!isLeader && isHasCombatTeam) {
									this_.showMsg('msg', "只有队长可以报名哦，快去呼唤队长来报名吧~");
									return;
								}

								//status 3 判断是否提交过信息
								if(isApplyed == "true" || isApplyed) {
									this_.showMsg('msg', "您的参赛信息已提交！");
								}

								//status 4 未填写
								if(isApplyed == "false" || !isApplyed) {
									this_.teamName = teamName;
									this_.flag.remind_box = false;
									this_.flag.input_box = true;
								}
							}
						} else if(!obj['success']) {
							this_.showMsg('msg', urlObj.index.name + "出错");
						}
					}
				})
			},
			//弹框显示
			showMsg: function(type, msg) {
				this.status = type;
				this.flag.remind_box = true;
				this.flag.input_box = false;
				if(type == 'msg') {
					this.alert_c = msg;
				}
			},
			login: function() {
				COMMONS.do_Login();
			},
			create: function() { //创建战队方法
				ClientAPI.showMainFramePage(ClientPage.TeamsLeague, localPath + '/combatTeam/toMyCombatTeam');
			},
			gameIng: function() { //查看比赛进程
				ClientAPI.showMainFramePage(ClientPage.TeamsLeague, localPath + '/combatMatch/getCombatMatchServer');
			},
			joinGame: function() { //加入官方赛事群
				window.open("http://shang.qq.com/wpa/qunwpa?idkey=45fa298d57a8bf65fa5d31d9a5f9756949609adf102dd64ee9799d7efe091b9d");
			},
			goBack: function() { //返回
				ClientAPI.showMainFramePage(ClientPage.Iss);
			}
		}
	})

	$(function() {
		ClientAPI.finishLoading();
	});
})