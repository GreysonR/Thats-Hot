let burningObjects = [];
let fireCanv;
let fireCtx;

var vw = window.innerWidth / 100;
var vh = window.innerHeight / 100;

function initParticles(options) {
	fireCanv = document.createElement("canvas");
	fireCanv.id = "fireCanv";

	options.elem.appendChild(fireCanv);
	fireCanv.height = options.height;
	fireCanv.width = options.width;

	fireCtx = fireCanv.getContext("2d");

	burn();
}

function ignite(obj) {
	if (!burningObjects.includes(obj))
		burningObjects.push(obj);
}
function extinguish(obj) {
	burningObjects.splice(burningObjects.indexOf(obj), 1);
}
function rotatePoint(point, angle) {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return { x: cos * point.x - sin * point.y, y: sin * point.x + cos * point.y };
}

let allData = [];
function burn() {
	fireCtx.clearRect(0, 0, fireCanv.width, fireCanv.height);

	burningObjects.forEach(obj => {
		// Update path
		if (!obj.path) obj.path = [];
		else {
			obj.path.unshift({ ...obj.position });
			if (obj.path.length > 24) obj.path.pop();
		}
		
		if (obj.alive === false || obj.isAlive === false) {
			extinguish(obj);
			return;
		};
		if (obj.path === undefined || obj.path.length < 2) return;

		//
		// Outer flame
		//
		
		// Basic vars
		let parentPos = obj.position;
		let path = obj.path;
		function r(point) { let pos = rotatePoint({ x: point.x - parentPos.x, y: point.y - parentPos.y}, angle); pos.x += parentPos.x; pos.y += parentPos.y; return pos; }
		function rOpp(point) { let pos = rotatePoint({ x: point.x - parentPos.x, y: point.y - parentPos.y}, -angle); pos.x += parentPos.x; pos.y += parentPos.y; return pos; }

		// Get points
		let circleRadius = obj.radius || obj.circleRadius;
		let radius = circleRadius + Math.min(vw * 0.04, circleRadius * 0.15);
		let pt2 = path[Math.min(Math.round(2), path.length - 1)];
		let pt3 = path[Math.min(Math.round(4), path.length - 1)];
		if (!pt2 || !pt3) return;

		// Get angles
		let angle = Math.atan2(pt3.x - parentPos.x, pt3.y - parentPos.y) * -1 + Math.PI;

		// Make points
		let pos = {
			left: { x: parentPos.x - radius, y: parentPos.y },
			right: { x: parentPos.x + radius, y: parentPos.y },
			top: { x: parentPos.x, y: parentPos.y - radius },
			bottom: { x: parentPos.x, y: parentPos.y + radius }
		};

		
		// Move top to show movement
		let movement = Math.hypot(path[0].x - path[1].x, path[0].y - path[1].y);
		if (movement > 0) {
			pos.top = rOpp({ ...pt3 });
		}

		let curveAmount = 0.55; // 0.55
		let curves = {
			left: [
				{ x: pos.left.x, y: pos.left.y - radius * curveAmount },
				{ x: pos.left.x, y: pos.left.y + radius * curveAmount },
			],
			right: [
				{ x: pos.right.x, y: pos.right.y - radius * curveAmount },
				{ x: pos.right.x, y: pos.right.y + radius * curveAmount },
			],
			top: [
				{ x: pos.top.x - radius * curveAmount, y: pos.top.y },
				{ x: pos.top.x + radius * curveAmount, y: pos.top.y },
			],
			bottom: [
				{ x: pos.bottom.x + radius * curveAmount, y: pos.bottom.y },
				{ x: pos.bottom.x - radius * curveAmount, y: pos.bottom.y },
			],
		};

		if (movement > 0) {
			let curve = Math.atan2(pt3.x - pt2.x, pt3.y - pt2.y) * -1 + Math.PI/2;
			curves.top[0] = { ...pt2 };
			curves.top[1] = { ...pt2 };


			let dist = ((pt2.x - parentPos.x)*Math.cos(-curve - Math.PI/2) - (pt2.y - parentPos.y)*Math.sin(-curve - Math.PI/2)) * 0.75;
			
			curves.top[0].x += Math.cos(curve) * radius + Math.cos(curve + Math.PI/2) * dist;
			curves.top[0].y += Math.sin(curve) * radius + Math.sin(curve + Math.PI/2) * dist;

			curves.top[1] = curves.top[0];

			curves.top[0].x += Math.cos(curve + Math.PI/2) * radius;
			curves.top[0].y += Math.sin(curve + Math.PI/2) * radius;

			curves.top[1].y += Math.sin(curve - Math.PI/2) * radius;
			curves.top[1].x += Math.cos(curve - Math.PI/2) * radius;
		}
		else {
			curves.top[0] = r(curves.top[0]);
			curves.top[1] = r(curves.top[1]);
		}


		// Rotate points
		pos.left = r(pos.left);
		pos.right = r(pos.right);
		pos.top = r(pos.top);
		pos.bottom = r(pos.bottom);
		
		curves.left[0] = r(curves.left[0]);
		curves.left[1] = r(curves.left[1]);
		curves.right[0] = r(curves.right[0]);
		curves.right[1] = r(curves.right[1]);
		curves.bottom[0] = r(curves.bottom[0]);
		curves.bottom[1] = r(curves.bottom[1]);

		//
		// Draw 
		//
		fireCtx.beginPath();
		fireCtx.moveTo(pos.left.x, pos.left.y);

		fireCtx.bezierCurveTo(curves.left[0].x, curves.left[0].y, curves.top[0].x, curves.top[0].y, pos.top.x, pos.top.y);
		fireCtx.bezierCurveTo(curves.top[1].x, curves.top[1].y, curves.right[0].x, curves.right[0].y, pos.right.x, pos.right.y);
		fireCtx.bezierCurveTo(curves.right[1].x, curves.right[1].y, curves.bottom[0].x, curves.bottom[0].y, pos.bottom.x, pos.bottom.y);
		fireCtx.bezierCurveTo(curves.bottom[1].x, curves.bottom[1].y, curves.left[1].x, curves.left[1].y, pos.left.x, pos.left.y);

		// Bloom
		/*
		if (movement > vw * 0.05) {
			fireCtx.shadowColor = obj.render.fireOutside || "#FF7A00";
			fireCtx.shadowBlur = 5;
		}/** */

		fireCtx.closePath();
		fireCtx.fillStyle = obj.render.fireOutside || "#FF7A00";
		fireCtx.fill();
		
		// More Bloom
		/*
		if (movement > vw * 0.05) {
        	fireCtx.shadowColor = "transparent";
			fireCtx.shadowBlur = 0;
		}/** */

		if (obj.fireInner !== "transparent") {
			// Inner section
			let scale = 0.55;
			if (movement < vw*0.03) scale = 0.7;
			let midpt = { ...pos.bottom };
			function scl(pt) {
				pt.x -= midpt.x;
				pt.y -= midpt.y;
	
				pt.x *= scale;
				pt.y *= scale;
				
				if (movement >= 0.03) {
					pt.x += midpt.x + (Math.cos(angle - Math.PI * 0.5) * vw * 0.1);
					pt.y += midpt.y + (Math.sin(angle - Math.PI * 0.5) * vw * 0.1);
				}
				else {
					pt.x += midpt.x + Math.min(vw * 0.04, obj.circleRadius * 0.15)*Math.cos(angle - Math.PI/2);
					pt.y += midpt.y + Math.min(vw * 0.04, obj.circleRadius * 0.15)*Math.sin(angle - Math.PI/2);
				}
	
				return pt;
			}
			
			fireCtx.beginPath();
			
			pos.left = scl(pos.left);
			pos.right = scl(pos.right);
			pos.top = pt2;
			pos.bottom = scl(pos.bottom);
	
			curves.left[0] = scl(curves.left[0]);
			curves.left[1] = scl(curves.left[1]);
			curves.right[0] = scl(curves.right[0]);
			curves.right[1] = scl(curves.right[1]);
			curves.top[0] = scl(curves.top[0]);
			curves.top[1] = scl(curves.top[1]);
			curves.bottom[0] = scl(curves.bottom[0]);
			curves.bottom[1] = scl(curves.bottom[1]);
	
			fireCtx.moveTo(pos.left.x, pos.left.y);
			fireCtx.bezierCurveTo(curves.left[0].x, curves.left[0].y, curves.top[0].x, curves.top[0].y, pos.top.x, pos.top.y);
			fireCtx.bezierCurveTo(curves.top[1].x, curves.top[1].y, curves.right[0].x, curves.right[0].y, pos.right.x, pos.right.y);
			fireCtx.bezierCurveTo(curves.right[1].x, curves.right[1].y, curves.bottom[0].x, curves.bottom[0].y, pos.bottom.x, pos.bottom.y);
			fireCtx.bezierCurveTo(curves.bottom[1].x, curves.bottom[1].y, curves.left[1].x, curves.left[1].y, pos.left.x, pos.left.y);/**/
	
			fireCtx.closePath();
			fireCtx.fillStyle = obj.render.fireInside || "#FFBE83";
			fireCtx.fill();
		}

	});

	requestAnimationFrame(burn);
}