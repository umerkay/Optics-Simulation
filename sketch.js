let objects;
let sources;
let updateFlag = true;
let fr = 0;
let screen;
let gScale = 1;
const gridSize = 20;
const menuHeight = 40;

let calcWarning = false;

function setup() {

	createCanvas(window.innerWidth,window.innerHeight - menuHeight);
	buildInterface();
	screen = new Rectangle(0, 0, width/2, height/2);
	screen.a = createVector(0,0);

	objects = [];
	tools = [];
	sources = [];
	strokeCap(PROJECT);
}

function draw() {

	scale(1);

	if(frameCount%10 == 0) fr = int(frameRate());

	const x = map(mouseX, 0, width, 0, screen.w*2) - screen.w + screen.pos.x;
	const y = map(mouseY, 0, height, 0, screen.h*2) - screen.h + screen.pos.y;
	mouse.pos.set(x,y);

	fill(255);
	strokeWeight(1);
	text('||', 70, 40);

	// if(mouse.holding && typeof mouse.holding.mouseData == 'function') {
	// 	mouse.holding.mouseData();
	// }

	if(mouse.holding && frameCount%2 == 0) {
		if(keyIsDown(UP_ARROW)) {
			mouse.holding.setPos(mouse.holding.pos.x, mouse.holding.pos.y-1);
			updateFlag = true;
		} else if(keyIsDown(DOWN_ARROW)) {
			mouse.holding.setPos(mouse.holding.pos.x, mouse.holding.pos.y+1);
			updateFlag = true;
		}
		if(keyIsDown(LEFT_ARROW)) {
			mouse.holding.setPos(mouse.holding.pos.x-1, mouse.holding.pos.y);
			updateFlag = true;
		} else if(keyIsDown(RIGHT_ARROW)) {
			mouse.holding.setPos(mouse.holding.pos.x+1, mouse.holding.pos.y);
			updateFlag = true;
		}
	}

	if(updateFlag || mouse.deleteFlag) {
		background(0);

		if(grid) {
			stroke(30); strokeWeight(1);
			noFill();
			for(let i = 0; i < width; i+=gridSize) {
				line(i, 0, i, height);
			}
			for(let i = 0; i < height; i+=gridSize) {
				line(0, i, width, i);
			}
		}

		noStroke();
		fill(255);
		text(fr, 50, 40);
		text(int(gScale*100) + '%', 100, 40);

		if(calcWarning == true) {
			rectMode(CENTER);
			fill(255,0,0,50);
			rect(width/2,10,width,20);
			fill(255);
			text('Warning! Processing...', 20, 14);
			calcWarning = false;
		}

		translate(width/2, height/2);
		scale(gScale);
		translate(screen.pos.x, screen.pos.y)

		if(mouse.buildHistory.length > 0) {
			fill(255,0,0);
			rectMode(CENTER);
			mouse.buildHistory.forEach(p => rect(p.x, p.y,5,5));
			let p = mouse.buildHistory[mouse.buildHistory.length - 1];
			stroke(100);
			strokeWeight(2);
			line(mouse.pos.x, mouse.pos.y, p.x, p.y);

			if(mouse.buildHistory.length > 1) {
				stroke(100);
				strokeWeight(2);
				noFill();
				beginShape();
				mouse.buildHistory.forEach(p => vertex(p.x, p.y));
				endShape();
			}
		}

		for(let i = objects.length - 1; i >= 0; i--) {
			if(mouse.deleteFlag && mouse.isHolding(objects[i])) {
				objects.splice(i,1);
				mouse.deleteFlag = false;
				mouse.drop();
				updateFlag = true;
			} else {
				objects[i].render();
			}
		}

		for(let i = sources.length - 1; i >= 0; i--) {
			if(!calcWarning) {
				sources[i].handle(objects);
			}
			if(mouse.deleteFlag && mouse.isHolding(sources[i])) {
				sources.splice(i,1);
				mouse.deleteFlag = false;
				mouse.drop();
				mouse.holding = null;
			} else {
				sources[i].render();
			}
		}

		for(let i = tools.length - 1; i >= 0; i--) {
			if(mouse.deleteFlag && mouse.isHolding(tools[i])) {
				tools.splice(i,1);
				mouse.deleteFlag = false;
				mouse.drop();
				updateFlag = true;
			} else {
				tools[i].render();
			}
		}

		if(mouse.buildHistory.length == 0) updateFlag = false;
	}
}

function keyPressed(e) {
	if(mouse.holding){
		if(e.key == "Delete") {
			mouse.delete();
		} else if(e.key == "D") {

			let n = mouse.holding.duplicate();
			if(mouse.holding.dir) {
				n.setPos(n.pos.x + mouse.holding.dir.x*gridSize/gScale, n.pos.y + mouse.holding.dir.y*gridSize/gScale);
			} else {
				n.setPos(n.pos.x + gridSize/gScale, n.pos.y + gridSize/gScale);
			}

			if(mouse.holding.name.search("Duplicate") > 0) n.name = mouse.holding.name + "*";
			else n.name = mouse.holding.name + " Duplicate"

				mouse.hold(n);
		}
	}
}