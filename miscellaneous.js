let grid = false;

function fixAngles(...angles) {
	return angles.map(a => a < 0 ? a + TWO_PI : a);
}

function dupProp(obj) {
	if(obj instanceof Array) return obj.map((x) => dupProp(x) || x);
	else if(obj instanceof p5.Vector) return obj.copy();
	else if(obj instanceof p5.Color) return color(obj.levels);
	else if(obj instanceof Object) return;
	else return obj;
}

function mid(a, b) {
	return createVector((a.x+b.x)/2, (a.y+b.y)/2);
}

function sign(n) {
	return n < 0 ? -1 : 1;
}

function setScale(n) {
	updateFlag = true;
	gScale = n ? gScale*n : document.getElementById('scale').value;
	if(n) document.getElementById('scale').value = gScale;
	screen.w = (width/2)/gScale;
	screen.h = (height/2)/gScale;
}

function toggleGrid() {
	updateFlag = true;
	grid = !grid;
	if(grid) {
		document.getElementById('grid').className = 'green clicked'
	} else {		
		document.getElementById('grid').className = 'green'
	}
}

var ID = document.getElementById;

document.onselectstart = () => false;

// const Properties = {
// 	Beam : [
// 		{
// 			name : 'Density',
// 			type : 'number',
// 			tags : (el) => {el.min = 1;},
// 			default : () => 0,
// 		},
// 		{
// 			onchange : v => {this.strokeWeight = parseInt(v); updateFlag = true;},
// 			name : 'Width',
// 			type : 'number',
// 			tags : (el) => {el.min = 2;},
// 			default : () => this.strokeWeight,
// 		}
// 	],
// };

function drawArrow(base, vec, myColor) {
	push();
	stroke(myColor);
	strokeWeight(3);
	fill(myColor);
	translate(base.x, base.y);
	line(0, 0, vec.x, vec.y);
	rotate(vec.heading());
	let arrowSize = 7;
	translate(vec.mag() - arrowSize, 0);
	triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
	pop();
}