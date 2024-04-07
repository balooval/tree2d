
export default `
uniform float time;
varying vec3 vUv;
varying vec3 vInstanceColor;

void main() {
    vUv = position; 
    vInstanceColor = instanceColor; 

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);


    // float delta = time * 0.3;
    // vec3 p = position.xyz;
    // p.x = p.x + cos(delta) * 0.2;
    // p.y = p.y + sin(delta) * 0.2;

    // gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(p.xyz, 1.0);
}`;
