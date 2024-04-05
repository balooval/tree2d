import {
	OrthographicCamera,
	Scene,
	Vector3,
	WebGLRenderer,

} from '../../vendor/three.module.js';
import * as BaseRender from './BaseRender.js';
export let renderer;
export let camera;
export let scene = null;
let canvas;


export function init(destinationCanvas) {
    canvas = destinationCanvas;
    const ratio = canvas.width / canvas.height;
    renderer = new WebGLRenderer({canvas: canvas, alpha: true, antialias: true});
	const offsets = BaseRender.getOffsets();
	const scale = BaseRender.getScale();
    // console.log('scale', scale);
    // console.log('offsets', offsets);
	const width = BaseRender.getWorldWidth();
	const height = width / ratio;
	camera = new OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 1000);
	window.onresize = function () {
		renderer.setSize(canvas.width, canvas.height);
		camera.aspect = ratio;
		camera.updateProjectionMatrix();
	};
	window.onresize();
	scene = new Scene();
	camera.position.set(0, offsets[1], 100);
	camera.lookAt(new Vector3(0, offsets[1], 0));
	scene.add(camera);
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