
const socket = io('https://glacial-fortress-00623.herokuapp.com/');

socket.on('init',handleInit);
socket.on('gameState',handleGameState);
socket.on('gameOver',handleGameOver);
socket.on('gameCode',handleGameCode);
socket.on('unknownCode',handleUnknownCode);
socket.on('tooManyPlayers',handleTooManyPlayers);
socket.on('waitingForPlayers',handleWaitingForPlayers);
socket.on('error',handleError);

const gameScreen = document.getElementById('gameScreen');
const buttonContainer = document.getElementById("buttonContainer");
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const waitingScreen = document.getElementById("waitingScreen");
const gameMap = document.getElementById("gameMap");
const gameLog = document.getElementById("gameLog");
const gameImg = document.getElementById("mapimg");
const attackScreen = document.getElementById("attackScreen")
const soldierPlaceForm = document.getElementById("soldierPlaceForm");
const infoHeader = document.getElementById("info");

const playerColors = ["red","aqua","pink","purple"] //m2ngija 1 on punane jne
newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);

function newGame() {
  socket.emit('newGame');
  init();
}

function joinGame() {
  const code = gameCodeInput.value;
  socket.emit('joinGame', code);
  init();
}
var gameActive = false;
var playerNumber;


function clearGameScreen(){
    gameLog.style.display = 'block'
    gameScreen.textContent = null;
    gameScreen.style.display = "block";
    gameMap.style.display = 'block'
    buttonContainer.textContent = null
    buttonContainer.display = 'block'
    infoHeader.textContent =  null;
    
}

function renderGame(state){
    /*renderdab m2nguseisu p6hjal kliendile*/
    
    if(!state){
        console.log("State not recieved\n");
        return;
    }
    clearGameScreen(); 
    renderMapState(state);
    displayGameInfo(state);
    
    if(playerNumber==state.currentPlayer && state.gamePhase == 1){
        /*Selle m2ngija kord + esimene faas*/
        // renderActivePlayer(state,playerNumber);
        buttonContainer.style.display = 'block'
        
 
        
        placeSoldierBtn = createButton(buttonContainer,btnId='placeSoldierBtn',);
        placeSoldierBtn.innerText = "Place Soldiers";
        placeSoldierBtn.type ='submit'
        placeSoldierBtn.classList.add('placeSoldier') 
        
        howManySoldiers = createInput(buttonContainer, inputId = 'howManySoldiers');
        howManySoldiers.classList.add('placeSoldier') //sama class, et button teab, et see input v22rtus tuleb v6tta
        
        /*Lisa kuulajad ainult nendele osadele, kus pole s6dur*/
        vabaMaa = checkForFreeStates(state);
        // if(vabaMaa.length == 0){socket.emit('endGamePhase')}; gamephase checkitakse iga turni l6pus
        let = nrOfClicks = 0
        for(i=0;i<vabaMaa.length;i++){
            nimi = vabaMaa[i];
            path = document.getElementById(nimi);
            path.addEventListener('click', (e) =>{
                nrOfClicks++;
                placeSoldierBtn.classList.toggle('red');
                if(nrOfClicks%2==1){
                    e.target.style.fillOpacity = 0.75;
                }else{e.target.style.fillOpacity = 1;}
                
                riik = e.target.id
                                
                placeSoldierBtn.onclick = ()=>{
                    console.log("sodureid",parseInt(howManySoldiers.value))
                    if(riik.includes("tekst")){riik.replace("tekst",'')};
                    var sodur =parseInt(howManySoldiers.value);
                    if(sodur >=5){alert("Ei saa panna rohkem kui 5 sodurit")}
                    else{
                        socket.emit('placeSoldier',{riik:riik,sodureid:sodur});
                        socket.emit("endTurn");
                    }
                }
                
                
            })
            
        }
        
        
        
    }
    if(playerNumber==state.currentPlayer && state.gamePhase == 2){
        skipTurnBtn = createButton(buttonContainer,btnId='skipTurnBtn');
        skipTurnBtn.innerText = "Skip Turn"
        skipTurnBtn.onclick = () => {socket.emit("endTurn");}
        
        attackButton = createButton(buttonContainer, btnId='attackBtn');
        attackButton.innerText = "Attack"
        
        //tee selle m2ngija alad klikitavaks, ss peale klikki alale display naabrid
        playerAreas = getPlayerAreas(state,playerNumber);
        console.log(playerNumber,playerColors[playerNumber-1])
        var trueNeighbors; //naabrid, mis pole selle m2nigja omad
        
        gameMap.addEventListener("click",(e)=>{
            if(state.maakonnad.includes(e.target.id) && state.board[e.target.id].owner == playerNumber){
                neighborAreas = state.board[e.target.id].neighbors;
                trueNeighbors = getTrueNeighbors(neighborAreas,playerAreas);
                renderMapState(state);
                highlightNeighbors(trueNeighbors);
                attackButton.style.background = 'white'
                var attacker = document.getElementById(e.target.id);
                e.target.style.fill = 'green'
                
                for(i=0;i<trueNeighbors.length;i++){
                    console.log("ASDFAD")
                    ala = document.getElementById(trueNeighbors[i]);
                    ala.addEventListener('click',(e)=>{
                        var defender= e.target.id;
                        renderMapState(state); //basically reset fills
                        attacker.style.fill = 'green' //attacker 
                        
                        e.target.style.fill = 'orange';
                       
                        attackButton.style.background = 'red';
                        attackButton.onclick = emitAttack(attacker.id,defender);
                        // attackButton.onclick = startAttack(state,attacker.id,defender);
                    })
                }
                console.log('attacker',attacker.id)
                console.log('defender',defender)
            }
            
            
        })
        
        
    }
       

}


function handleError(err){
    console.log(err);
    let msg = JSON.parse(err);
    let a = document.createElement("h2");
    a.innerText = msg.text;
    errorLog.append(a);
    setTimeout(()=>{
        errorLog.innerHTML = null;
    },2000)
}
function pad(num, size) {
    /*teeb nr stringks ja lisab n kohta ala 5 -> '05'*/
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}
function renderMapState(state){ //
    //loop states
    //get owner
    //change color
    for(i=0;i<state.maakonnad.length;i++){
        maakond = state.maakonnad[i];
      omanik = state.board[maakond].owner;
      soduriteArv = state.board[maakond].soldiers;
        for(j=0;j<state.numPlayers;j++){
            if(omanik-1==j){
                document.getElementById(maakond).style.fill = playerColors[j];
                document.getElementById(maakond + 'tekst').textContent = pad(soduriteArv,2);
                // document.getElementById().textContent = soduriteArv;
             }
        }
    }
    
  }
function createButton(rootElement,btnId='',btnClass=''){
    /*Loob nupu ja tagastab selle DOM handleri*/
    let btn = document.createElement("button");
    btn.id = btnId;
    if(btnClass !='') btn.classList.add(btnClass);
    rootElement.append(btn);
    return btn;
}
function createInput(rootElement,inputId ='',inputClass = ''){
    let input = document.createElement("input");
    input.type = "number"
    input.id = inputId
    
    if(inputClass!='' && inputClass != null){input.classList.add(inputClass)};
    rootElement.append(input);
    return input
}
function checkForFreeStates(state){
    let maakonnad = state.maakonnad;
    let vabaMaa = [];
    for(i=0;i<maakonnad.length;i++){
        maaNimi = maakonnad[i];
        maakond = state.board[maaNimi];
        if(maakond.owner <0){vabaMaa.push(maaNimi)};
    }
    return vabaMaa;
}
function getPlayerAreas(state,playerNumber){
    playerAreas = []
    maakonnad = state.maakonnad;
    for(i=0;i<maakonnad.length;i++){
        maaNimi = maakonnad[i];
        if(state.board[maaNimi].owner == playerNumber){
            playerAreas.push(maaNimi);
        }
    }
    return playerAreas;
}
function highlightNeighbors(neighborAreas){
    for(i=0;i<neighborAreas.length;i++){
        ala = document.getElementById(neighborAreas[i]);
        ala.style.fill = 'gray'
        ala.style.fillOpacity = 0.55 //naaber
    }
}
function getTrueNeighbors(neighborAreas,playerAreas){
    /*Leiab need naabrid, mis pole ryndaja omad*/
    trueNeighbors = []
    for(j=0;j<neighborAreas.length;j++)
                        if(!playerAreas.includes(neighborAreas[j])){
                            trueNeighbors.push(neighborAreas[j]);
                        }
                    return trueNeighbors;
}
function renderDice(rootElement,elementID){
    var dice = document.createElement("img");
    
    dice.id = elementID;
    dice.classList.add("dice")
    rootElement.append(dice);
    dice.src = './img/dice-1.png'
    return dice;

}
function startAttack(state,attackingState,defendingState){
    attackScreen.style.display = 'block'
    attackingPlayer = state.nicknames[state.board[attackingState].owner -1]
    defendingPlayer = state.nicknames[state.board[defendingState].owner -1]
    
    attackScreen.innerText = 
    attackingPlayer +'('+ attackingState +')' + 'is attacking' + '(' +defendingPlayer +')' + ' '+ defendingState;
    
    dice = [renderDice(attackScreen,"dice-0"),renderDice(attackScreen,"dice-1")]
    
    for(i=0;i<2;i++){
        if(playerNumber-1 == i){
            makeRollable(dice[i])
        }
    }
    if(state.scores.includes(0)){
        emitAttack(attackingState,defendingState);
    }
    

}
function makeRollable(dice){
    //makes a dice rollable for particular player*/
    dice.addEventListener("click", () => {
        socket.emit("diceRoll");
        
    })
}
function emitAttack(attacker,defender){
    socket.emit('attack',{attacker:attacker,defender:defender});
    // socket.emit('endTurn');
}
function addGameInfo(text){
    el = document.createElement("p");
    el.innerText = text;
    document.getElementById("info").append(el);
}
function displayGameInfo(state){
    addGameInfo("Turn number: " + state.turn)
    addGameInfo("Playorder: " + state.playOrder);
    addGameInfo(state.sodureid);
}
function displayInfoAboutMove(state){
    let playerWhoRolled;
    if(state.turn > 0){
        for(j=0;j<state.numPlayers;j++){
            if(state.playOrder[j] == state.currentPlayer){
              playerWhoRolled =  j;
            }
          }
        appendToLog(state,state.nicknames[playerWhoRolled] + " rolled a " + state.dice)
    }
    
}
function renderActivePlayer(state,playerNumber){
                    
    let name = document.getElementById("player-name-" + playerNumber) //n2ita et kliendi kord
    name.innerText="Your turn!";
    let container = document.getElementById("name-score-container-" + playerNumber);
    container.classList.remove("active-player");
    name.classList.toggle("your-turn");
    document.title= "YOUR TURN";
    
    
    let endTurnButton = document.createElement("button");
    endTurnButton.innerText = "End or Skip Turn";
    endTurnButton.addEventListener("click", () => {
        console.log("endturnbutton emiited enturn")
        
    });
    buttonContainer.append(endTurnButton);
    }
    
