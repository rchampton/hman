var ConnectionFsm=machina.Fsm.extend({
    DEBUGTRACE: true

    // Machina interface
    , initialize: function(socket){
        this._socket=socket;
        console.log('Connected with socket ' + this._socket);
        this.handle('disconnected');
    }
    , initialState: "uninitialized"
    , states:{
        uninitialized: {
            "*": function(){
                console.log('***');
                this.transition('disconnected');
            }
        }
        , disconnected: {
            _onEnter: function(){}
            , connect: function(){
                this.transition('connecting');
            }
        }
        , connecting: {
            _onEnter: function(){}
            , error: function(){}
            , success: function(){}
        }
        , connected: {
            _onEnter: function(){}
        }
    }

    // Private members
    , _socket: {}

    // Private methods

    // Public API
    , help: function(){
        var transs=[];
        for(var p in this.states[this.state]){
            if(this.states[this.state].hasOwnProperty(p))
                transs.push(p);
        }
        if(this.DEBUGTRACE&&p.length>0){
            console.debug('Available transitions');
            console.debug('\t'+transs.join('\n\t'));
        }
    }
});