var _=require('lodash');
var machina=require('machina');

var HmanserverFsm=machina.Fsm.extend({
    DEBUGTRACE: true

    // Machina interface
    , initialize: function(io){
        this._io=io;
        if(this.DEBUGTRACE)console.log('initialize \n\tthis._io %s', this._io);
        this.handle('start');
    }
    , initialState: "uninitialized"
    , states:{
        uninitialized: { "*": 'matching' }
        , matching: {
            _onEnter: function(){
                this._players.length=0;
            }
            , _onExit: function(){
                if(this.DEBUGTRACE)console.log('matching::_onExit');
                // TODO remove login listener
            }
            , matched: 'setup'
        }
        , setup: {
            _onEnter: function(){
                console.log('setup::_onEnter');
            }
            , play: function(){
                this.transition('playing');
            }
        }
        , playing: {
            _onEnter: function(){
                for(var i=0, max=this._players.length; i<max; i++){
                    if(this.DEBUGTRACE)console.log('Player %s (connection id %s) playing word %s', this._players[i].name, this._players[i].id, this._players[i].word);
                }
                this._playerTurn=Math.floor(Math.random()*997)%2;
                if(this.DEBUGTRACE)console.log(this._players[this._playerTurn].name + "'s turn...");
                this._io.emit('update', this._playerTurn);
            }
            , gameover: function(){
                this.transition('done');
            }
        }
        , done: {
        }
    }

    // Private members
    , _io: undefined
    , _playerTurn: 0
    , _players: []      // [ {id: '', name: 'Jesse'}, {id: '', name: 'Samuel'} ]
    , _words: []        // [ 'buffalo', 'watermellon' ]
    , _letters: []      // [ [a,b,c,...], [b,d,g,...] ]
    , _masks: []        // [ --ffa--, -a-e--ll-- ]

    // Private methods

    // Public API
    , reset: function(){
        this._playerTurn=0;
        this._players.length=0;
        this._words.length=0;
        this._letters.length=0;
        this._masks.length=0;
        this.transition('matching');
        
        return 'OK';
    }
    , setupPlayer: function(id, word){
        var player=this.playerById(id);
        player.word=word;
        this._words.push(word);
        if(this.DEBUGTRACE)console.log('%s sent %s', player.name, player.word);
        if(this.playersReady())
            this.handle('play');
    }
    , playerById: function(id){
        var returnId=-1;
        for(var i=0, max=this._players.length; i<max; i++)
            if(this._players[i].id===id)
                returnId=i;
        return (returnId>-1)
            ?this._players[returnId]
            :undefined;
    }
    , addPlayer: function(id, playerName){
        if(this.DEBUGTRACE)console.log('Adding player ' + playerName + ' with id ' + id);
        var newPlayer={id: id, index: this._players.length, name: playerName};
        this._players.push(newPlayer);

        if(this._players.length==2)this.handle('matched');
        else if(this.DEBUGTRACE)console.log('Waiting for another player');

        return newPlayer.index;
    }
    , havePlayers: function(){return (this._players.length==2);}
    , playersReady: function(){return (this._words.length==2);}
});

module.exports=HmanserverFsm;