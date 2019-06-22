class Arc {
	constructor(x, y, r, angleS, angleD) {
		this.pos = createVector(x, y);
		this.r = r;

		this.angleS = angleS;
		this.angleD = angleD;

		this.rStart = p5.Vector.fromAngle(angleS).mult(r);
		this.rEnd = p5.Vector.fromAngle(angleS + angleD).mult(r);

		this.strokeWeight = 2;

		this.color = color(255,255,255,150);
		this.className = Arc;
	}

	setPos(x,y) {
		this.pos.set(x,y);
	}

	render() {
		noFill();
		stroke(this.color);
		strokeWeight(this.strokeWeight);

		arc(this.pos.x, this.pos.y, this.r*2, this.r*2, this.angleS, this.angleD + this.angleS);

		if(mouse.isHolding(this)) {
			rectMode(CENTER);
			noStroke();
			fill(255,0,0);
			rect(this.pos.x + this.rStart.x, this.pos.y + this.rStart.y, 5, 5);
			fill(0,255,0);
			rect(this.pos.x + this.rEnd.x, this.pos.y + this.rEnd.y, 5, 5);
		}

		// fill(255,0,0);
		// noStroke();
		// ellipse(this.pos.x, this.pos.y, this.strokeWeight);
	}

	contains(pt) {
		let p = pt.pos || pt;
		if(Circle.contains(this.rStart.x + this.pos.x, this.rStart.y + this.pos.y, 5, p.x, p.y)) return 'rotate';
		if(Circle.contains(this.rEnd.x + this.pos.x, this.rEnd.y + this.pos.y, 5, p.x, p.y)) return 'resize';

		let OP = p5.Vector.sub(p, this.pos);
		let d = OP.magSq();

		if( d >= (this.r - this.strokeWeight)**2 && d <= (this.r + this.strokeWeight)**2 ) {
			return this.withinArc(OP.heading());
		}
	}

	withinArc(a) {
		if(a < 0) a += TWO_PI;
		const s0 = this.angleS;
		const s1 = this.angleS + this.angleD;
		if(s1 > TWO_PI) {
			return a >= s0 || a <= s1 - TWO_PI;
		}
		return a >= s0 && a <= s1;
	}

	morph(target, tag) {
		let OP = p5.Vector.sub(target.pos, this.pos);
		let a;
		switch(tag) {

			case 'rotate':
			a = OP.heading();
			this.angleS = fixAngles(a)[0];
			this.rStart = OP.setMag(this.r);
			this.rEnd = this.rStart.copy().rotate(this.angleD);
			break;

			case 'resize':
			a = OP.heading();
			this.rStart.div(this.r);
			this.angleD = fixAngles(fixAngles(a)[0] - this.angleS)[0];
			this.r = OP.mag();
			this.rStart.mult(this.r);
			this.rEnd = OP;
			break;

			default:
			this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
		}
	}

	returnRay(ray, pt) {

		let dir = p5.Vector.sub(pt, this.pos);
		dir.set(dir.y, -dir.x).div(this.r);

		ray.end = pt;
		return Ray.reflect(ray, dir);
	}

	static build(holder) {
		if(holder.buildHistory.length < 1) {
			return false;
		}
		let p = holder.buildHistory[0];
		let r = fixAngles(p5.Vector.sub(p, holder.pos).heading() - PI)[0];
		let n = new Arc(p.x, p.y, p5.Vector.sub(p, holder.pos).mag(), r, 0.1);
		objects.push(n);
		return n;
	}

	duplicate() {
		let n = new Arc(this.pos.x, this.pos.y, this.r, this.angleS, this.angleD);
		objects.push(n);
		return n;
	}
}