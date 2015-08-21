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
                this._socket.on('update', function(gamestate){this._updateClient(gamestate);}.bind(this) );
            }
            , play: 'playing'
            , wait: 'waiting'
        }
        , waiting: {
            _onEnter: function(){}
            , wait: 'waiting'
            , play: 'playing'
            , showright: 'right'
            , showwrong: 'wrong'
            , win: 'won'
            , lose: 'lost'
        }
        , playing: {
            _onEnter: function(){
                if(this.DEBUGTRACE)console.log('Updating ui...');
            }
            , play: 'playing'
            , wait: 'waiting'
            , showright: 'right'
            , showwrong: 'wrong'
            , win: 'won'
            , lose: 'lost'
        }
        , wrong: {
            _onEnter: function(){
                // Display wrong message, delay, then transfer to waiting
                setTimeout(function(){
                    this.transition('continue');
                }.bind(this), this._RESULTDELAYMS);
            }
        }
        , right: {
            _onEnter: function(){
                // Delay right message, delay, then transfer to playing
                setTimeout(function(){
                    this.transition('continue');
                }.bind(this), this._RESULTDELAYMS);
            }
        }
        , continue: {
            _onEnter: function(){
                var playerTurn=this._gamestate.playerTurn;
                if(this.DEBUGTRACE){
                    console.dir(this._gamestate);
                }
                // if(['playing','waiting'].indexOf(this.state)>-1){
                    if(this._gamestate.winner>-1){
console.log('TODO process win/lose messages');
                        this.handle((this._gamestate.winner===this._playerIndex)?'win':'lose');
                    }else{
                        if(this._playerIndex==playerTurn)this.handle('play');
                        else this.handle('wait');
                    }
                // }else{
                //     console.log('Interstitial... %s', this.state);
                //     if(this._playerIndex==playerTurn)this.handle('play');
                //     else this.handle('wait');
                // }
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
    , _RESULTDELAYMS: 2500
    , _socket: undefined
    , _playerName: undefined
    , _playerIndex: undefined
    , _word: undefined
    , _gamestate: undefined
    , _playerTurn: 0
    , _players: []      
    , _words: []
    , _letters: []
    , _masks: []

    // Private methods
    , _updateClient: function(gamestate){
console.log('_updateClient with %s', gamestate);
        this._gamestate=gamestate;
        if(this.DEBUGTRACE)console.dir(this._gamestate);
        if(this._gamestate.guessCorrect!=null){
            if(this._gamestate.guessCorrect){
console.log('handle showright');
                this.handle('showright');
            }else{
console.log('handle showwrong');
                this.handle('showwrong');
            }
        }else{
            this.transition('continue');
        }
    }
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
        this._word=word.toLowerCase();
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