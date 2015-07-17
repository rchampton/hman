var ui={};

ui.closeAllDivs=function(){
    var nodes=document.body.childNodes;//getElementsByTagName('div');
    for(var i=0, max=nodes.length; i<max; i++)
        if(nodes[i].nodeName=='DIV')
            nodes[i].style.display='none';
// TODO no need to iterate over all the #text nodes
};

ui.refresh=function(){
    this.closeAllDivs();
    document.getElementById('ui-'+clientFsm.state).style.display='block';
    var inputs=document.getElementById('ui-'+clientFsm.state).getElementsByTagName('input');
    if(inputs.length)inputs[0].focus();

    var gamestate=clientFsm.getGamestate();

    if(gamestate===undefined)return;

    var currDiv=document.getElementById('ui-'+clientFsm.state);
    var who=currDiv.getElementsByClassName('who')[0]
        , gallow=document.getElementById(((clientFsm.isMyTurn())?'playingGallow':'waitingGallow'))
        , mask=currDiv.getElementsByClassName('mask')[0]
        , lettersDiv=currDiv.getElementsByClassName('letters')[0]
        , playkbd=document.getElementById('playkbd');
    if(gamestate.winner&&gamestate.winner===-1){
        switch(clientFsm.isMyTurn()){
            case true:
                this.writeString(who, 'Your turn!');
                gallow.className='gallows-'+gamestate.gallowIndex;
                this.writeString(mask, gamestate.mask.toUpperCase());
                lettersDiv.innerHTML='';

                var divPlaykbd=document.getElementById('playkbd');
                for(var i=divPlaykbd.children.length; i>0; i--)
                    divPlaykbd.children[i-1].remove();
                this.drawKeyboard('playkbd', 'playinput', gamestate.letters, this.handlePlayClick);
                break;
            case false:
                this.writeString(who, gamestate.playerName+'\'s turn');
                gallow.className='gallows-'+gamestate.gallowIndex;
                this.writeString(mask, gamestate.mask);
                break;
            default:
                break;
        }
    }
}.bind(ui);

ui.appendLetter=function(targetElemId){
    var divElem=document.getElementById(targetElemId+'div');
    var letterSelected=event.target.getAttribute('letter');
    var targetElem=document.getElementById(targetElemId);

    if(letterSelected==='Bksp'){
        if(targetElem.value.length>0){
            targetElem.value=targetElem.value.substr(0, targetElem.value.length-1);
        }
    }else if(letterSelected==='Enter'){
        if(targetElemId=='pname')
            this.handleLoginClick();
        if(targetElemId=='word')
            this.handleSendClick();
    }else{
        targetElem.value+=letterSelected.toUpperCase();
    }
    this.writeString(divElem, targetElem.value);
};

ui.drawKeyboard=function(elemId, clickToControlElemId, availableLetters, fn, doBkspEnter){
    doBkspEnter=doBkspEnter||false;

    var NUMLETTERSPERLINE=6;
    var CHECKMARK='\uef7a', ARROWLEFT='\uee1f';
    
    var letters='abcdefghijklmnopqrstuvwxyz'.split('');
    var divLetters=document.getElementById(elemId);
    var newLetter, br, span;

    for(var i=0, z=letters.length; i<z; i++){
        newLetter=document.createElement('span');
        newLetter.setAttribute('letter', letters[i]);
        newLetter.innerHTML=letters[i].toUpperCase();

        if(availableLetters==undefined || availableLetters.indexOf(letters[i])>-1){
            // TODO don't like the way this is done, hacky with the whole fn thing
            if(fn !== undefined){
                newLetter.onclick=fn;
            }else{
                newLetter.setAttribute('onclick', 'javascript:ui.appendLetter("'+clickToControlElemId+'");');
            }
        }

        if(availableLetters && availableLetters.indexOf(letters[i])===-1)
            newLetter.style.opacity=0.5;

        divLetters.appendChild(newLetter);

        if((i+1)%NUMLETTERSPERLINE===0){
            br=document.createElement('br');
            divLetters.appendChild(br);
        }
    }
    if(doBkspEnter){
        span=document.createElement('span');
        span.innerHTML='&nbsp; '
        divLetters.appendChild(span);

        newLetter=document.createElement('span');
        newLetter.style.color='red';
        newLetter.innerHTML=ARROWLEFT;
        newLetter.setAttribute('letter', 'Bksp');
        newLetter.setAttribute('onclick', 'javascript:ui.appendLetter("'+clickToControlElemId+'");');
        divLetters.appendChild(newLetter);

        newLetter=document.createElement('span');
        newLetter.style.color='green';
        newLetter.innerHTML=CHECKMARK;
        newLetter.setAttribute('letter', 'Enter');
        newLetter.setAttribute('onclick', 'javascript:ui.appendLetter("'+clickToControlElemId+'");');
        divLetters.appendChild(newLetter);
    }
};

ui.handleSendClick=function(){ send(); }

ui.handleLoginClick=function(){ login(); };

ui.handlePlayClick=function(){
    play(event.target.getAttribute('letter'));
};

ui.spriteExistsForLetter=function(letter){
    var spritesCssIndex=-1;
    for(var i=0,z=document.styleSheets.length; i<z; i++){
        if(document.styleSheets[i].href&&document.styleSheets[i].href.indexOf('/spritesheet.css')>-1){
            spritesCssIndex=i;
        }
    }
    if(spritesCssIndex===-1)return false;

    for(var i=0,z=document.styleSheets[spritesCssIndex].rules.length; i<z; i++){
        if(document.styleSheets[spritesCssIndex].rules[i].selectorText.indexOf('letter-'+letter)>-1)
            return true;
    }

    return false;
}

ui.writeString=function(container, string, clearFirst){
    clearFirst=clearFirst||true;
    if(clearFirst)
        container.innerHTML='';
    this.appendString(container, string);
}.bind(ui);

ui.appendString=function(container, string){
/*    var punc={};
    punc[' ']='Space'
        , punc['!']='Exclamation'
        , punc['-']='Dash'
        , punc['?']='Qmark'
        , punc["'"]='Apostrophe'
        , punc[',']='Comma'
        , punc['.']='Period';
    var div, letter;
    for(var i=0, z=string.length; i<z; i++){
        letter=string[i].toLowerCase();
        div=document.createElement('div');
        div.style.display='inline-block';
        if(this.spriteExistsForLetter(letter)){
            div.className='letter-'+letter;
        }else{
            // Check if we've a punc for it
            if(punc[letter]!==undefined)
                div.className='letter-'+punc[letter];
            else
                div.className='letter-'+punc['?'];
        }
        container.appendChild(div);
    }*/
    container.innerHTML+=string;
}.bind(ui);

ui.renderGallow=function(container, state){
    container.innerHTML=state;
};