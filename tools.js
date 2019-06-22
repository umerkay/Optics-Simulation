class Ruler extends Line {
	constructor(x1, y1, dx, dy, minDiv = 50) {
		super(x1, y1, dx, dy);
		this.angle = this.dir.heading();
		this.strokeWeight = 25/2;
		this.resizer = 20;
		this.minDiv = minDiv;

		this.properties = [
		{
			onchange : v => {this.minDiv = parseInt(v); updateFlag = true;},
			name : 'Division',
			type : 'range',
			tags : (el) => {el.min = 30; el.max = 100; el.step = 5;},
			default : () => this.minDiv,
		}
		];
	}

	render() {
		fill(255,100);
		push();
		noStroke();
		translate(this.pos.x, this.pos.y);
		rotate(this.dir.heading());
		rectMode(CORNER);
		rect(0, -25, this.length, 50);

		textSize(this.minDiv/4);

		stroke(255);
		strokeWeight(1);
		fill(255);
		for(let i = 0; i < this.length; i+=this.minDiv/5) {
			if(i % this.minDiv == 0) {
				line(i, -25 + 1, i, -5);
				noStroke();
				text(i ,i + 2, 0);
				stroke(255);
			} else {
				line(i, -25 + 2, i, -15);
			}
		}
		pop();
	}

	static build(holder) {
		let n = new Ruler(holder.pos.x, holder.pos.y, 500, 0);
		tools.push(n);
		return n;
	}

	duplicate() {
		let n = new Ruler(this.pos.x, this.pos.y, this.displacement.x, this.displacement.y, this.minDiv);
		tools.push(n);
		return n;
	}
}

class Protractor extends Circle {

	constructor(x, y, r, minDiv = 30) {
		super(x,y,r);
		this.minDiv = minDiv;
		this.resizer = new p5.Vector(this.r, 0);

		this.properties = [
		{
			onchange : v => {this.minDiv = parseFloat(v); updateFlag = true;},
			name : 'Division',
			type : 'range',
			tags : (el) => {el.min = 5; el.max = 60; el.step = 5;},
			default : () => this.minDiv,
		}
		];
	}

	mouseData() {
		fill(255); noStroke();
		text(floor(degrees(fixAngles(p5.Vector.sub(mouse.pos, this.pos).heading())[0])*10)/10, 140, 40)
	}

	setPos(x,y) {
		this.pos.set(x,y);
	}

	render() {
		strokeWeight(1);
		noStroke();
		fill(255, 100);
		ellipse(this.pos.x, this.pos.y, this.r*2);
		fill(255,0,0);
		rectMode(CENTER);
		if(mouse.isHolding(this))
			rect(this.pos.x + this.resizer.x, this.pos.y + this.resizer.y, 5, 5);
		rect(this.pos.x, this.pos.y, 5, 5);

		push();
		translate(this.pos.x, this.pos.y);
		stroke(255);
		let size = max(min(this.minDiv/2, this.r/4),this.r/12);
		textSize(size);
		fill(255);

		for(let i = 0; i < 360; i += this.minDiv/5) {
			if(i % this.minDiv == 0) {
				line(this.r - 1, 0, this.r*0.85, 0);
				noStroke();
				text(i, this.r*0.85 - size*1.5, 5);
				stroke(255);
			} else {
				line(this.r - 1, 0, this.r*0.9, 0);
			}
			rotate(radians(this.minDiv/5));
		}

		pop();
	}

	contains(pt, isMouse) {
		let p = pt.pos || pt;
		if(isMouse != false && Circle.contains(this.pos.x + this.resizer.x, this.pos.y + this.resizer.y, 5, p.x, p.y)) {
			return 'resize';
		} else { return Circle.contains(this.pos.x, this.pos.y, this.r, p.x, p.y); }
	}

	morph(target, tag) {
		switch(tag) {
			case 'resize':
			let OP = p5.Vector.sub(target.pos, this.pos);
			this.resizer = OP;
			this.r = OP.mag();
			this.minDiv = max(floor(1000/this.r)*5, 5);
			break;

			default:
			this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
		}
	}

	static build(holder) {
		let n = new Protractor(holder.pos.x, holder.pos.y, 150, 30);
		tools.push(n);
		return n;
	}

	duplicate() {
		let n = new Protractor(this.pos.x, this.pos.y, this.r, this.minDiv);
		tools.push(n);
		return n;
	}
}