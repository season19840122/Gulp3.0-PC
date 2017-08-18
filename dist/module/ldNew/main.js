require.config({
    paths: {
        jquery: '../../scripts/jquery-3.1.1.min',
        slider:'../../scripts/bootstrap-slider.min',
        qrcode:'../../scripts/jquery.qrcode.min',
        table:'../../scripts/bootstrap-table',
        vue: '../../scripts/vue.min',
        commons:'../../scripts/commons',
        tabBar:'../../scripts/tabBar',
        client:'../../scripts/clientApiTest',
        action:'action',
    },
    shim:{
    	"table":['jquery'],
    	"qrcode":['jquery'],
    	"tabBar":['jquery']
    }
});

var localPath = "https://client.huoma.cn/"

require(['table','slider','qrcode','client','tabBar'],function() {
	require(['action'])
});
