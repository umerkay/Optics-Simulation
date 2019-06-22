class Ray {
	constructor(pos, dir, fill) {
		this.pos = pos;
		if(typeof dir == 'number')
			this.dir = p5.Vector.fromAngle(dir); //either takes an angle for direction
		else
			this.dir = dir; //or takes vector for direction

		this.children = []; //stores subsequent ray segments as children
		this.color = fill || color(255,255,255);
	}

	render() {

		stroke(...this.color.levels);
		strokeWeight(1);
		if(!this.end) { //if no end, continue beyond width so that end isnt seen (infinite ray)
			line(this.pos.x, this.pos.y, this.pos.x + 2 * screen.w * this.dir.x, this.pos.y + 2 * screen.w * this.dir.y);
		} else {
			line(this.pos.x, this.pos.y, this.end.x, this.end.y);
		}

		for(let child of this.children) { //recursively render all children
			// child.render();
			try { child.render(); } catch(e) {} //this is so that it doesnt throw an error
		}
	}

	handle(objects) {
		this.children = []; //reset children, as space has updated so they are usless :)
		this.end = null; //reset ray to not end

		let closest = null;
		let record_dSq = Infinity;
		let closestObj = null;
		//iterate to find closest from all points of collision
		for(let object of objects) {
			let pts = this.doesCollide(object); //point(s) of collision
			if(pts) {
				if(pts instanceof Array) {
					for(let pt of pts) { //iterate to find closest of point(s)
						let d = p5.Vector.sub(this.pos, pt).magSq();
						if(d < record_dSq && d > 1e-6) { //check if close enough AND not at this.pos
							record_dSq = d;
							closest = pt;
							closestObj = object;
						}
					}
				} else {
					let d = p5.Vector.sub(this.pos, pts).magSq();
					if(d < record_dSq && d > 1e-6) { //check if close enough AND not at this.pos
						record_dSq = d;
						closest = pts;
						closestObj = object;
					}
				}
			}
		}

		if(closest) {
			//if there is a closest collision, ask the object for the processed ray(s)
			let c = closestObj.returnRay(this, closest); //there may or may not be a ray
			if(c) {
				if(c instanceof Ray) {
					this.children.push(c); //add it to this.children
					try { //try to handle new ray, if at any point max call stack error occurs
						if(!calcWarning) c.handle(objects);
					} catch(err) {
						calcWarning = true; //give calc warning only and donot throw error to stop program
					}
				} else {
					for(let ray of c) {
						this.children.push(ray); //add it to this.children
						try { //try to handle new ray, if at any point max call stack error occurs
							if(!calcWarning) ray.handle(objects);
						} catch(err) {
							calcWarning = true; //give calc warning only and donot throw error to stop program
						}
					}
				}
			}
		}
	}

	doesCollide(obj) { //function to take any object and process collision detection
		if(obj instanceof PolygonalBlock) {
			const cols = []; //may have multiple collisions
			for(let l of obj.segments) { //for every line check if collides
				let p = this.collWithLine(l);
				if(p) {
					p.line = l; //give line info for later use
					cols.push(p);
				}
			}
			return cols;
		} else if(obj instanceof CircularBlock) {
			
			const pN = getNormal(obj.pos, this.pos, this.dir.copy()); //calc normal point from center of circle to ray
			const ON = p5.Vector.sub(pN, obj.pos); //normal vector
			const dSq = ON.magSq(); //mag of normal

			if(dSq <= obj.r**2) { //only collides if normal point within arc radius
				let v, v2, vA, v2A;
				if(dSq <= 1e-5) { //if ray passes through center
					v = this.dir.copy().mult(obj.r); //p = r dist from center to circumference in ray direction
					v2 = this.dir.copy().mult(-obj.r); //^ but other direction
				} else {
					const d = sqrt(dSq);
					const a = acos(d/obj.r); //angle b/w OR and ON
					const a0 = ON.heading();
					//ON rotated to +ve angle and -ve and size set to radius to lie on circumference
					v = ON.copy().rotate(a).div(d).mult(obj.r); //^this gives v and v2, possible points on segment
					v2 = ON.copy().rotate(-a).div(d).mult(obj.r);
				}
				const pts = []; //may return one point or array of both

				v.add(obj.pos); v2.add(obj.pos); //get point relative to origin from vector
				if(this.withinSegment(v)) pts.push(v); //if within line, accept it
				if(this.withinSegment(v2)) pts.push(v2);

				return pts;
			}
		}
		else if(obj instanceof Line) {
			return this.collWithLine(obj);
		} else if(obj instanceof Arc) {

			const pN = getNormal(obj.pos, this.pos, this.dir.copy()); //calc normal point from center of circle to ray
			const ON = p5.Vector.sub(pN, obj.pos); //normal vector
			const dSq = ON.magSq(); //mag of normal

			if(dSq <= obj.r**2) { //only collides if normal point within arc radius
				let v, v2, vA, v2A;
				if(dSq <= 1e-5) { //if ray passes through center
					v = this.dir.copy().mult(obj.r); //p = r dist from center to circumference in ray direction
					v2 = this.dir.copy().mult(-obj.r); //^ but other direction
					vA = this.dir.heading(); v2A = vA + PI; //angle of both vectors relative to global 0 angle
				} else {
					const a = acos(sqrt(dSq)/obj.r); //angle b/w OR and ON
					const a0 = ON.heading();
					//ON rotated to +ve angle and -ve and size set to radius to lie on circumference
					v = ON.copy().rotate(a).setMag(obj.r); //^this gives v and v2, possible points on segment
					v2 = ON.copy().rotate(-a).setMag(obj.r);
					vA = a0 + a; v2A = a0 - a; //angle of both vectors relative to global 0 angle
				}
				const pts = []; //may return one point or array of both

				if(obj.withinArc(vA)) { //check if within start and end of arc
					v.add(obj.pos); //get point from vector
					if(this.withinSegment(v)) pts.push(v); //if within line, accept it
				};

				if(obj.withinArc(v2A)) { //same as for above point
					v2.add(obj.pos);
					if(this.withinSegment(v2)) pts.push(v2);
				};
				return pts;
			}
		}
	}

	collWithLine(obj) {
		//line to line collision algorithm straight from wikipedia
		const x1 = obj.pos.x, y1 = obj.pos.y;
		const x2 = obj.pos.x + obj.displacement.x, y2 = obj.pos.y + obj.displacement.y;
		const x3 = this.pos.x, y3 = this.pos.y;
		const x4 = this.pos.x + this.dir.x, y4 = this.pos.y + this.dir.y;

		const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
		if(den == 0) return; //lines are parallel

		const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
		const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
		if (t > 0 && t < 1 && u > 0) {
			return createVector(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
		}
	}

	withinSegment(pt) {
		//takes pt that is on line (known), this checks if it is within bounds of segment
		return ((this.dir.x == 0) || (this.dir.x > 0 ? pt.x >= this.pos.x : pt.x <= this.pos.x)) &&
		((this.dir.y == 0) || (this.dir.y > 0 ? pt.y >= this.pos.y : pt.y <= this.pos.y))
	}

	static reflect(ray, surface) {
		//some reflection algo i didnt write
		const dd = (ray.dir.x * surface.x + ray.dir.y * surface.y) * 2;
		const ref = createVector(surface.x * dd - ray.dir.x, surface.y * dd - ray.dir.y);

		return new Ray(ray.end, ref, color(...ray.color.levels));
	}

	static refract(func, ray, surface, i, object) {
		let r, N;
		if(func == "into") {
			r = HALF_PI - asin(sin(i)/object.n); //angle of refraction
			N = surface.copy().rotate(r); //dir of refraction
		} else {
			r = HALF_PI - asin(sin(i)*object.n); //same as above
			if(isNaN(r)) return Ray.reflect(ray, surface); //r is undefined --> TIR
			N = surface.copy().rotate(-r); //same as above
		}

		let R0 = ((1 - object.n)/(1 + object.n))**2;
		let reflection = R0 + (1 - R0)*((1 - cos(i))**5); //fresnel's equation simplified
		let toReturn = [];
		//return only if intensity calculates to > 1
		let refracted = new Ray(ray.end, N, color(...ray.color.levels));
		if(refracted.setIntensity((1 - reflection) * ray.color.levels[3])) toReturn.push(refracted);
		let reflected = Ray.reflect(ray, surface);
		if(reflected.setIntensity(reflection * ray.color.levels[3])) toReturn.push(reflected);

		return toReturn;
	}

	setIntensity(s) {
		this.color.levels[3] = s;
		return s >= 1;
	}
}

function getNormal(p, a, ab) {
	//takes point p, and line with pos a and dir vector ab, return perp vector between two
	ap = p5.Vector.sub(p, a);
	return ab.mult(ap.dot(ab)).add(a);
}