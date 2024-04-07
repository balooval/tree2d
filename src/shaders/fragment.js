
export default `
varying vec3 vUv;
varying vec3 vInstanceColor;

void main() {
    gl_FragColor = vec4(vInstanceColor.xyz, 1.0);
}`;
