import PerlinNoise from './PerlinNoise.js';
import Colors from './Colors.js';

export default `
varying vec2 noiseUv;
varying vec2 vUv;
varying vec3 vColor;

${PerlinNoise}

${Colors}

void main() {

    // gl_FragColor = vec4(vDirection.x, vDirection.y, 0.0, 1.0);


    float scale = 2.0;
    float horPos = scale - (abs((vUv.x - 0.5) * 2.0) * scale);
    float variation = cos(vUv.y * 8.0) * 0.1;
    horPos -= variation;
    
    horPos = clamp(horPos, 0.0, 1.0);

    if (horPos < 0.05) {
        discard;
    }

    // gl_FragColor = vec4(1.0, 0.0, 0.0, horPos);
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

    
    vec2 noiseUv = vec2(noiseUv.x, noiseUv.y);
    
    float noiseA = perlinNormalized(noiseUv * 0.01);
    float noiseB = perlinNormalized(noiseUv * 0.07);
    float noiseC = perlinNormalized(noiseUv * 0.1);
    
    float noise = noiseA;
    noise *= noiseB;
    noise += noiseC;
    
    vec3 hsl = rgb2hsl(vColor);
    hsl.z *= noise;

    hsl.s *= (horPos + 0.5);
    hsl.z *= (horPos + 0.5);

    float minimumLight = 0.3;

    vec3 rgb = hsl2rgb(hsl);
    
    gl_FragColor = vec4(rgb.xyz, 1.0);
}`;
