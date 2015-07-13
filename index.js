/*
TODOs
    * Must-haves
        1) Ensure no spaces leading or trailing or within word
        2) Instead of using INPUT for user name, use a div
        3) Backspace and Enter keys aren't implemented for login screen

    * Production version
        1) Remove all console.* calls
        2) Use minified libraries (lodash, machina)
        3) Github

    * Update GUI
        1) Result of choice delay anim
            * Add a Wrong! and Right! screen presented for 1 second after each guess
        2) anim for winner & loser
        3) Avatars, male & female

    * Game config
        1) Word length
        2) Best out of
        3) Observe opponent's plays 
        4) Mirror mode, a la Wheel of Fortune
        5) Race mode, first to finish w/o busting wins

    * Done
        5) Get a set of letters, like scrablle whatever, maybe even with points on them
            work those into the game instead of the keyboard

        * If player gets a letter right 
            1) It's still their turn
            2) Update other player to let them know their opponent is guessing again
*/

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