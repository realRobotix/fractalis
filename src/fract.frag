#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColor;
uniform int uAntialias;
uniform int uIterations;
uniform vec2 uPosition;
uniform float uZoom;
uniform int uType;
out vec4 fragColor;

vec3 hsv2rgb(vec3 c){
    vec4 K=vec4(1.,2./3.,1./3.,3.);
    vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);
    return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);
}

vec3 channel_mix(vec3 a,vec3 b,vec3 w){
    return vec3(mix(a.r,b.r,w.r),mix(a.g,b.g,w.g),mix(a.b,b.b,w.b));
}

float gaussian(float z,float u,float o){
    return(1./(o*sqrt(2.*3.1415)))*exp(-(((z-u)*(z-u))/(2.*(o*o))));
}

vec3 overlay(vec3 a,vec3 b,float w){
    return mix(a,channel_mix(
        2.*a*b,
        vec3(1.)-2.*(vec3(1.)-a)*(vec3(1.)-b),
        step(vec3(.5),a)
    ),w);
}

float mandelbrot(vec2 c){
    vec2 z = vec2(0.0);
    for(int i=0;i<=uIterations;i++){
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        if(dot(z, z) > 4.0) return float(i) / float(uIterations);
    }
    return 0.0;
}

float julia(vec2 c){
    vec2 z = c;
    vec2 k = vec2(0.355, 0.355);
    for(int i = 0; i <= uIterations; i++){
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + k;
        if(dot(z, z) > 4.0) return float(i) / float(uIterations);
    }
    return 0.0;
}

vec2 scale(vec2 uv, vec2 resolution, float zoom, vec2 offset) {
    float aspectRatio = resolution.x / resolution.y;
    return vec2(
        (uv.x - 0.5) * zoom * aspectRatio + offset.x,
        (uv.y - 0.5) * zoom + offset.y
    );
}

void main(){
    vec2 uv=gl_FragCoord.xy/uResolution.xy;

    float value=0.;

    for(int x=0;x < uAntialias;x++){
        for(int y=0;y < uAntialias;y++){
            vec2 p=(gl_FragCoord.xy+(vec2(x,y)/float(uAntialias)))/uResolution.xy;
            vec2 scaled = scale(p, uResolution.xy, uZoom, -uPosition);

            if(uType == 1){
                value += julia(scaled);
            } else {
                value += mandelbrot(scaled);
            }
        }
    }
    value/=float(uAntialias*uAntialias);

    vec4 color = vec4(uColor*value, 1.0);
    // add film grain
    
    float variance=.8;
    float t=uTime*.5;
    float grainSeed=dot(uv,vec2(12.9898,78.233));
    float noise=fract(sin(grainSeed)*43758.5453+t*2.);
    noise=gaussian(noise,0.,variance*variance);
    
    float w=.1;
    
    vec3 grain=vec3(noise)*(1.-color.rgb);
    
    color.rgb=overlay(color.rgb,grain,w);
    
    //color = vec4(vec3(noise), 1.0);
    fragColor = color;
    //fragColor=color*min(iTime,1.);
    //fragColor=vec4(vec3(mandelbrot(mandelbrotUV)),1.);
}
