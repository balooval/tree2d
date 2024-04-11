
export default `
varying vec3 vFinalColor;

void main() {
    gl_FragColor = vec4(vFinalColor.xyz, 1.0);
}`;
