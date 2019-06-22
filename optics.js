class Line {
	constructor(x1, y1, dx, dy) {
		this.pos = createVector(x1, y1);
		this.displacement = createVector(dx, dy);
		this.dir = this.displacement.copy().normalize(); //stores both direction and exact displacement vector
		this.strokeWeight = 2;
		this.length = this.displacement.mag(); //even stores magnitude
		this.color = color(255,150);
	}

	render() {
		stroke(...this.color.levels);
		strokeWeight(this.strokeWeight);
		line(this.pos.x, this.pos.y, this.pos.x + this.displacement.x, this.pos.y + this.displacement.y);
		
		if(mouse.isHolding(this)) {
			fill(0,255,0);
			noStroke();
			rectMode(CENTER);
			rect(this.pos.x, this.pos.y, this.strokeWeight*2, this.strokeWeight*2);
			rect(this.pos.x + this.displacement.x, this.pos.y + this.displacement.y, this.strokeWeight*2, this.strokeWeight*2);
		}
	}

	setPos(x,y) {
		this.pos.set(x,y);
	}

	contains(pt) {
		//might want to implement this algorithm later
		// if(this.withinSegment(pt.pos)) {
		// 	console.log(pt)
		// 	let PN = getNormal(pt.pos, this.pos, this.dir);
		// 	return PN.magSq() <= this.strokeWeight**2;
		// }
		//terrible algorithm but it is fine because it is run rarely; terrible because sqrt is calc twice!
		const d1 = dist(pt.pos.x, pt.pos.y, this.pos.x, this.pos.y);
		const d2 = dist(pt.pos.x, pt.pos.y, this.pos.x + this.displacement.x, this.pos.y + this.displacement.y);
		if(d1 <= (this.resizer || 6)) return 'resizeB';
		if(d2 <= (this.resizer || 6)) return 'resize';

		return (d1+d2 >= this.length-this.strokeWeight/2 && d1+d2 <= this.length+this.strokeWeight/2)
	}

	setDir(target, morph, snapAngle) {
		const dir = p5.Vector.sub(target, this.pos).normalize(); //get new dir
		if(dir.x == 0 && dir.y == 0) return; //if mag is zero we wont change
		this.dir.set(dir.x, dir.y); //set direction
		//if morph (change size too?) then set mag of displacement otherwise change direction only
		const dis = morph ? p5.Vector.sub(target, this.pos) : this.dir.copy().mult(this.length);
		this.displacement.set(dis.x, dis.y);
		if(morph) this.length = this.displacement.mag();
	}

	morph(target, tag) {
		switch(tag) {
			case 'rotate':
			this.setDir(target.pos, false, keyIsDown(16));
			break;

			case 'resizeB':
			const end = p5.Vector.add(this.pos, this.displacement);
			this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
			this.setDir(end, true, keyIsDown(16));
			break;

			case 'resize':
			this.setDir(target.pos, true, keyIsDown(16));
			break;

			default:
			this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
		}
	}

	duplicate() {
		let n = new this.className(this.pos.x, this.pos.y, this.displacement.x, this.displacement.y);
		objects.push(n);
		return n;
	}
}

class Lens extends Line {
	constructor(x1, y1, dx, dy, fLength = 200) {
		super(x1, y1, dx, dy);
		this.color = color(255,255,255,50);
		this.fLength = fLength; //focal length
		this.className = Lens;

		this.properties = [
		{
			onchange : v => {this.fLength = parseInt(v); updateFlag = true;},
			name : 'Focal Length',
			type : 'number',
			tags : (el) => {el.step = 2},
			default : () => this.fLength,
		}
		];
	}

	returnRay(ray, pt) {
		const O = p5.Vector.add(this.pos, p5.Vector.mult(this.displacement, 1/2)); //center of lens
		const a = this.dir.angleBetween(ray.dir) - PI/2; //angle of incidence
		const OP = ray.dir.copy().mult(this.fLength/cos(a)); //some wierd trig calc

		ray.end = pt; //end ray
		const dir = OP.sub(p5.Vector.sub(pt, O)).normalize().mult(sign(this.fLength));
		return new Ray(ray.end, dir, ray.color);
	}

	static build(holder) {
		let n = new Lens(holder.pos.x, holder.pos.y, 5, 5);
		objects.push(n);
		return n;
	}

	duplicate() {
		let n = new Lens(this.pos.x, this.pos.y, this.displacement.x, this.displacement.y, this.fLength);
		objects.push(n);
		return n;
	}

	render() {
		stroke(...this.color.levels);
		strokeWeight(this.strokeWeight);
		line(this.pos.x, this.pos.y, this.pos.x + this.displacement.x, this.pos.y + this.displacement.y);

		// if(mouse.holding === this) {
			fill(255,0,0);
			noStroke();
			rectMode(CENTER);
			rect(this.pos.x, this.pos.y, 2*this.strokeWeight, 2*this.strokeWeight);
			rect(this.pos.x + this.displacement.x, this.pos.y + this.displacement.y, 2*this.strokeWeight, 2*this.strokeWeight);
		// }
	}
}

class Mirror extends Line {

	constructor(x1, y1, dx, dy) {
		super(x1, y1, dx, dy);
		this.color = color(255,255,255,100);
		this.className = Mirror;
	}

	returnRay(ray, pt) {
		ray.end = pt; //end parent ray here and send new child
		return Ray.reflect(ray, this.dir);
	}

	static build(holder) {
		let n = new Mirror(holder.pos.x, holder.pos.y, 5, 5);
		objects.push(n);
		return n;
	}
}

class Void extends Line {

	constructor(x1, y1, dx, dy) {
		super(x1, y1, dx, dy);
		this.color = color(255,0,0,100);
		this.className = Void;
	}

	returnRay(ray, pt) {
		ray.end = pt; //end ray hh
	}

	static build(holder) {
		let n = new Void(holder.pos.x, holder.pos.y, 5, 5);
		objects.push(n);
		return n;
	}
}

class Filter extends Line {

	constructor(x1, y1, dx, dy, fill) {
		super(x1, y1, dx, dy);
		fill.levels[3] = 100;
		this.color = fill;
		this.className = Filter;
	}

	returnRay(ray, pt) {
		ray.end = pt;
		let rays = [];

		let refC = ray.color.levels.map((l,i) => {
			return l - this.color.levels[i];
		});
		let othC = this.color.levels.map((l, i) => {
			if( refC[i] < 0 ) {
				let r = l + refC[i];
				refC[i] = 0;
				return r;
			} else return l;
		});

		if(refC[0] + refC[1] + refC[2] > 0) {
			let n = Ray.reflect(ray, this.dir);
			n.color = color(refC[0], refC[1], refC[2], ray.color.levels[3]);
			rays.push(n);
		}
		if(othC[0] + othC[1] + othC[2] > 0) {
			rays.push(new Ray(ray.end, ray.dir.copy(), color(othC[0], othC[1], othC[2], ray.color.levels[3])));
		}

		return rays;
	}

	static build(holder) {
		let n = new Filter(holder.pos.x, holder.pos.y, 5, 5, holder.color);
		objects.push(n);
		return n;
	}

	duplicate() {
		let n = new Filter(this.pos.x, this.pos.y, this.displacement.x, this.displacement.y, color(...this.color.levels));
		objects.push(n);
		return n;
	}
}