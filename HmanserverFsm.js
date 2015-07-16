//var _=require('lodash');
var machina=require('machina');

var HmanserverFsm=machina.Fsm.extend({
    DEBUGTRACE: true

    // Machina interface
    , initialize: function(io){
        this._io=io;
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
                // Swap player's words
                this._players[0].word=this._players[1].played;
                this._players[1].word=this._players[0].played;

                var LETTERS=['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'
                    , 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
                this._players[0].letters=LETTERS.slice();
                this._players[1].letters=LETTERS.slice();

                // Set the players' masks
                this._players[0].mask=Array(this._players[0].word.length+1).join('-');
                this._players[1].mask=Array(this._players[1].word.length+1).join('-');

                this._players[0].gallowIndex=0;
                this._players[1].gallowIndex=0;

                this.transition('playing');
            }
        }
        , playing: {
            _onEnter: function(){
                for(var i=0, max=this._players.length; i<max; i++){
                    if(this.DEBUGTRACE)console.log('Player %s played word %s, solving word %s', this._players[i].name, this._players[i].played, this._players[i].word);
                }
                this._playerTurn=Math.floor(Math.random()*997)%2;
                this.play();
            }
            , gameover: function(){
                this.transition('done');
            }
        }
        , done: {
            _onEnter: function(){
                console.log('Resetting server state: %s', this.reset());
            }
        }
    }

    // Private members
    , _io: undefined
    , _players: []      // [ {id: '', name: 'Jesse', letters: [...], played: 'sun', word: 'oxen', mask: '---'}, {id: '', name: 'Samuel'} ]
    , _words: []        // [ 'buffalo', 'watermellon' ]
    , _playerTurn: 0
    , _STATES: ['The Gallows', 'Noose', 'Head', 'Body', 'Left arm', 'Right arm', 'Left leg', 'Right leg']
    , _winner: -1

    // Private methods
    , _gamestate: function(){
        var currPlayer=this._players[this._playerTurn];
        
        return {
            playerTurn: this._playerTurn
            , playerName: currPlayer.name
            , letters: currPlayer.letters
            , mask: currPlayer.mask
            , gallowIndex: currPlayer.gallowIndex
            , gallow: this._STATES[currPlayer.gallowIndex]
            , winner: this._winner
        };
    }
    , _updateGamestate: function(letterPlayed) {
        var currPlayer=this._players[this._playerTurn];
        var index=currPlayer.word.indexOf(letterPlayed), allIndexes=[];
        var nextState='';

        // Make sure they can play the letter
        if(currPlayer.letters.indexOf(letterPlayed)===-1){
            console.log('Error, letter %s not available to play', letterPlayed);
        }
        
        // Create match list
        while(index>-1){
            if(currPlayer.mask.charAt(index)=='-')
                allIndexes.push(index);
            index=currPlayer.word.indexOf(letterPlayed, index+1);
        }

        // Matched at least one _letterPlayed
        if(allIndexes.length>0){
            for(var i=0, max=allIndexes.length; i<max; i++){
                currPlayer.mask=currPlayer.mask.substr(0, allIndexes[i])
                    + letterPlayed
                    + currPlayer.mask.substr(allIndexes[i]+letterPlayed.length);
            }

            if(currPlayer.word===currPlayer.mask)nextState='win';
        // No match
        }else{
            if(this.DEBUGTRACE)console.log('Incrementing %s\'s gallowIndex from %s', currPlayer.name, currPlayer.gallowIndex);
            currPlayer.gallowIndex+=1;
            if(currPlayer.gallowIndex===this._STATES.length){
                nextState='lose';
            }else{
                this._playerTurn=(this._playerTurn+1)%2;
            }
        }

        if(!nextState){
            var playedLetterIndex=currPlayer.letters.indexOf(letterPlayed);
            if(playedLetterIndex>-1)currPlayer.letters.splice(playedLetterIndex, 1);

            nextState='continue';
        }

        if(this.DEBUGTRACE)console.log('nextState %s' , nextState);
        
        if(nextState==='win'||nextState==='lose'){
            this._winner=(nextState==='win')?this._playerTurn:(this._playerTurn+1)%2;
            return 'update';
        }
        
        return 'update';
    }

    // Public API
    , play: function(letter){
        var nextMessage='update';
        if(letter){
            if(this.DEBUGTRACE)console.log('%s played letter %s, updating gamestate...', this._players[this._playerTurn].name, letter);
            nextMessage=this._updateGamestate(letter);
        }

        // Tell clients to update
//        this._playerTurn=(this._playerTurn+1)%2;
        if(this.DEBUGTRACE)console.log(this._players[this._playerTurn].name + "'s turn...");
        this._io.emit(nextMessage, this._gamestate());
        if(this._winner>-1)
            this.handle('gameover');
    }
    , reset: function(){
        this._playerTurn=0;
        this._winner=-1;
        this._players.length=0;
        this._words.length=0;
        this.transition('matching');

        return 'OK ' + new Date();
    }
    , setupPlayer: function(id, word){
        var player=this.playerById(id);
        player.played=word;
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