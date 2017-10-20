define(['jquery','commons','bootstrap'], function ($, COMMONS) {
	//初始化配置
	COMMONS.init({
		hostImg: "../../",
		baseUrl: {
			dev: "./testUrl/",
			pub: localPath
		},
		activityId:$('#activityId').val() || 5,
		staticPath:"../../",
		useOn: "dev"
	});
	
	
	var isGuid = true,
		scrollTime = null,
		isClickAgain = true,
		joinAgain = true,//是否有机会;
		awardObj = {},
		closeFlag = false;
	/**
	 * 10001;//抽奖按钮免费
	 * 10002;//抽奖按钮可以抽奖
	 * 10007;//未登录需要处理
	 */
	var btnStatus = 0;
	var urlObj = {
		list: {
			name: "奖品列表",
			url: {
				dev: "list.json",
				pub: "awardProduct/list"
			}
		},
		prizeDraw: {
			name: "抽奖",
			url: {
				dev: "prizeDraw.json",
				pub: "awardProduct/prizeDraw"
			}
		},
		btn: {
			name: "按钮状态",
			url: {
				dev: "btn.json",
				pub: "awardProduct/btn"
			}
		},
		exchange: {
			name: "点击兑换",
			url: {
				dev: "exchange.json",
				pub: "awardProduct/exchange"
			},
			data:function(productId) {
				return "productId="+productId+"&activityId="+COMMONS.options.activityId;
			}
		},
		myAward: {
			name: "我的奖品",
			url: {
				dev: "myAward.json",
				pub: "AwardProductProgress/getMyAward.do"
			}
		},
		awardLog: {
			name: "获奖记录",
			url: {
				dev: "awardLog.json",
				pub: "userAwardLog/getTopTwentyAwardLog.do"
			}
		},
		broadcastLog: {
			name: "获奖播报",
			url: {
				dev: "broadcastLog.json",
				pub: "awardProduct/broadcastLog"
			}
		}
	};
	var eventElement = function() {
		$(function(){
			//关闭所有弹框
			document.onselectstart = function() {
				return false;
			}
			//活动规则
			$('.rules_box i').on('click',function() {
				$('.rules_box').removeClass('show').addClass('hide');
			})
			$('.rules_box').on("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend", function(e){ 
				if(e.target.className.indexOf('hide')!=-1) $(this).hide();
			});
			//奖品兑换规则
			$('.rules_dh').on('click',function() {
				$('.rulesDh_box').show();
				$('.rules_box').removeClass('show').addClass('hide');
				$('.free_box').hide();
			})
			$('.rulesDh_box i').on('click',function() {
				$('.rulesDh_box').hide();
			})
			
			//免费抽奖提示框
			$('.free_btn').on('click',function() {
				$('.free_box').show();
				$('.rules_box').removeClass('show').addClass('hide');
				$('.rulesDh_box').hide();
			})
			$('.free_box i').on('click',function() {
				$('.free_box').hide();
			})
			
			
			$('.rules_ac').on('click',function() {
				if(!isClickAgain) return;
				$('.rules_box').removeClass('hide').addClass('show').show();
				$('.rulesDh_box').hide();
				$('.free_box').hide();
			})
			$('.alert_box .pic_close').on('click',function() {
				$('.alert_box').hide();
				$('.bg').hide();
				//初始化抽奖按钮
				isChou(false);
			})
			
			//规则说明
			$('.rule-wrap').hover(function(){
	          $(this).find('div').show();
	        }, function(){
	          $(this).find('div').hide();
	        })
			
			//点击兑换
			$('.award').on('click','.ul-award .tip',function() {
				if(btnStatus == 10007) {//去登陆
					ClientAPI.startLogin('VC_LOGIN');
					return;
				}
				var proId = $(this).attr('data-id');
				var pic = $(this).attr('data-pic');
				var proName = $(this).attr('data-name');
				go_exchange(proId,pic,proName);
			})
			
			//返回
			$('.back').on('click',function() {
				goBack();
			})
		})
	}
			
    var alertMsg = function(obj) {
		$('.prize_msg,.remind_msg').hide();
		if(obj.type=="prize") {
			$('.prize_msg img').attr('src',obj.awardObj.pic);
			$('.prize_msg p').html(obj.awardObj.msg);
			$('.prize_msg').show();
			//刷新奖品列表
			do_myAward();
			//刷新按钮状态
			go_btn();
			//刷新获奖记录
			do_awardLog();
		} else if(obj.type == "msg") {
			$('.remind_msg').html(obj.msg).show();
		}
		$('.alert_box').show();
	}	
	
	COMMONS.alertMsg = function(title,msg) {
		$('.prize_msg,.remind_msg').hide();
		$('.remind_msg').html(msg).show();
		$('.alert_box').show();
	};
	/**
	 * 
	 * @param {Object} speedStatr:初始的速度
	 * @param {Object} speedNum：每次递减的速度
	 * @param {Object} speedEnd：需要迅速降速时的速度
	 * @param {Object} speedStop：降速的速度
	 */
	var scrollObj = function(speedStatr,speedNum, speedEnd,speedStop) {
		this.options = {
			speedStatr:speedStatr||50,
			speedNum:speedNum||5,
			speedEnd:speedEnd||180,
			speedStop:speedStop||300
		}
		var this_ = this;
		this.showScroll = function() {
			$('.prize_box .bg').show();
			this.options.speedStatr=50;
			this.scrollImg(0);
		}
		this.scrollImg = function(num) {
			if(num == 0) {
				$('#prize'+num).addClass('on').css('z-index','100');
			} else if(num >0 && num <8) {
				$('#prize'+(num-1)).removeClass('on').css('z-index','0');
				$('#prize'+num).addClass('on').css('z-index','100');
			} else if(num == 8) {
				$('#prize'+(num-1)).removeClass('on').css('z-index','0');
				num = 0;
				$('#prize'+num).addClass('on').css('z-index','100');
			}
			this_.options.speedStatr+=this_.options.speedNum;
			scrollTime = setTimeout(function() {
				if(this_.options.speedStatr == this_.options.speedEnd) this_.options.speedStatr = this_.options.speedStop;
				//判断奖品是否抽中
				if(this_.options.speedStatr>=(this_.options.speedStop+20)) {
					var awardId_ = $('#prize'+num).find('input').val();
					if(awardId_ == awardObj.awardId) {
						clearTimeout(scrollTime);
						alertMsg({type:'prize',awardObj:awardObj});
						return;
					}
				}
				this_.scrollImg(++num);
			},this_.options.speedStatr);
		}
	}
	var scrollPrize = new scrollObj(50,5,180,300);
	
	//获取奖品信息
	var do_awardProduct = function() {
		var URLOBJ = urlObj.list;
		if (URLOBJ.again) return;
		URLOBJ.again = true;
		COMMONS.ajax({
			urlObj:URLOBJ,
			name: URLOBJ.name,
			url: URLOBJ.url,
			data:"activityId="+COMMONS.options.activityId,
			success: function(obj) {
				URLOBJ.again = false;
				if(obj['success'] && obj['code'] == 0 && obj['data']) {
					var data = obj['data'];
					data.map(function(v,num) {
						var prizeObj = new Array();
						var imgSrc = v.pic?COMMONS.options.hostImg+"images/prize/"+v.pic : COMMONS.options.hostImg+'images/prize/prize_no1.png';
						prizeObj.push("<img src='"+imgSrc+"' >");
						prizeObj.push("<p>"+v.productName+"</p>");
						prizeObj.push("<input type=hidden value='"+v.awardProductId+"'>");
						$('#prize'+num).attr('title',v.productInfo).html(prizeObj.join(""));
						$('#prize'+num).find('p,img').show();
					})
					$('.prize_box .prize_div').tooltip();
				} else if(!obj['success']) {
					alertMsg({type:'msg',msg:obj['message'] || "奖品列表调用失败"});
				}
			}
		});
	}
	
	function isChou(flag) {
		if(closeFlag) return;
		//true标示点击开始抽奖
		if(flag) {
			isClickAgain = false;
			$('.prize_enter').removeClass('normal').addClass('enter');
			$('.prize_enter p,.prize_enter h3').hide();
			$('.prize_enter h2').show();
		} else {
			//false标示结束抽奖或者
			if (btnStatus != 10003) $('.prize_enter').removeClass('enter').addClass('normal');
			$('.prize_enter p,.prize_enter h3').show();
			$('.prize_enter h2').hide();
			//初始化抽奖高亮块
			$('.prize_box .prize_div').removeClass('on').css('z-index','0');
			isClickAgain = true;
		}
	}
	
	//抽奖
	var do_prizeDraw = function() {
		var URLOBJ = urlObj.prizeDraw;
		if (URLOBJ.again) return;
		URLOBJ.again = true;
		isChou(true);
		COMMONS.ajax({
			urlObj:URLOBJ,
			name: URLOBJ.name,
			url: URLOBJ.url,
			data:"activityId="+COMMONS.options.activityId,
			success: function(obj) {
				URLOBJ.again = false;
				if(obj['success'] && obj['code'] == 0 && obj['data']) {
					var data = obj['data'],
						award = data.award,
						awardProductId = award.awardProductId,
						productName = award.productName,
						pieceName = award.pieceName,
						catalog = award.catalog,
						pic = award.pic;
						
					awardObj.awardId = awardProductId;
					awardObj.pieceName = pieceName;
					awardObj.pic = pic;
					
					if(catalog == 6) {//顺豆
						awardObj.msg = "恭喜您获得<span>"+pieceName+"</span>已经直接打入您的账户";
					} else {
						awardObj.msg = "恭喜您获得<span>"+pieceName+"</span>奖品，已经放入您的奖品栏";
					}
					scrollPrize.showScroll();
				} else {
					isChou(false);
					alertMsg({type:'msg',msg:obj['message'] || "抽奖调用失败"});
				}
			},
			error:function() {
				isChou(false);
				alertMsg({type:'msg',msg:"抽奖调用异常"});
			}
		});
	}
	
	//点击兑换
	var go_exchange = function(productId,pic,proName) {
		var URLOBJ = urlObj.exchange;
		if (URLOBJ.again) return;
		URLOBJ.again = true;
		COMMONS.ajax({
			urlObj:URLOBJ,
			name: URLOBJ.name,
			url: URLOBJ.url,
			data:URLOBJ.data(productId),
			success: function(obj) {
				URLOBJ.again = false;
				if(obj['success'] && obj['code'] == 0) {
					//提示用户领取
					alertMsg({type:'prize',awardObj:{
						pic:pic,
						msg:"恭喜您获得<span>"+proName+"</span>请到-我的奖品页面领取"
					}});
				} else if(obj['code'] == 10007) {
					ClientAPI.startLogin('VC_LOGIN');
				} else if(!obj['success']) {
					alertMsg({type:'msg',msg:obj['message'] || "兑换调用失败"});
				}
			}
		});
	}
	
	//获取按钮状态
	var go_btn = function() {
		var URLOBJ = urlObj.btn;
		if (URLOBJ.again) return;
		URLOBJ.again = true;
		COMMONS.ajax({
			urlObj:URLOBJ,
			name: URLOBJ.name,
			url: URLOBJ.url,
			data:"activityId="+COMMONS.options.activityId,
			success: function(obj) {
				URLOBJ.again = false;
				if(obj['success'] && obj['code'] == 0 && obj['data']) {
					var data = obj['data'],
						sate = data.sate,
						btnText = data.btnText;
					btnStatus = sate;
					setBtn(sate,btnText);
				} else if(!obj['success']) {
					alertMsg({type:'msg',msg:obj['message'] || "获取状态调用失败"});
				}
			}
		});
	}
	
	function setBtn(sate,btnText) {
		$('.prize_enter').removeClass('enter normal');
		if(sate == 10007) {//去登录
			$('.prize_enter').addClass('normal').show();
			$('.prize_enter p,.prize_enter h3').show();
			$('.prize_enter h3').html("请登录").show();
		} else if(sate == 10001) {//免费
			$('.prize_enter').addClass('normal').show();
			$('.prize_enter p,.prize_enter h3').show();
			$('.prize_enter h2').hide();
			$('.prize_enter h3').html("第一次免费哦");
			//显示引导
		} else if(sate == 10002) {//可以抽
			$('.prize_enter').addClass('normal').show();
			$('.prize_enter p,.prize_enter h3').show();
			$('.prize_enter h2').hide();
			$('.prize_enter h3').html(btnText);
		} else if(sate == 10003) {//没有抽奖机会
			$('.prize_enter').addClass('enter').show();
			$('.prize_enter p,.prize_enter h3').show();
			$('.prize_enter h2').hide();
			$('.prize_enter h3').html("今天机会已用完");
			joinAgain = false;
		}  else if(sate == 20001) {//暂未开启
			closeFlag = true;
			$('.prize_enter').addClass('enter').show();
			$('.prize_enter p').html("暂未开启");
			$('.prize_enter h3').hide();
			return;
		}
		
		//点击抽奖
		$('.prize_enter').off('click');
		$('.prize_enter').on('click',function() {
			if(closeFlag) return;
			if(!joinAgain) {
				alertMsg({type:'msg',msg:"今天机会已用完，明天再来吧~"});
				return;
			}
			
			if(btnStatus == 10007) {//去登陆
				ClientAPI.startLogin('VC_LOGIN');
				return;
			}
			
			if(!isClickAgain) return;
			//调用抽奖接口
			do_prizeDraw();
		})
	}
	
	
	//获奖记录
	var do_awardLog = function() {
		var URLOBJ = urlObj.awardLog;
		if (URLOBJ.again) return;
		URLOBJ.again = true;
		COMMONS.ajax({
			urlObj:URLOBJ,
			name: URLOBJ.name,
			url: URLOBJ.url,
			data:"activityId="+COMMONS.options.activityId,
			success: function(obj) {
				URLOBJ.again = false;
				if(obj['success'] && obj['code'] == 0 && obj['data']) {
					var data = obj['data'];
					var listArr = data.map(function(v,num) {
						var userNickName = v.userNickName,
							productName = v.productName,
							state = v.state,
							addTime = v.addTime,
							userId = v.userId;
						return "<li><p><span class='b'>· </span>"+checkName(userNickName)+"抽到了 "+productName+"</p></li>";
					})
					$('.record .ul-record').html(listArr.join(""));
				} else if(!obj['success']) {
					alertMsg({type:'msg',msg:obj['message'] || "获奖记录调用失败"});
				}
			}
		});
	}
	
	//奖品播报
	var do_broadcastLog = function() {
		var URLOBJ = urlObj.broadcastLog;
		if (URLOBJ.again) return;
		URLOBJ.again = true;
		COMMONS.ajax({
			urlObj:URLOBJ,
			name: URLOBJ.name,
			url: URLOBJ.url,
			data:"activityId="+COMMONS.options.activityId,
			success: function(obj) {
				URLOBJ.again = false;
				if(obj['success'] && obj['code'] == 0 && obj['data']) {
					var data = obj['data'],
					userNickName = data.userNickName,
					productName = data.productName;
					$('.record >p').html("恭喜"+checkName(userNickName)+"获得了"+productName);
				} else if(!obj['success']) {
					alertMsg({type:'msg',msg:obj['message'] || "获奖播报调用失败"});
				}
			}
		});
		setInterval(function() {do_broadcastLog()},3600000)
	}
	
	//我的奖品
	var do_myAward = function() {
		var URLOBJ = urlObj.myAward;
		if (URLOBJ.again) return;
		URLOBJ.again = true;
		COMMONS.ajax({
			urlObj:URLOBJ,
			name: URLOBJ.name,
			url: URLOBJ.url,
			data:"activityId="+COMMONS.options.activityId,
			success: function(obj) {
				URLOBJ.again = false;
				if(obj['success'] && obj['code'] == 0 && obj['data']) {
					var data = obj['data'];
					var awardArr = data.map(function(v,num) {
						var needCnt = parseInt(v.needCnt),
							winCnt = parseInt(v.winCnt),
							userId = v.userId,
							awardProductId = v.awardProductId,
							productName = v.productName,
							catalog = v.catalog,
							entityPrizeHasGet = v.entityPrizeHasGet,
							arrStr = new Array(),
							imgSrc = v.pic?COMMONS.options.hostImg+"images/prize/"+v.pic : COMMONS.options.hostImg+'images/prize/prize_no2.png';
						
						var widthNum = "width:"+(winCnt>needCnt?needCnt:winCnt)/needCnt*100+"%";
						var clickClass = (winCnt >= needCnt && !entityPrizeHasGet)?'tip':'tip none';
						var progressClass = (entityPrizeHasGet)?'progress al_get':'progress';
						var count = (entityPrizeHasGet)? "已获得":winCnt+"/"+needCnt;
						
						
						arrStr.push("<li><div class='item'><div class='img-wrap'>");
						arrStr.push("<img src='"+imgSrc+"'><a data-pic="+imgSrc+" data-name="+productName+" data-id="+awardProductId+" class='"+clickClass+"'>点击兑换</a>");
						arrStr.push("<p>"+productName+"</p></div>");
						
						arrStr.push("<div class='"+progressClass+"'><i style='"+widthNum+"'></i><span class='count'>"+count+"</span></div>");
						arrStr.push("</li>");
						return arrStr.join("");
					})
					$('.ul-award').html(awardArr.join(""));
				} else if(!obj['success']) {
					alertMsg({type:'msg',msg:obj['message'] || "我的奖品调用失败"});
				}
			}
		});
	}
	
	function checkName(name) {
		var endName = name;
		name = String(name);
		var nameL = name.length;
		var replaceNum = 1/3;
		var middleNum = parseInt(nameL/2);//字符串中间位置
		var middleLong = nameL==4?2:Math.round(nameL*replaceNum);//字符串需要截取的字符数量
		var middleLongT = parseInt(middleLong/2);//字符串需要截取的字符数量
		var leftNum = nameL==3?1:(middleNum-middleLongT-(middleLong%2==0?0:1));
		var rightNum = nameL==3?2:(middleNum+middleLongT);
		var leftStr = name.substring(0,leftNum);
		var rightStr = name.substring(rightNum);
		var lll = rightNum - leftNum - 1;
		if(nameL >= 3) {
			var start = "*";
			for(var i=0;i<lll;i++) {
				start+="*";
			}
			endName = leftStr+start+rightStr;
		} else if(nameL == 2) {
			endName = name.substring(0,1)+"*";
		}
		return endName;
	}
		
	//设置绑定事件
	eventElement();
	//查询按钮状态
	go_btn();
	//获取奖品列表
	do_awardProduct();
	//获取我的奖品
	do_myAward();
	//获取获奖记录
	do_awardLog();
	//获取获奖播报纪录
	do_broadcastLog();
	//返回
	function goBack() {
		console.log("goBack");
	}
})