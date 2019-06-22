var Vector = p5.Vector;

class Shape {

	constructor(x,y) {
		this.pos = new Vector(x,y);
	}

	intersects(shape) {
		return Shape.doIntersect(this, shape);
	}

	static doIntersect(shapeA, shapeB) {//automatically detect shape
		if(shapeB instanceof Rectangle) return shapeA.intersectsRect(shapeB.pos.x, shapeB.pos.y, shapeB.w, shapeB.h);
		if(shapeB instanceof Circle) return shapeA.intersectsCircle(shapeB.pos.x, shapeB.pos.y, shapeB.r);
	}
}

class Rectangle extends Shape {

	constructor(x,y,w,h,color) {
		super(x,y);
		this.w = w;
		this.h = h || w;
		this.color = color;
	}

	contains(point) {

		return (
			point.pos.x >= this.pos.x - this.w &&
			point.pos.x <= this.pos.x + this.w &&
			point.pos.y >= this.pos.y - this.h &&
			point.pos.y <= this.pos.y + this.h
		);
	}

	static contains(x,y,w,h,px,py) {

		return (
			px >= x - w &&
			px <= x + w &&
			py >= y - h &&
			py <= y + h
		);
	}

	intersectsCircle(x, y, r) {
		let xDist = abs(this.pos.x - x);
	    let yDist = abs(this.pos.y - y);

	    if (xDist > (r + this.w) || yDist > (r + this.h)) { return false; }
	    if (xDist <= this.w || yDist <= this.h) { return true; }
	    return (xDist - this.w)**2 + (yDist - this.h)**2 <= r**2;
	}

	intersectsRect(x, y, w, h) {
		return !(
		 	x - w > this.pos.x + this.w ||
      		x + w < this.pos.x - this.w ||
      		y - h > this.pos.y + this.h ||
      		y + h < this.pos.y - this.h
	    );
	}

	render() {
		fill(this.color);
		rectMode(CENTER);
		rect(this.pos.x, this.pos.y, this.w*2, this.h*2);
	}

	get area() {
		return this.w*2*this.h*2;
	}
}

class Circle extends Shape {

	constructor(x,y,r,color) {
		super(x,y);
		this.r = r;
		this.color = color;
	}

	contains(point) {
		return (point.pos.y-this.pos.y)**2 + (point.pos.x-this.pos.x)**2 <= this.r**2;
	}

	static contains(x, y, r, px, py) {
		return (py-y)**2 + (px-x)**2 <= r**2;
	}

	intersectsCircle(x, y, r) {
		return (this.r + r)**2 > (this.pos.y - y)**2 + (this.pos.x - x)**2;
	}

	intersectsRect(x, y, w, h) {
		let xDist = abs(this.pos.x - x);
	    let yDist = abs(this.pos.y - y);

	    if (xDist > (this.r + w) || yDist > (this.r + h)) { return false; }
	    if (xDist <= w || yDist <= h) { return true; }
	    return (xDist - w)**2 + (yDist - h)**2 <= this.r**2;
	}

	render() {
		// stroke(255);
		noStroke();
		fill(this.color || 150);
		ellipse(this.pos.x, this.pos.y, this.r*2);
	}

	stroke() {
		stroke(255);
		noFill();
		ellipse(this.pos.x, this.pos.y, this.r*2);
	}

	get area() {
		return PI*(this.r**2);
	}
}

function distSq(x,y,x2,y2) {
	return ((x2-x)**2 + (y2-y)**2);
}