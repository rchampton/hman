var HmanclientFsm=machina.Fsm.extend({
    DEBUGTRACE: true

    // Machina interface
    , initialize: function(){
        this._players.length=0;
    }
    , initialState: "uninitialized"
    , states:{
        uninitialized: { "*": function(){ this.transition('connecting'); } }
        , connecting: { connected: 'matching' }
        , matching: { matched: 'setup' }
        , setup: { sync: 'syncing' }
        , syncing: {
            _onEnter: function(){
                if(this.DEBUGTRACE)console.log('Client syncing...');
                this._socket.on('update', function(gamestate){
                    this._gamestate=gamestate;
                    var playerTurn=gamestate.playerTurn;
                    if(this.DEBUGTRACE){
                        console.log('Received update message with gamestate:');
                        console.dir(gamestate);
                        console.log('this._playerIndex %s, playerTurn %s', this._playerIndex, playerTurn);
                    }
                    if(gamestate.winner>-1){
console.log('TODO process win/lose messages');
                        this.handle((gamestate.winner===this._playerIndex)?'win':'lose');
                    }else{
                        if(this._playerIndex==playerTurn)this.handle('play');
                        else this.handle('wait');
                    }

                }.bind(this));
            }
            , play: 'playing'
            , wait: 'waiting'
        }
        , waiting: {
            _onEnter: function(){}
            , wait: 'waiting'
            , play: 'playing'
            , win: 'won'
            , lose: 'lost'
        }
        , playing: {
            _onEnter: function(){
                if(this.DEBUGTRACE)console.log('Updating ui...');
            }
            , play: 'playing'
            , wait: 'waiting'
            , win: 'won'
            , lose: 'lost'
        }
        , won: {
            _onEnter: function(){}
        }
        , lost: {
            onEnter: function(){}
        }
        , done: {
            onEnter: function(){}
        }
    }

    // Private members
    , _socket: undefined
    , _playerName: undefined
    , _playerIndex: undefined
    , _word: undefined
    , _gamestate: undefined

    , _playerTurn: 0
    , _players: []      // [ Jesse, Samuel ]
    , _words: []        // [ buffalo, watermellon ]
    , _letters: []      // [ [a,b,c,...], [b,d,g,...] ]
    , _masks: []        // [ --ffa--, -a-e--ll-- ]

    // Private methods
    , _logPlayerIndex: function (pIndex){
        this._playerIndex=pIndex;
        if(this.DEBUGTRACE)console.log('Set this._playerIndex ' + this._playerIndex);
    }
    , _nextState: function(playerTurn){
        if(this._playerIndex==playerTurn) this.handle('play');
        else this.handle('wait');    
    }

    // Public API
    , connect: function(){
        this._socket=io({reconnection:false});
        this.handle('connected');
    }
    , login: function(name){
        this._playerName=name;
        this._socket.emit('login', this._playerName, this._logPlayerIndex.bind(this) );
        this.handle('matched');
    }
    , send: function(word){
        this._word=word;
        this._socket.emit('setup', this._word);
        this.handle('sync');
    }
    , play: function(letter){
        this._socket.emit('play', letter);
    }
    , getGamestate: function(){
        return this._gamestate;
    }
    , isMyTurn: function() { return (this._gamestate&&this._gamestate.playerTurn===this._playerIndex); }
});