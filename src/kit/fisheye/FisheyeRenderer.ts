/**
 * FisheyeRenderer — 基于 WebGL 的屏摄鱼眼畸变 + 摩尔纹 + 暗角 + 弯曲荧光标注渲染器。
 * 改编自浙大猫学长开源项目 vibe-motion/fisheye-motion，提供 TypeScript 类型支持。
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uTex;
uniform float uAspect;
uniform vec2  uFocus;
uniform float uStrength;
uniform float uZoom;
uniform float uMoireIntensity;
uniform float uMoireScale;
uniform float uMoireAngle;
uniform float uVignette;
uniform float uVignetteRadius;
uniform float uVignetteSoft;

#define MAX_RECTS 8
uniform int   uRectCount;
uniform vec4  uRects[MAX_RECTS];
uniform vec4  uRectColors[MAX_RECTS];
uniform float uRectBlends[MAX_RECTS];
uniform float uRectMasks[MAX_RECTS];

void main() {
  vec2 p = vUv - uFocus;
  p.x *= uAspect;
  float r2 = dot(p, p);
  vec2 pd = p * (1.0 + uStrength * r2) / uZoom;
  pd.x /= uAspect;
  vec2 suv = uFocus + pd;

  vec3 col;
  bool inside = suv.x >= 0.0 && suv.x <= 1.0 && suv.y >= 0.0 && suv.y <= 1.0;
  if (inside) {
    col = texture2D(uTex, suv).rgb;
  } else {
    vec2 cuv = clamp(suv, 0.0, 1.0);
    float over = length(suv - cuv) * 12.0;
    col = texture2D(uTex, cuv).rgb * max(0.0, 1.0 - over);
  }

  for (int i = 0; i < MAX_RECTS; i++) {
    if (i >= uRectCount) break;
    vec4 rc = uRects[i];
    if (inside &&
        suv.x >= rc.x && suv.x <= rc.x + rc.z * uRectMasks[i] &&
        suv.y >= rc.y && suv.y <= rc.y + rc.w) {
      vec3 mark = uRectColors[i].rgb;
      float mode = uRectBlends[i];
      vec3 blended;
      if (mode < 0.5)      blended = mark;
      else if (mode < 1.5) blended = col * mark;
      else if (mode < 2.5) blended = 1.0 - (1.0 - col) * (1.0 - mark);
      else                 blended = max(col, mark);
      col = mix(col, blended, uRectColors[i].a);
    }
  }

  float s = sin(uMoireAngle), c = cos(uMoireAngle);
  float srcCoord = -s * suv.x * uAspect + c * suv.y;
  float scrCoord = -s * vUv.x * uAspect + c * vUv.y;
  float l1 = sin(srcCoord * uMoireScale);
  float l2 = sin(scrCoord * uMoireScale * 1.045 + 1.3);
  float beat = 0.5 + 0.5 * l1 * l2;
  float fine = 0.5 + 0.5 * l1;
  float moire = mix(fine, beat, 0.65);
  col *= 1.0 - uMoireIntensity * moire;

  vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
  float d = length(q);
  float fall = smoothstep(uVignetteRadius - uVignetteSoft,
                          uVignetteRadius + uVignetteSoft, d);
  col *= 1.0 - uVignette * fall;

  gl_FragColor = vec4(col, 1.0);
}
`;

export type FisheyeBlendMode = 'normal' | 'multiply' | 'screen' | 'lighten';

export interface FisheyeRect {
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  opacity?: number;
  blend?: FisheyeBlendMode;
  mask?: number;
}

export interface FisheyeParams {
  strength: number;
  zoom: number;
  focus: { x: number; y: number };
  moire: { intensity: number; scale: number; angle: number };
  vignette: { amount: number; radius: number; softness: number };
  rects: FisheyeRect[];
}

export const DEFAULT_FISHEYE_PARAMS: FisheyeParams = {
  strength: 1.3,
  zoom: 1.25,
  focus: { x: 0.5, y: 0.5 },
  moire: { intensity: 0.22, scale: 850, angle: 0.08 },
  vignette: { amount: 0.78, radius: 0.72, softness: 0.45 },
  rects: [],
};

const MAX_RECTS = 8;
const BLEND_MODES: Record<FisheyeBlendMode, number> = {
  normal: 0,
  multiply: 1,
  screen: 2,
  lighten: 3,
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error('Failed to create shader');
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error('Shader compile error: ' + gl.getShaderInfoLog(sh));
  }
  return sh;
}

export class FisheyeRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private tex: WebGLTexture;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private source: HTMLImageElement | null = null;
  private params: FisheyeParams;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl', {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    const prog = gl.createProgram();
    if (!prog) throw new Error('Failed to create WebGL program');
    gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);
    this.prog = prog;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    if (!tex) throw new Error('Failed to create texture');
    this.tex = tex;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    for (const name of [
      'uAspect', 'uFocus', 'uStrength', 'uZoom',
      'uMoireIntensity', 'uMoireScale', 'uMoireAngle',
      'uVignette', 'uVignetteRadius', 'uVignetteSoft',
      'uRectCount', 'uRects[0]', 'uRectColors[0]', 'uRectBlends[0]', 'uRectMasks[0]',
    ]) {
      this.u[name.replace('[0]', '')] = gl.getUniformLocation(prog, name);
    }

    this.params = structuredClone(DEFAULT_FISHEYE_PARAMS);
  }

  setSource(source: HTMLImageElement) {
    this.source = source;
    const w = source.naturalWidth || source.width || 1;
    const h = source.naturalHeight || source.height || 1;
    const cap = 1600;
    const k = Math.min(1, cap / Math.max(w, h));
    this.canvas.width = Math.round(w * k);
    this.canvas.height = Math.round(h * k);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, source);
    this.render();
  }

  setParams(partial: Partial<FisheyeParams>) {
    const p = this.params;
    this.params = {
      ...p,
      ...partial,
      focus: { ...p.focus, ...(partial.focus || {}) },
      moire: { ...p.moire, ...(partial.moire || {}) },
      vignette: { ...p.vignette, ...(partial.vignette || {}) },
      rects: partial.rects !== undefined ? partial.rects : p.rects,
    };
    this.render();
  }

  render() {
    const { gl, u, params: p } = this;
    if (!this.source) return;
    gl.uniform1f(u.uAspect, this.canvas.width / Math.max(1, this.canvas.height));
    gl.uniform2f(u.uFocus, p.focus.x, 1 - p.focus.y);
    gl.uniform1f(u.uStrength, p.strength);
    gl.uniform1f(u.uZoom, p.zoom);
    gl.uniform1f(u.uMoireIntensity, p.moire.intensity);
    gl.uniform1f(u.uMoireScale, p.moire.scale);
    gl.uniform1f(u.uMoireAngle, p.moire.angle);
    gl.uniform1f(u.uVignette, p.vignette.amount);
    gl.uniform1f(u.uVignetteRadius, p.vignette.radius);
    gl.uniform1f(u.uVignetteSoft, p.vignette.softness);

    const rects = (p.rects || []).slice(0, MAX_RECTS);
    gl.uniform1i(u.uRectCount, rects.length);
    if (rects.length) {
      const geo = new Float32Array(MAX_RECTS * 4);
      const cols = new Float32Array(MAX_RECTS * 4);
      const blends = new Float32Array(MAX_RECTS);
      const masks = new Float32Array(MAX_RECTS);
      rects.forEach((r, i) => {
        geo.set([r.x, 1 - r.y - r.h, r.w, r.h], i * 4);
        const [cr, cg, cb] = hexToRgb(r.color || '#ffe200');
        cols.set([cr, cg, cb, r.opacity ?? 1], i * 4);
        blends[i] = BLEND_MODES[r.blend || 'multiply'];
        masks[i] = Math.min(1, Math.max(0, r.mask ?? 1));
      });
      gl.uniform4fv(u.uRects, geo);
      gl.uniform4fv(u.uRectColors, cols);
      gl.uniform1fv(u.uRectBlends, blends);
      gl.uniform1fv(u.uRectMasks, masks);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() {
    this.gl.deleteTexture(this.tex);
    this.gl.deleteProgram(this.prog);
    this.source = null;
  }
}
