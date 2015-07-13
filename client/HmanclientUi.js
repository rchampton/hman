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
//        , gallow=currDiv.getElementsByClassName('gallow')[0]
        , gallow2=document.getElementById(((clientFsm.isMyTurn())?'playingGallow':'waitingGallow'))
//        , prompt=currDiv.getElementsByClassName('prompt')[0]
        , mask=currDiv.getElementsByClassName('mask')[0]
        , lettersDiv=currDiv.getElementsByClassName('letters')[0]
        , playkbd=document.getElementById('playkbd');
    if(gamestate.winner&&gamestate.winner===-1){
        switch(clientFsm.isMyTurn()){
            case true:
                this.writeString(who, 'Your turn!');
//                this.renderGallow(gallow, gamestate.gallow);
//                gallow2=document.getElementById('playingGallow');
                gallow2.className='gallows-'+gamestate.gallowIndex;
//                prompt.innerHTML='Choose a letter';
                //mask.innerHTML=gamestate.mask;
                this.writeString(mask, gamestate.mask);
                lettersDiv.innerHTML='';

                var divPlaykbd=document.getElementById('playkbd');
                for(var i=divPlaykbd.children.length; i>0; i--)
                    divPlaykbd.children[i-1].remove();
                this.drawKeyboard('playkbd', 'playinput', gamestate.letters, this.handlePlayClick);
                break;
            case false:
                this.writeString(who, gamestate.playerName+'\'s turn');
//                this.renderGallow(gallow, gamestate.gallow);
                //mask.innerHTML=gamestate.mask;
//                gallow2=document.getElementById('waitingGallow');
                gallow2.className='gallows-'+gamestate.gallowIndex;
                this.writeString(mask, gamestate.mask);
// TODO show the other player's state while you wait
                break;
            default:
                break;
        }
    }
}.bind(ui);

ui.appendLetter=function(targetElemId){
    var letterSelected=event.target.getAttribute('letter');
    var targetElem=document.getElementById(targetElemId);
    targetElem.value+=letterSelected;
};

ui.drawKeyboard=function(elemId, clickToControlElemId, availableLetters, fn, doBkspEnter){
    doBkspEnter=doBkspEnter||false;

    var NUMLETTERSPERLINE=6;
    var letters='abcdefghijklmnopqrstuvwxyz'.split('');
    var divLetters=document.getElementById(elemId);
    var newLetter, br;

    for(var i=0, z=letters.length; i<z; i++){
        newLetter=document.createElement('div');
        newLetter.className='letter-'+letters[i];
        newLetter.style.display='inline-block';
        newLetter.setAttribute('letter', letters[i]);

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
        newLetter=document.createElement('div');
        newLetter.className='letter-Bksp';
        newLetter.style.display='inline-block';
        newLetter.setAttribute('letter', 'Bksp');
        divLetters.appendChild(newLetter);

        newLetter=document.createElement('div');
        newLetter.className='letter-Enter';
        newLetter.style.display='inline-block';
        newLetter.setAttribute('letter', 'Enter');
        divLetters.appendChild(newLetter);
    }
};

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
    // var container=document.getElementById(containerElemId);
    var punc={};
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
    }
}.bind(ui);

ui.renderGallow=function(container, state){
    container.innerHTML=state;
};