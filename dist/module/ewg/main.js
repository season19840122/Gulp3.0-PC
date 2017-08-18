require.config({
    paths: {
        jquery: '../../scripts/jquery-3.1.1.min',
        vue: '../../scripts/vue.min',
        commons:'../../scripts/commons',
        client:'../../scripts/clientApiTest',
        action:'action'
    }
});

var localPath = "https://client.huoma.cn/"

require(['client','action']);
