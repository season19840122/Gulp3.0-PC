require.config({
    paths: {
        jquery: '../../scripts/jquery-3.1.1.min',
        commons:'../../scripts/commons',
        client:'../../scripts/clientApiTest',
        bootstrap:'../../scripts/bootstrap.min',
        action:'action',
    },
    shim:{
    	"bootstrap":['jquery']
    }
});

var localPath = "https://client.huoma.cn/"

require(['client','action']);
