let mouse;

function buildInterface() {

	mouse = {
		pos: createVector(mouseX, mouseY),
		a: createVector(mouseX, mouseY),
		dis: createVector(0,0),
		mode: 'hand',
		handMode: 'single',
		c: createVector(width/2, height/2),
		buildHistory: [],
	};

	mouse.hold = function(obj, prop) {

		// if(mouse.handMode == 'single') {

			document.getElementById('delete').disabled = false;
			this.holding = obj;
			document.getElementById('output').value = obj.name || 'Untitled';
			mouse.dis.set(this.pos.x - obj.pos.x, this.pos.y - obj.pos.y);
			mouse.currProperty = prop;

			if(mouse.holding.properties) {
				let propHolder = document.getElementById('menu-sub');
				propHolder.innerHTML = '';

				for(let i = 0; i < mouse.holding.properties.length; i++) {
					let n = document.createTextNode(obj.properties[i].name + " ");
					propHolder.appendChild(n);
					let el = document.createElement('input');
					obj.properties[i].tags(el);
					el.type = obj.properties[i].type;
					el.value = obj.properties[i].default();
					el.id = i;
					el.addEventListener("input", function(e) {
						mouse.holding.properties[e.srcElement.id].onchange(e.srcElement.value);
					});
					propHolder.appendChild(el);
				}
			}
		// } else {
		// 	if(mouse.holding instanceof Object) {
		// 		mouse.holding = [mouse.holding, obj];
		// 		document.getElementById('menu-sub').innerHTML = '';
		// 		document.getElementById('output').value = 'Multiple';
		// 		document.getElementById('delete').disabled = false;
		// 	} else {
		// 		mouse.holding.push(obj);
		// 	}
		// }
		updateFlag = true;
	}

	mouse.drop = function() {
		document.getElementById('menu-sub').innerHTML = '';
		document.getElementById('delete').disabled = true;
		document.getElementById('output').value = '';
		this.holding = false;
		updateFlag = true;
	}

	mouse.delete = function() {
		this.deleteFlag = true;
	}

	mouse.isHolding = function(obj) {
		// if(mouse.handMode == 'single') {
			return obj === mouse.holding;
		// } else {
		// 	return this.holding.includes(obj);
		// }
	}

	let colorOpt = document.getElementById('color');
	colorOpt.addEventListener("change", function(e) {
		mouse.color = color(e.srcElement.value);
		if(mouse.mode == 'hand' && mouse.holding && mouse.holding.color) {
			updateFlag = true;
			mouse.holding.color.levels = mouse.color.levels;
		}
	});

	let option = document.getElementById('main-select');
	option.addEventListener("change", function(e) {
		let el = e.srcElement;

		if(el.value != 'hand') {
			// document.getElementById('property').disabled = true;
			document.body.style.cursor = "crosshair";
			mouse.mode = 'build';
			mouse.building = options[el.value][0];
			mouse.buildingName = el.value;
			mouse.drop();
		} else {
			// document.getElementById('property').disabled = false;
			document.body.style.cursor = "move";
			// mouse.drop();
			mouse.currProperty = '';
			mouse.mode = 'hand';
		}
		mouse.buildHistory = [];
	});
	option.dispatchEvent(new Event('change'));
	colorOpt.dispatchEvent(new Event('change'));
}

function mousePressed() {
	mouse.a.set(mouseX, mouseY);
	screen.a.set(screen.pos.x, screen.pos.y);

	if(screen.contains(mouse)) {
		if(mouse.mode == 'build') {
			let n = mouse.building.build(mouse);
			updateFlag = true;
			mouse.drop();

			if(!n) {
				mouse.buildHistory.push(mouse.pos.copy());
				return;
			}
			else mouse.buildHistory = [];

			options[mouse.buildingName][2] += 1;
			n.name = options[mouse.buildingName][1] + ' ' + options[mouse.buildingName][2];

			if(n.morph) {
				mouse.holding = n;
				mouse.currProperty = n.buildMorph == false ? 'none' : 'resize';
				mouse.isBuilding = true;
			}
		} else if(mouse.mode == 'hand') {

			// if(mouse.holding && keyIsDown(16)) {
			// 	mouse.handMode = 'multiple';
			// } else {
			// 	mouse.handMode = 'single';
				mouse.drop();
			// }

			let recordDistSq = Infinity;
			let recordObj = null;
			let recordProp = null;

			for(let i = sources.length - 1; i >= 0; i--) {
				const source = sources[i];
				const dSq = p5.Vector.sub(mouse.pos, source.pos).magSq();
				const prop = source.contains(mouse);
				if(dSq < recordDistSq && source.contains(mouse)) {
					recordDistSq = dSq; recordObj = source; recordProp = prop;
				}
			}

			for(let i = tools.length - 1; i >= 0; i--) {
				const tool = tools[i];
				const dSq = p5.Vector.sub(mouse.pos, tool.pos).magSq();
				const prop = tool.contains(mouse);
				if(dSq < recordDistSq && tool.contains(mouse)) {
					recordDistSq = dSq; recordObj = tool; recordProp = prop;
				}
			}

			for(let i = objects.length - 1; i >= 0; i--) {
				const object = objects[i];
				const dSq = p5.Vector.sub(mouse.pos, object.pos).magSq();
				const prop = object.contains(mouse);
				if(dSq < recordDistSq && prop) {
					recordDistSq = dSq; recordObj = object; recordProp = prop;
				}
			}

			if(recordObj) {
				mouse.hold(recordObj, recordProp);
			}
		}
	}
}

function mouseDragged() {
	if(mouse.holding && screen.contains(mouse) && mouse.handMode == 'single') {
		mouse.holding.morph(mouse, mouse.currProperty);
		updateFlag = true;
	}
	// if(!mouse.holding) {
	// 	console.log(mouse.holding)
	// 	screen.pos.set(p5.Vector.add(screen.a, createVector(mouseX - mouse.a.x, mouseY - mouse.a.y)));
	// }
}

function mouseReleased() {
	if(mouse.mode == 'build' && mouse.isBuilding) {
		mouse.hold(mouse.holding);
		mouse.isBuilding = false;
	}
}

const options = {
	'hand' : 'hand',

	'ray' : [RaySource,'Ray',0],
	'pointLight' : [PointLight,'Point Light',0],
	'beam' : [Beam,'Beam',0],

	'mirror' : [Mirror,'Mirror',0],
	'void' : [Void,'Void',0],
	'filter' : [Filter,'Filter',0],
	'arc' : [Arc,'Circular Arc',0],
	'lens' : [Lens,'Lens',0],

	'circle' : [CircularBlock,'Circular Block',0],
	'polygon' : [PolygonalBlock,'Polygon',0],
	'rectblock' : [RectBlock,'Rectangular Block',0],

	'ruler' : [Ruler,'Ruler',0],
	'd' : [Protractor,'Protractor',0],
}