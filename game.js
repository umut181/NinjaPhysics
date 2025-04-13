let state = {};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");


function resizeCanvas() {
    let tempCanvas = document.createElement("canvas");
    let tempCtx = tempCanvas.getContext("2d");

    // Save old content
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);

    // Resize canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Restore old content
    ctx.drawImage(tempCanvas, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const congratulationsDOM = document.getElementById("congratulations");
const winnerDOM = document.getElementById("winner");
const newGameButtonDOM = document.getElementById("new-game");


newGame();

function newGame() {
    //Reset the game state
    state = {
        phase: "aiming",
        currentPlayer: 1,
        bomb: {
            x: undefined,
            y: undefined,
            rotation: 0,
            velocity: {x: 0, y: 0},
        },

        backgroundBuildings: [],
        buildings: [],
        blastHoles: [],

        scale: 1,
    
        };


    for (let i = 0; i < 12; i++) {
        generateBackgroundBuilding(i);
    }

    for (let i = 0; i < 8; i++) {
        generateBuilding(i)
    }

    calculateScale();
    initializeBombPosition();
    toggleTurn(state.currentPlayer);

    //Resetting HTML elements
    congratulationsDOM.style.visibility = "hidden";
    document.getElementById('angle-left').value = 45;
    document.getElementById('velocity-left').value = 100;
    document.getElementById('angleValue-left').innerHTML = 45;
    document.getElementById('velocityValue-left').innerHTML = 100;

    document.getElementById('angle-right').value = 45;
    document.getElementById('velocity-right').value = 100;
    document.getElementById('angleValue-right').innerHTML = 45;
    document.getElementById('velocityValue-right').innerHTML = 100;

    draw();


}


function generateBackgroundBuilding(index) {
    const previousBuilding = state.backgroundBuildings[index - 1];

    const x = previousBuilding
        ? previousBuilding.x + previousBuilding.width + 4   
        : -30;

    const minWidth = 80;
    const maxWidth = 130;
    const width = minWidth + Math.random() * (maxWidth - minWidth);

    const minHeight = 160;
    const maxHeight = 340;

    const height = minHeight + Math.random() * (maxHeight - minHeight);;

    state.backgroundBuildings.push ({ x, width , height });
}

function generateBuilding(index) {
    const previousBuilding = state.buildings[index - 1]

    const x = previousBuilding
        ? previousBuilding.x + previousBuilding.width + 4
        : 0;

    const minWidth = 80;
    const maxWidth = 130;
    const width = minWidth + Math.random() * (maxWidth-minWidth);

    const platformWithGorilla = index === 1 || index === 6
    
    const minHeight = 40;
    const maxHeight = 280;
    const minHeightGorilla = 30;
    const maxHeightGorilla = 150;

    const height = platformWithGorilla
        ? minHeightGorilla + Math.random() * (maxHeightGorilla - minHeightGorilla)
        : minHeight + Math.random() * (maxHeight - minHeight);

    
    const lightsOn = [];
    for (let i = 0; i < 50; i++){
        const light = Math.random() <= 0.33 ? true : false;
        lightsOn.push(light);
    }

    state.buildings.push({x, width, height, lightsOn });
}

function calculateScale() {
    const lastBuilding = state.buildings.at(-1);
    const totalWidthOfTheCity = lastBuilding.x + lastBuilding.width;

    state.scale = window.innerWidth / totalWidthOfTheCity;
}

//Event handlers
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    calculateScale();
    initializeBombPosition();
    draw();
});




function initializeBombPosition() {
    const building =
        state.currentPlayer === 1
            ? state.buildings.at(1)
            : state.buildings.at(-2);
        
        const ninjaX = building.x + building.width / 2;
        const ninjaY = building.height;

        const ninjaHandOffsetX = state.currentPlayer === 1 ? -28 : +28;
        const ninjaHandOffsetY = 97;

        state.bomb.x = ninjaX + ninjaHandOffsetX;
        state.bomb.y = ninjaY + ninjaHandOffsetY;
        state.bomb.velocity.x = 0;
        state.bomb.velocity.y = 0;
        state.bomb.rotation = 0;

}


function draw() {
    ctx.save();

    ctx.translate(0, window.innerHeight);
    ctx.scale(1,-1);
    ctx.scale(state.scale, state.scale);

    drawBackground();
    drawBackgroundBuildings();
    drawBuildingsWithBlastHoles();
    drawNinja(1);
    drawNinja(2);
    drawBomb();


    ctx.restore();
}


function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, (window.innerHeight / state.scale) );
    gradient.addColorStop(1, "#9ACD32"); // YellowGreen
    gradient.addColorStop(0, "#FFFF00"); // Yellow

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, (window.innerWidth / state.scale) , (window.innerHeight / state.scale) );

    ctx.fillStyle = "rgb(230, 230, 220)";
    ctx.beginPath();
    ctx.arc(350, 300, 40, 0, 2*Math.PI);
    ctx.fill();
}

function drawBackgroundBuildings() {
    state.backgroundBuildings.forEach((building) => {
        ctx.fillStyle = "#382C52"; 
        ctx.fillRect(building.x, 0, building.width, building.height);
    });
}

const blastHoleRadius = 12;

function drawBuildingsWithBlastHoles() {
    ctx.save();
    
    state.blastHoles.forEach((blastHole) => {
        ctx.beginPath();

        ctx.rect(
            0,
            0,  
            window.innerWidth / state.scale,
            window.innerHeight / state.scale
        );

        ctx.arc(blastHole.x, blastHole.y, blastHoleRadius, 0, 2*Math.PI, true);
        ctx.clip();
    });

    drawBuildings();
    ctx.restore();
}

function drawBuildings() {
    state.buildings.forEach((building) => {

        ctx.fillStyle = "#29021A";
        ctx.fillRect(building.x, 0, building.width, building.height);

        const windowWidth = 10;
        const windowHeight = 12;
        const gap = 15;

        const numberOfFloors = Math.ceil(
            (building.height - gap) / (windowHeight + gap)
        );

        const numberOfRoomsPerFloor = Math.floor(
            (building.width - gap) / (windowWidth + gap)
        );

        for (let floor = 0; floor < numberOfFloors; floor++) {
            for (let room = 0; room < numberOfRoomsPerFloor; room++) {
                if (building.lightsOn[floor * numberOfRoomsPerFloor + room]) {
                    ctx.save()

                    ctx.translate(building.x + gap, building.height - gap);
                    ctx.scale(1, -1);

                    const x = room * (windowWidth + gap);
                    const y = floor * (windowHeight + gap);

                    ctx.fillStyle = "#F4C27A";
                    ctx.fillRect(x, y, windowWidth, windowHeight);

                    ctx.restore();
                }
            }
        }
    });

    }

function drawNinja(player) {
    ctx.save();

    const building =
    player === 1
        ? state.buildings.at(1)
        : state.buildings.at(-2);

    ctx.translate(building.x + building.width / 2, building.height);

    drawNinjaBody();
    drawNinjaLeftArm(player);
    drawNinjaRightArm(player);
    drawNinjaFace(player);
    drawNinjaPlate();
    drawNinjaHat();
    drawNinjaShoulder();


    ctx.restore();
}

function drawNinjaBody(player) {
    ctx.fillStyle = "#B80F0A";

    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-14, 18);
    ctx.lineTo(-16, 44);
    
    ctx.lineTo(-12,70);
    ctx.lineTo(-25, 70);
    ctx.lineTo(0, 84);
    ctx.lineTo(25 ,70);
    ctx.lineTo(12,70);
    
    ctx.lineTo(16, 44);
    ctx.lineTo(14, 18);
    ctx.lineTo(16, 0);
    ctx.lineTo(7, 0);
    ctx.fill();

}

function drawNinjaLeftArm(player) {
    ctx.strokeStyle = "#B80F0A";
    ctx.lineWidth = 8;

    ctx.beginPath();
    ctx.moveTo(-12, 50);
    if (state.phase === "aiming" && state.currentPlayer === 1 && player === 1) {
        ctx.quadraticCurveTo(-44, 63, -28, 97);
    } else if (state.phase === "celebrating" && state.currentPlayer === player) {
        ctx.quadraticCurveTo(-44, 63, -28, 107);
    } else {
        ctx.quadraticCurveTo(-30, 45, -28, 12);
    }

    ctx.stroke();
}

function drawNinjaRightArm(player) {
    ctx.strokeStyle = "#B80F0A";
    ctx.lineWidth = 8;

    ctx.beginPath();
    ctx.moveTo(+12, 50);
    if (state.phase === "aiming" && state.currentPlayer === 2 && player === 2) {
        ctx.quadraticCurveTo(+44, 63, +28, 97);
    } else if (state.phase === "celebrating" && state.currentPlayer === player) {
        ctx.quadraticCurveTo(+44, 63, +28, 107);
    } else {
        ctx.quadraticCurveTo(+30, 45, +28, 12);
    }
    
    ctx.stroke();
}

function drawNinjaFace(player) {
    ctx.fillStyle = "#f1c27d";
    ctx.beginPath();
    ctx.moveTo(-10, 68);  
    ctx.lineTo(10, 68);
    ctx.lineTo(8,58);
    ctx.lineTo(-8,58);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(-6, 65, 2.8, Math.PI, 2*Math.PI);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(6, 65, 2.8, Math.PI, 2*Math.PI);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(0, 60, 9, Math.PI, 2*Math.PI);
    ctx.fill();


}

function drawNinjaPlate() {
        //plate
        ctx.beginPath();
        ctx.fillStyle = "#333333"
        ctx.moveTo(-12, 50);
        ctx.lineTo(12, 50);
        ctx.lineTo(10, 20);
        ctx.lineTo(0, 30);
        ctx.lineTo(-10, 20);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "black"
        ctx.arc(-8, 46, 2, 0, 2*Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "black"
        ctx.arc(8, 46, 2, 0, 2*Math.PI);
        ctx.fill();

}

function drawNinjaHat(){
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.moveTo(-25, 70);
    ctx.lineTo(25,70);
    ctx.lineTo(0,84);
    ctx.lineTo(-25,70);
    ctx.fill();
}

function drawNinjaShoulder(){
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.arc(20, 50 , 6 , (4/6)*Math.PI , (11/6)*Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.arc(-20, 50 , 6, (7/6)*Math.PI , (14/6)*Math.PI);
    ctx.fill();

}

 

function toggleTurn(player){

    if (player === 1) {
        document.getElementById('info-left').style.display = 'block';
        document.getElementById('info-right').style.display = 'none';
    } else {
        document.getElementById('info-left').style.display = 'none';
        document.getElementById('info-right').style.display = 'block';
    }
    
}


function updateAngle(player, value) {
    document.getElementById('angleValue-' + player).textContent = value;
    updateVelocity(player); // Update velocity based on the new angle
}

function updateVelocity(player) {
    const angle = document.getElementById('angle-' + player).value;
    const tempvel = document.getElementById('velocity-' + player).value;
    const radians = angle * (Math.PI / 180);

    if (player === 'left') {
        state.bomb.velocity.x = tempvel * Math.cos(radians);
    } else if (player === 'right') {
        state.bomb.velocity.x = -tempvel * Math.cos(radians);
    }
    state.bomb.velocity.y = tempvel * Math.sin(radians);

    document.getElementById('velocityValue-' + player).textContent = tempvel;

    draw(); // Update the canvas to show the path
}

function drawBomb() {
    ctx.save();
    ctx.translate(state.bomb.x, state.bomb.y);

    if(state.phase === "aiming") {
        ctx.strokeStyle = "rgba(186, 33, 33, 0.7)";
        ctx.setLineDash([3, 8]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(state.bomb.velocity.x , state.bomb.velocity.y)
        ctx.stroke();


        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.moveTo(-4,4);
        ctx.lineTo(0, 12);
        ctx.lineTo(4, 4);
        ctx.lineTo(12, 0);
        ctx.lineTo(4,-4);
        ctx.lineTo(0,-12);
        ctx.lineTo(-4,-4);
        ctx.lineTo(-12, 0);
        ctx.fill();

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, 2*Math.PI);
        ctx.fill();
    } else if (state.phase = "in flight"){
        ctx.fillStyle = "white";
        ctx.rotate(state.bomb.rotation);
        ctx.beginPath();
        ctx.moveTo(-4,4);
        ctx.lineTo(0, 12);
        ctx.lineTo(4, 4);
        ctx.lineTo(12, 0);
        ctx.lineTo(4,-4);
        ctx.lineTo(0,-12);
        ctx.lineTo(-4,-4);
        ctx.lineTo(-12, 0);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, 2*Math.PI);
        ctx.fill();
    } else {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.moveTo(-4,4);
        ctx.lineTo(0, 12);
        ctx.lineTo(4, 4);
        ctx.lineTo(12, 0);
        ctx.lineTo(4,-4);
        ctx.lineTo(0,-12);
        ctx.lineTo(-4,-4);
        ctx.lineTo(-12, 0);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, 2*Math.PI);
        ctx.fill();
    }

        
    ctx.restore();
}    


function fire(player) {
    const angle = document.getElementById('angle-' + player).value;
    const tempvel = document.getElementById('velocity-' + player).value;

    const radians = angle * (Math.PI / 180);
    
    if(player === 'left'){
        state.bomb.velocity.x = tempvel * Math.cos(radians);
    }
    if(player === 'right'){
        state.bomb.velocity.x = -tempvel * Math.cos(radians);
    }
    
    state.bomb.velocity.y = tempvel* Math.sin(radians);
    
    // Add your throwing action logic here
    throwBomb();
}

function throwBomb() {
    state.phase = "in flight";
    previousAnimationTimestamp = undefined;
    requestAnimationFrame(animate);
}

function animate(timestamp) {
    if (previousAnimationTimestamp === undefined) {
        previousAnimationTimestamp = timestamp;
        requestAnimationFrame(animate);
        return;
    }

    const elapsedTime = timestamp - previousAnimationTimestamp;

    const hitDetectionPrecision = 10;
    for ( let i = 0; i < hitDetectionPrecision; i++) {
        moveBomb(elapsedTime / hitDetectionPrecision);
    
        //hit detection
        const miss = checkFrameHit() || checkBuildingHit();
        const hit = checkNinjaHit();

        //handle the case when we hit a building or the bomb got off-screen
        if (miss) {
            state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
            state.phase = "aiming";
            initializeBombPosition();
            toggleTurn(state.currentPlayer);

            draw();
            return;
            }

        //handle the case when we hit the enemy
        if (hit) {
            state.phase = "celebrating";
            announceWinner();
       
            draw();
            return;
        }
    }

    draw();

    //continue the animation loop
    previousAnimationTimestamp = timestamp;
    requestAnimationFrame(animate);
}

function moveBomb(elapsedTime) {
    const multiplier = elapsedTime / 200;

    state.bomb.velocity.y -= 20 * multiplier;

    state.bomb.x += state.bomb.velocity.x * multiplier;
    state.bomb.y += state.bomb.velocity.y * multiplier;

    const direction = state.currentPlayer === 1 ? -1 : +1;
    state.bomb.rotation += direction * 5 * multiplier;
}

function checkFrameHit(){
    if(
        state.bomb.y < 0 ||
        state.bomb.x < 0 ||
        state.bomb.x > window.innerWidth / state.scale
    ) {
        return true;
    }
}

function checkBuildingHit() {
    for (let j = 0; j < state.buildings.length; j++) {
        const building = state.buildings[j];
        if (
            (state.bomb.x + 4) > building.x &&
            (state.bomb.x - 4) < building.x + building.width &&
            (state.bomb.y - 4) < 0  + building.height
        ) {
            for(let k = 0; k < state.blastHoles.length; k++) {
                const blastHole = state.blastHoles[k];

                const horizontalDistance = state.bomb.x - blastHole.x;
                const verticalDistance = state.bomb.y - blastHole.y;
                const distance = Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2); //basic distance finding with Pythagorian Theorem

                if(distance < blastHoleRadius){
                    return false; //at the moment, even though it is inside the borders of building, the bomb is inside a blast hole, so it is not accepted as touching the building.
                }
            }
            state.blastHoles.push({x: state.bomb.x , y: state.bomb.y});
            return true;    

        }
    } 
}

function checkNinjaHit() {
    const enemyPlayer = state.currentPlayer === 1 ? 2 : 1;
    const enemyBuilding =
      enemyPlayer === 1
        ? state.buildings.at(1) // Second building
        : state.buildings.at(-2); // Second last building

    ctx.save();


    ctx.translate(
      enemyBuilding.x + enemyBuilding.width / 2,
      enemyBuilding.height
    );

    drawNinjaBody();
    let hit = ctx.isPointInPath(state.bomb.x, state.bomb.y);

  
    drawNinjaLeftArm(enemyPlayer);
    hit ||= ctx.isPointInStroke(state.bomb.x, state.bomb.y);

    drawNinjaRightArm(enemyPlayer);
    hit ||= ctx.isPointInStroke(state.bomb.x, state.bomb.y);

    ctx.restore();

    return hit;
}

  
  function announceWinner() {
    winnerDOM.innerText = `Player ${state.currentPlayer}`;
    congratulationsDOM.style.visibility = "visible";
  }
  
  newGameButtonDOM.addEventListener("click", newGame);   