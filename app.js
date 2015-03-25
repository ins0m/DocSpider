
/**
 * Module dependencies.
 */


var express = require('express');
var doc = require('./routes/doc');

var http = require('http');
var path = require('path');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', doc.index);
app.get('/doc', doc.index);
app.get('/doc/update', doc.update);
app.get('/doc/:docFile', doc.view, doc.viewImage);



http.createServer(app).listen(app.get('port'), function(){
  console.log('DocSpider express server listening on port ' + app.get('port'));
});
