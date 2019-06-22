class PolygonalBlock {
	constructor(vertices, n = 1.5) {
		this.segments = [];
		let sumX = 0, sumY = 0;
		for(let i = 0; i < vertices.length; i++) {
			let dx = vertices[(i + 1)%vertices.length][0] - vertices[i][0];
			let dy = vertices[(i + 1)%vertices.length][1] - vertices[i][1];
			this.segments.push(new Mirror(vertices[i][0], vertices[i][1], dx, dy));
			sumX += vertices[i][0];
			sumY += vertices[i][1];
		}
		this.vertices = vertices;
		this.color = color(255, n/10 * 255);
		let x = sumX/vertices.length;
		let y = sumY/vertices.length;
		this.pos = createVector(x,y);

		this.buildMorph = false;

		this.n = n;
		this.properties = [
		{
			onchange : v => {this.n = parseFloat(v); updateFlag = true;},
			name : 'Refractive Index',
			type : 'range',
			tags : (el) => {el.min = 1; el.max = 3.5; el.step = 0.05;},
			default : () => this.n,
		}
		];
		this.className = PolygonalBlock;
	}

	render() {
		fill(255, map(this.n**2, 1, 9, 50, 255));
		stroke(255, 0, 0);
		strokeWeight(3);
		// ellipse(this.pos.x, this.pos.y,10);
		beginShape();
		for(let v of this.vertices) {
			vertex(...v);
			if(mouse.isHolding(this)) point(...v);
		}
		noStroke();
		endShape();
		// for(let l of this.segments) {
		// 	l.render();
		// }
	}

	updateLines() {
		for(let i = 0; i < this.vertices.length; i++) {
			let dx = this.vertices[(i + 1)%this.vertices.length][0] - this.vertices[i][0];
			let dy = this.vertices[(i + 1)%this.vertices.length][1] - this.vertices[i][1];
			this.segments[i].pos.set(this.vertices[i][0], this.vertices[i][1]);
			this.segments[i].displacement.set(dx, dy);
			this.segments[i].dir = this.segments[i].displacement.copy().normalize();
		}
	}

	contains(pt, isMouse) {
		//ray from pt to infinity, if collides with edges even times, then point is outside
		if(isMouse != false) {
			for(let i = 0; i < this.vertices.length; i++) {
				if(pt.pos) {
					if(Circle.contains(this.vertices[i][0], this.vertices[i][1], 8, pt.pos.x, pt.pos.y)) return ''+i;
				} else {
					if(Circle.contains(this.vertices[i][0], this.vertices[i][1], 8, pt.x, pt.y)) return ''+i;
				}
			}
		}
		const ray = new Ray(pt.pos || pt, createVector(1,0));
		return ray.doesCollide(this).length % 2 != 0;
	}

	returnRay(ray, pt) {
		ray.end = pt;
		let i = HALF_PI - ray.dir.angleBetween(pt.line.dir);

		return Ray.refract(this.contains(mid(ray.pos, pt), false) ? 'outof' : 'into', ray, pt.line.dir, i, this);
	}

	setPos(x,y) {
		let old = this.pos.copy();
		this.pos.set(x, y);
		let diff = p5.Vector.sub(this.pos, old);
		for(let l of this.segments) {
			l.pos.add(diff);
		}
		for(let v of this.vertices) {
			v[0] += diff.x; v[1] += diff.y;
		}
	}

	morph(target, prop) {
		if(prop == 'none') return;
		if(parseInt(prop) >= 0) {
			this.vertices[prop] = [target.pos.x, target.pos.y];
			this.updateLines();
			return;
		}
		this.setPos(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
	}

	static build(holder) {

		if(holder.buildHistory.length > 2) {
			let s = holder.buildHistory[0];
			if(!Circle.contains(s.x, s.y, 10, holder.pos.x, holder.pos.y)) return false;
		} else {
			return false;
		}
		let vertices = mouse.buildHistory.map(v => [v.x, v.y]);
		let n = new PolygonalBlock(vertices);
		objects.push(n);
		return n;
	}

	duplicate() {
		let v = this.vertices.map(v => [v[0], v[1]]);
		let n = new PolygonalBlock(v, this.n);
		objects.push(n);
		return n;
	}
}

class RectBlock extends PolygonalBlock {
	constructor(x, y, w, h, n) {
		if(x instanceof Array) super(x, y);
		else super([[x,y], [x+w, y], [x+w,y+h], [x,y+h]], n);
		this.buildMorph = true;
		this.className = RectBlock;
	}

	morph(target, prop) {
		if(prop == 'resize') {
			let m = 2;
			let mM = m - 1 < 0 ? this.vertices.length-1 : m - 1;
			let mP = m + 1 >= this.vertices.length ? 0 : m + 1;
			if(m >= 0) {
				this.vertices[mM] = [target.pos.x, this.vertices[mM][1]];
				this.vertices[m] = [target.pos.x, target.pos.y];
				this.vertices[mP] = [this.vertices[mP][0], target.pos.y];
				this.updateLines();
				return;
			}
			this.setPos(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
		} else {
			if(parseInt(prop) >= 0) {
				this.vertices[prop] = [target.pos.x, target.pos.y];
				this.updateLines();
				return;
			}
			this.setPos(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
		}
	}

	static build(holder) {
		let n = new RectBlock(holder.pos.x, holder.pos.y, 5, 5, 1.5);
		objects.push(n);
		holder.p
		return n;
	}

	duplicate() {
		let v = this.vertices.map(v => [v[0], v[1]]);
		let n = new RectBlock(v, this.n);
		objects.push(n);
		return n;
	}
}

class CircularBlock extends Circle {
	constructor(x, y, r, n = 1.5) {
		super(x,y,r);
		this.n = n;
		this.resizer = new p5.Vector(this.r, 0);
		this.className = CircularBlock;

		this.properties = [
		{
			onchange : v => {this.n = parseFloat(v); updateFlag = true;},
			name : 'Refractive Index',
			type : 'range',
			tags : (el) => {el.min = 1; el.max = 3.5; el.step = 0.1;},
			default : () => this.n,
		}
		];
	}

	setPos(x,y) {
		this.pos.set(x,y);
	}

	render() {
		noStroke();
		fill(255, map(this.n**2, 1, 20, 50, 255));
		ellipse(this.pos.x, this.pos.y, this.r*2);
		if(mouse.isHolding(this)) {
			fill(255,0,0);
			rectMode(CENTER);
			rect(this.pos.x + this.resizer.x, this.pos.y + this.resizer.y, 5, 5);
			rect(this.pos.x, this.pos.y, 5, 5);
		}
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
			break;

			default:
			this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
		}
	}

	returnRay(ray, pt) {

		let dir = p5.Vector.sub(pt, this.pos);
		dir.set(-dir.y, dir.x).div(this.r);
		ray.end = pt;
		let i = HALF_PI - ray.dir.angleBetween(dir);

		return Ray.refract(this.contains(mid(ray.pos, pt), false) ? 'outof' : 'into', ray, dir, i, this);
	}

	static build(holder) {
		let n = new CircularBlock(holder.pos.x, holder.pos.y, 10, 1.5);
		objects.push(n);
		return n;
	}

	duplicate() {
		let n = new CircularBlock(this.pos.x, this.pos.y, this.r, this.n);
		objects.push(n);
		return n;
	}
}