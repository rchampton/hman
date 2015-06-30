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
                this._socket.on('update', function(playerTurn){
                    console.log('Received update message with playerTurn ' + playerTurn);
                    console.log('this._playerIndex %s, playerTurn %s', this._playerIndex, playerTurn);
                    if(this._playerIndex==playerTurn) this.handle('play');
                    else this.handle('wait');
                }.bind(this));
            }
            , play: 'playing'
            , wait: 'waiting'
        }
        , waiting: {
            _onEnter: function(){}
        }
        , playing: {
            _onEnter: function(){}
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
});