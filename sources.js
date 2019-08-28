class PointSource extends Circle {
	constructor(x, y) {
		super(x, y, 5)
		this.rays = [];
		this.updateFlag = true;
	}

	setPos(x, y) {
		this.pos.set(x, y);
	}

	render() {

		for (let ray of this.rays) {
			ray.render();
		}

		fill(255, 0, 0);
		noStroke();
		rectMode(CENTER)
		rect(this.pos.x, this.pos.y, this.r * 1.5, this.r * 1.5);
		if (mouse.isHolding(this) && this.dir) {
			rect(this.pos.x + this.dir.x * 20, this.pos.y + this.dir.y * 20, this.r, this.r);
		}
	}

	handle(objects) {
		for (let ray of this.rays) {
			ray.handle(objects);
		}
	}
}

class RaySource extends PointSource {
	constructor(x, y, angle, fill) {
		super(x, y);
		this.color = fill;
		this.dir = p5.Vector.fromAngle(angle);
		this.rays.push(new Ray(this.pos, this.dir, this.color));

		this.properties = [
			{
				onchange: v => { this.color.levels[3] = parseInt(v); updateFlag = true; },
				name: 'Intensity',
				type: 'range',
				tags: (el) => { el.min = 30; el.max = 255; },
				default: () => this.color.levels[3],
			}
		];
		this.className = RaySource;
	}

	static build(holder) {
		let n = new RaySource(holder.pos.x, holder.pos.y, 0, color(...holder.color.levels));
		sources.push(n);
		return n;
	}

	duplicate() {
		let n = new RaySource(this.pos.x, this.pos.y, this.dir.heading(), color(...this.color.levels));
		sources.push(n);
		return n;
	}

	contains(pt) {
		if (Circle.contains(this.pos.x + this.dir.x * 20, this.pos.y + this.dir.y * 20, this.r, pt.pos.x, pt.pos.y)) {
			return "rotate";
		}
		if (Circle.contains(this.pos.x, this.pos.y, this.r, pt.pos.x, pt.pos.y)) return true;
	}

	setDir(target) {
		let dir = p5.Vector.sub(target.pos, this.pos).normalize();
		if (dir.x == 0 && dir.y == 0) return;
		this.dir.set(dir.x, dir.y);
	}

	morph(target, tag) {
		if (tag == 'rotate' || tag == 'resize') {
			this.setDir(target);
		} else {
			this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
		}
	}
}

class PointLight extends PointSource {
	constructor(x, y, freq = 10, fill) {
		super(x, y);
		this.r = 4;
		this.color = fill;
		this.freq = freq;
		this.resetRays();

		this.properties = [
			{
				onchange: v => { this.freq = parseInt(v); updateFlag = true; this.resetRays(); },
				name: 'Density',
				type: 'number',
				tags: (el) => { el.min = 1; },
				default: () => this.freq,
			},
			{
				onchange: v => { this.color.levels[3] = parseInt(v); updateFlag = true; },
				name: 'Intensity',
				type: 'range',
				tags: (el) => { el.min = 30; el.max = 255; },
				default: () => this.color.levels[3],
			}
		];
		this.className = PointLight;
	}

	resetRays() {
		this.rays = [];
		let inc = TWO_PI / this.freq;
		for (let i = 0; i <= TWO_PI; i += inc) {
			this.rays.push(new Ray(this.pos, p5.Vector.fromAngle(i), this.color));
		}
	}

	morph(target, tag) {
		if (tag == 'rotate' || tag == 'resize') {
			this.freq = int(p5.Vector.sub(this.pos, target.pos).magSq() / 100); this.resetRays();
		} else {
			this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
		}
	}

	static build(holder) {
		let n = new PointLight(holder.pos.x, holder.pos.y, 50, color(...holder.color.levels));
		sources.push(n);
		return n;
	}

	duplicate() {
		let n = new PointLight(this.pos.x, this.pos.y, this.freq, color(...this.color.levels));
		sources.push(n);
		return n;
	}
}

class Beam {
	constructor(x1, y1, angle, length, freq = 10, fill) {

		this.pos = createVector(x1, y1);

		this.strokeWeight = 4;
		this.length = length;
		this.freq = freq;
		this.color = fill;

		this.dir = p5.Vector.fromAngle(angle);
		this.displacement = p5.Vector.fromAngle(angle + HALF_PI).mult(length);

		this.rays = [];
		this.className = Beam;

		this.properties = [
			{
				onchange: v => { this.freq = parseInt(v); updateFlag = true; this.resetRays(); },
				name: 'Density',
				type: 'number',
				tags: (el) => { el.min = 1; },
				default: () => this.freq,
			},
			{
				onchange: v => { this.color.levels[3] = parseInt(v); updateFlag = true; },
				name: 'Intensity',
				type: 'range',
				tags: (el) => { el.min = 30; el.max = 255; },
				default: () => this.color.levels[3],
			}
		];
	}

	render() {

		for (let ray of this.rays) {
			ray.render();
		}

		stroke(255);
		strokeWeight(this.strokeWeight);
		line(this.pos.x, this.pos.y, this.pos.x + this.displacement.x, this.pos.y + this.displacement.y);
		if (mouse.isHolding(this)) {
			fill(255, 0, 0);
			// strokeWeight(1);
			rectMode(CENTER);
			noStroke();
			// ellipse(this.pos.x, this.pos.y, 5);
			rect(this.pos.x, this.pos.y, 5, 5);
			fill(0, 0, 255);
			// ellipse(this.pos.x + this.displacement.x,  this.pos.y + this.displacement.y, 5);
			rect(this.pos.x + this.displacement.x, this.pos.y + this.displacement.y, 5, 5);
		}
	}

	setPos(x, y) {
		this.pos.set(x, y);
	}

	handle(objects) {
		for (let ray of this.rays) {
			ray.handle(objects);
		}
	}

	contains(pt) {

		let d1 = dist(pt.pos.x, pt.pos.y, this.pos.x, this.pos.y);
		let d2 = dist(pt.pos.x, pt.pos.y, this.pos.x + this.displacement.x, this.pos.y + this.displacement.y);
		let lineLen = this.displacement.mag();
		if (d1 <= 6) return 'rotate';
		if (d2 <= 6) return 'resize';

		return (d1 + d2 >= lineLen - this.strokeWeight / 2 && d1 + d2 <= lineLen + this.strokeWeight / 2)
	}

	setPos(target, off) {
		if (typeof target == 'object') {
			this.pos.set(target.x - off.x, target.y - off.y);
			this.reposRays();
		} else {
			this.pos.set(target, off);
			this.reposRays();
		}
	}

	setDir(target, morph, snapAngle) {
		let dis = p5.Vector.sub(target, this.pos);
		if (snapAngle == true) {
			if ((target.x < this.pos.x && target.y < this.pos.y) || (target.x > this.pos.x && target.y > this.pos.y)) {
				dis.x = 0;
			} else {
				dis.y = 0;
			}
		}
		if (dis.x == 0 && dis.y == 0) return;
		if (morph != true) {
			dis.setMag(this.length);
		} else {
			this.length = dis.mag();
			let a = this.length - this.length % this.freq;
			if (a > 0) {
				this.length = a;
			}
		}
		this.displacement.set(dis.x, dis.y);

		let dir = this.displacement.copy().rotate(-HALF_PI).normalize();
		this.dir.set(dir.x, dir.y);

		if (morph) {
			this.resetRays();
		} else {
			this.reposRays();
		}
	}

	reposRays() {
		let inc = 100 / this.freq;
		for (let i = 0; i < this.rays.length; i++) {
			let v = p5.Vector.add(this.pos, p5.Vector.mult(this.displacement, (i * inc) / (this.length)));
			this.rays[i].pos.set(v.x, v.y);
		}
	}

	resetRays() {
		this.rays = [];
		let inc = 100 / this.freq;
		for (let i = 0; i <= this.length; i += inc) {
			let r = new Ray(p5.Vector.add(this.pos, p5.Vector.mult(this.displacement, i / this.length)), this.dir, this.color);
			this.rays.push(r);
		}
	}

	static build(holder) {
		let n = new Beam(holder.pos.x, holder.pos.y, 0, 10, 10, color(...holder.color.levels));
		sources.push(n);
		return n;
	}

	duplicate() {
		let n = new Beam(this.pos.x, this.pos.y, this.dir.heading(), this.length, this.freq, color(...this.color.levels))
		n.resetRays();
		sources.push(n);
		return n;
	}

	morph(target, tag) {
		switch (tag) {
			case 'rotate':
				this.setDir(target.pos, false, keyIsDown(16));
				break;

			case 'resize':
				this.setDir(target.pos, true, keyIsDown(16));
				break;

			default:
				this.setPos(target.pos, target.dis);
		}
	}
}