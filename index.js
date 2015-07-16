var DEBUG=true
    , PORT=3000;
var app=require('express')();
var http=require('http').Server(app);
var io=require('socket.io')(http);

var HmanserverFsm=require('./HmanserverFsm');
var serverFsm=new HmanserverFsm(io);

app.get('/', function(rq, rs){
	rs.sendFile(__dirname+'/client/index.htm');
});

app.get('/client/:name', function(rq, rs){
    var jsUri=__dirname+'/client/'+rq.params.name;
    rs.sendFile(jsUri);
});

app.get('/js/:name', function(rq, rs){
    var jsUri=__dirname+'/client/'+rq.params.name;
    rs.sendFile(jsUri);
});

app.get('/reset', function(rq, rs){
    if(DEBUG)console.log('Resetting...');
    rs.send(serverFsm.reset());
});

app.get('/watch', function(rq, rs){
    // TODO make a ...vs... page where clients can observe the head-to-head hangman battle
});

io.on('connection', function(socket){
    if(DEBUG)console.log('io::connection fired with socket.id ' + socket.id);

    socket.on('login', function(data, clientCallback){
        clientCallback(serverFsm.addPlayer(socket.id, data));
    });

    socket.on('disconnect', function(){
        if(DEBUG){
            var disconnectedPlayer=serverFsm.playerById(socket.id);
            if(disconnectedPlayer!=undefined)
                console.log('Player %s disconnected.', disconnectedPlayer.name);
            else
                console.log('A user with socket id %s disconnected', socket.id);
        }
    });

    socket.on('setup', function(word){
        serverFsm.setupPlayer(socket.id, word);
    });

    socket.on('play', function(letter){
        serverFsm.play(letter);
    });
});

http.listen(PORT, function(){
    console.log('Listening on *:'+PORT );
});