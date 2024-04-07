import {
	OrthographicCamera,
	Scene,
	Vector3,
	WebGLRenderer,
	PlaneGeometry,
	MeshBasicMaterial,
	Mesh,
	CanvasTexture,
	DoubleSide,
} from '../../vendor/three.module.js';
import * as BaseRender from './BaseRender.js';
export let renderer;
export let camera;
export let scene = null;
let canvas;
let ratio;
let texture2d;
let objectsToAdd = [];



export function init(destinationCanvas) {
    canvas = destinationCanvas;
    ratio = canvas.width / canvas.height;
    renderer = new WebGLRenderer({canvas: canvas, alpha: true, antialias: true});
	scene = new Scene();
	const width = BaseRender.getWorldWidth();
	camera = new OrthographicCamera(-100, 100, 100, -100, 1, 1000);
	changeScale()
	scene.add(camera);

	objectsToAdd.forEach(object => scene.add(object));
	objectsToAdd = [];
}

export function addToScene(object) {
	if (scene === null) {
		objectsToAdd.push(object);
		return;
	}

	scene.add(object);
}

export function changeScale() {
	const width = BaseRender.getWorldWidth();
	const height = width / ratio;
	camera.left = width / -2;
	camera.right = width / 2;
	camera.top = height / 2;
	camera.bottom = height / -2;
	const offsetY = height / 2;
	camera.position.set(0, offsetY, 100);
	camera.lookAt(new Vector3(0, offsetY, 0));
	camera.updateProjectionMatrix();
}

export function update() {
	if (document.hasFocus() === false) {
		return;
	}
	renderer.setRenderTarget(null);
	renderer.setClearColor(0x000000, 0);
	renderer.clear();
	renderer.render(scene, camera);
}

export function drawIntoContext(context) {
    context.drawImage(canvas, 0, 0);
}