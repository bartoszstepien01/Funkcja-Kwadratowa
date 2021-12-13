let dragging = false;

window.onmousedown = () => dragging = true;
window.onmouseup = () => dragging = false;
		
let previousX = 0;
let previousY = 0;
		
window.onmousemove = (e) => {
	if(dragging) {
		let event = new CustomEvent("drag", { detail: { x: e.offsetX - previousX, y: e.offsetY - previousY } });
		document.dispatchEvent(event);
	}

	previousX = e.offsetX;
	previousY = e.offsetY;
};

export class Function {
	constructor(a, b, c, colour="#ff0000") {
		this.a = (parseFloat(a) || 0);
		this.b = (parseFloat(b) || 0);
		this.c = (parseFloat(c) || 0);
		this.colour = colour;
	}

	result(x) {
		return this.a * x ** 2 + this.b * x + this.c; 
	}

	createElement() {
		let template = document.createElement("template");
		let equation = "";

		equation += this.a != 0 ? `${this.a == 1 || this.a == -1 ? this.a.toString().replaceAll("1", "") : this.a}x<sup>2</sup> ` : "";
		equation += this.b != 0 ? `${equation != "" ? (this.b > 0 ? "+ " : "- ") : (this.b < 0 ? "-" : "")}${this.b == 1 || this.b == -1 ? Math.abs(this.b).toString().replaceAll("1", "") : Math.abs(this.b)}x ` : "";
		equation += equation != "" ? (this.c != 0 ? `${this.c > 0 ? "+" : "-"} ${Math.abs(this.c)}` : "") : this.c;

		// !!!Vulnerable to XSS!!!
		template.innerHTML = `
			<div class="functions-container">
				<div class="function" style="--colour: ${ this.colour };">
					<div class="function-equation">
						<p>
							${equation}
						</p>
					</div>
					<div class="function-square">
						<button class="remove">Usuń</button>
					</div>
				</div>
			</div>
		`.trim();

		return template.content.firstChild;
	}
}

export class Graph {
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");

		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		this.zoom = 1;
		this.offsetX = 0;
		this.offsetY = 0;

		this.mouseIn = false;

		this.canvas.onmouseenter = () => this.mouseIn = true;
		this.canvas.onmouseout = () => this.mouseIn = false;

		window.onresize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;

			this.ctx.font = "15px Montserrat";

			this.draw();
		};

		window.onwheel = (e) => {
			if(!this.mouseIn) return;

			let oldZoom = this.zoom;
		
			this.zoom += e.deltaY * -0.001;
			this.zoom = Math.round(this.zoom * 10) / 10;

			this.zoom = Math.min(10, this.zoom);
			this.zoom = Math.max(0.2, this.zoom);
		
			// Calculates offset based on mouse position
			this.offsetX = (e.pageX - this.canvas.width / 2) + (this.offsetX - e.pageX + this.canvas.width / 2) * this.zoom / oldZoom;
			this.offsetY = (e.pageY - this.canvas.height / 2) + (this.offsetY - e.pageY + this.canvas.height / 2) * this.zoom / oldZoom;

			this.draw();
		}

		document.addEventListener("drag", (e) => {
			if(!this.mouseIn) return;

			this.offsetX += e.detail.x;
			this.offsetY += e.detail.y;

			this.draw();
		});

		this.ctx.font = "15px Montserrat";

		this.functions = [];
		this.draw();
	}

	drawGrid() {
		let middleX = this.canvas.width / 2 + this.offsetX;
		let middleY = this.canvas.height / 2 + this.offsetY;

		this.ctx.lineWidth = 1;
		this.ctx.fillStyle = "#ffffff";
		this.ctx.strokeStyle = "#dcdcdc";

		// Clear canvas
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Draw grid
		this.ctx.beginPath();

		let gap = 100 / ( this.zoom >= 1 ? Math.round(this.zoom) : 0.5 / (2 - Math.round(this.zoom)));
		let step = gap / 100;

		for(let y = middleY + gap * this.zoom; y < this.canvas.height; y += gap * this.zoom) {
			this.ctx.moveTo(0, y);
			this.ctx.lineTo(this.canvas.width, y);
		}

		for(let y = middleY - gap * this.zoom; y > 0; y -= gap * this.zoom) {
			this.ctx.moveTo(0, y);
			this.ctx.lineTo(this.canvas.width, y);
		}

		for(let x = middleX + gap * this.zoom; x < this.canvas.width; x += gap * this.zoom) {
			this.ctx.moveTo(x, 0);
			this.ctx.lineTo(x, this.canvas.height);
		}

		for(let x = middleX - gap * this.zoom; x > 0; x -= gap * this.zoom) {
			this.ctx.moveTo(x, 0);
			this.ctx.lineTo(x, this.canvas.height);
		}

		this.ctx.stroke();
		this.ctx.closePath();

		// Draw axes
		this.ctx.beginPath();

		this.ctx.strokeStyle = "#000000";

		this.ctx.moveTo(middleX, 0);
		this.ctx.lineTo(middleX, this.canvas.height);

		this.ctx.moveTo(0, middleY);
		this.ctx.lineTo(this.canvas.width, middleY);

		this.ctx.stroke();
		this.ctx.closePath();

		// Draw labels
		this.ctx.fillStyle = "#000000";

		this.ctx.textAlign = "left";

		let x = middleX > this.canvas.width || middleX < 0 ? 20: middleX + 20;

		for(let i = 0; middleY - i * gap * this.zoom > 0; i++)
			this.ctx.fillText(Math.round((i + 1) * step * 100) / 100, x, middleY - gap * this.zoom - i * gap * this.zoom + 5);

		for(let i = 0; i * gap * this.zoom < this.canvas.height - this.offsetY; i++)
			this.ctx.fillText(Math.round(-(i + 1) * step * 100) / 100, x, middleY + gap * this.zoom + i * gap * this.zoom + 5);
		
		this.ctx.textAlign = "center";

		let y = middleY > this.canvas.height || middleY < 0 ? this.canvas.height - 25 : middleY + 25;

		for(let i = 0; middleX - i * gap * this.zoom > 0; i++)
			this.ctx.fillText(Math.round(-(i + 1) * step * 100) / 100, middleX - gap * this.zoom - i * gap * this.zoom, y);

		for(let i = 0; i * gap * this.zoom < this.canvas.width - this.offsetX; i++)
			this.ctx.fillText(Math.round((i + 1) * step * 100) / 100, middleX + gap * this.zoom + i * gap * this.zoom, y);
	}

	addFunction(func) {
		this.functions.push(func);

		this.drawFunctions();

		// This monstrosity has been written due to my lack of ideas how to handle removing functions from the chart
		// God, please forgive me for what I have done.
		// Amen.
		let index = this.functions.length - 1;
		return () => {
			delete this.functions[index];
			this.draw();
		}
	}

	drawFunctions() {
		this.ctx.lineWidth = 5;

		this.functions.forEach(func => {
			this.ctx.strokeStyle = func.colour;

			this.ctx.beginPath();

			let max = Math.ceil(this.canvas.width / 100 / this.zoom);
			let step = 1 / ( this.zoom >= 1 ? Math.round(this.zoom) : 0.5 / (2 - Math.round(this.zoom))) / 10;

			for(let i = -max - Math.ceil(this.offsetX / 100 / this.zoom); i <= max - Math.ceil(this.offsetX / 100 / this.zoom); i += step)
			{
				this.ctx.moveTo(this.canvas.width / 2 + i * 100 * this.zoom + this.offsetX, this.canvas.height / 2 - func.result(i) * 100 * this.zoom + this.offsetY);
				this.ctx.lineTo(this.canvas.width / 2 + (i - step) * 100 * this.zoom + this.offsetX, this.canvas.height / 2 - func.result(i - step) * 100 * this.zoom + this.offsetY);
			}

			this.ctx.stroke();
			this.ctx.closePath();
		});
	}

	draw() {
		this.drawGrid();
		this.drawFunctions();
	}
}