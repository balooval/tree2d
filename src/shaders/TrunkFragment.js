import PerlinNoise from './PerlinNoise.js';
import Colors from './Colors.js';

export default `
varying vec2 noiseUv;
varying vec2 vUv;

${PerlinNoise}

${Colors}

void main() {

    // gl_FragColor = vec4(vDirection.x, vDirection.y, 0.0, 1.0);

    
    vec2 noiseUv = vec2(noiseUv.x, noiseUv.y);
    
    float noiseA = perlinNormalized(noiseUv * 0.01);
    float noiseB = perlinNormalized(noiseUv * 0.07);
    float noiseC = perlinNormalized(noiseUv * 0.1);
    
    float noise = noiseA;
    noise *= noiseB;
    noise += noiseC;
    
    vec3 hsl = vec3(0.1, 0.12, 0.38 * noise);

    float minimumLight = 0.3;

    if (vUv.x < 0.02 && hsl.z < minimumLight) {
        discard;
    }
    if (vUv.x > 0.98 && hsl.z < minimumLight) {
        discard;
    }

    vec3 rgb = hsl2rgb(hsl);
    

    gl_FragColor = vec4(rgb.xyz, 1.0);
}`;
