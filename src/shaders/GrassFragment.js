import Colors from './Colors.js';

export default `
varying vec3 vUv;
varying vec3 vInstanceColor;
varying float distanceFromGround;
uniform float time;

${Colors}

void main() {
    vec3 hsl = rgb2hsl(vInstanceColor);
    hsl.x -= 0.01;
    hsl.y += 0.10;
    //hsl.y += 0.3 - clamp(hsl.z * distanceFromGround * 0.01, 0.3, 0.5);
    hsl.z = clamp(hsl.z * distanceFromGround * 0.065, 0.35, 0.5);
    vec3 rgb = hsl2rgb(hsl);

    gl_FragColor = vec4(rgb.xyz, 1.0);
}`;
