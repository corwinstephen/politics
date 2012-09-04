var express = require('express')
  , app = express()
  , routes = require('./routes')
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , path = require('path');

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.cookieParser());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/pick_a_side', routes.pickASide);
app.get('/set_side', routes.setSide);
app.get('/', checkSideChosen, routes.index);
app.post('/comment', checkSideChosen, routes.createPost);

function checkSideChosen(req, res, next){
  var side = req.cookies.side;
  if(side == "democrat" || side == "republican") {
    next();
  }
  else {
    res.redirect('/pick_a_side'); 
  }
};

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

io.sockets.on('connection', function (socket) {
  socket.on('new_post', function(data){
    console.log(data);
    socket.broadcast.emit('update_posts', data);
  });
});