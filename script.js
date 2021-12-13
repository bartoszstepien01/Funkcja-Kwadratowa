import { Graph, Function } from "./Graph.js";

let graph = new Graph(document.querySelector("canvas"));

let form = document.querySelector("form");
let functionsContainer = document.querySelector(".functions-container");

let empty = true;

form.onsubmit = (e) => {
	if(empty) {
		empty = false;
		functionsContainer.innerHTML = "";
	}

	let func = new Function(form.elements["a"].value, form.elements["b"].value, form.elements["c"].value, form.elements["colour"].value);
	let element = func.createElement();

	let removeFunction = graph.addFunction(func);
	element.querySelector("button").onclick = () => {
		removeFunction();
		functionsContainer.removeChild(element);

		if(functionsContainer.children.length == 0) {
			empty = true;
			functionsContainer.innerHTML = `<p>Nie dodano żadnej funkcji</p>`;
		}
	};

	functionsContainer.appendChild(element);

	e.preventDefault();
};

let colourInput = document.querySelector('input[name="colour"]');
let addFunction = document.querySelector(".add-function");

colourInput.oninput = (e) => addFunction.style.setProperty("--colour", e.target.value);;