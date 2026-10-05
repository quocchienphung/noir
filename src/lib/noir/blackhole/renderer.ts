import { COMPOSITE_FRAG, DOWN_FRAG, FULLSCREEN_VERT, PREFILTER_FRAG, TRACE_FRAG, UP_FRAG } from "./shaders";

export interface DiskLook {
  inner: number;
  outer: number;
  gain: number;
  doppler: number;
  flow: number;
  hot: [number, number, number];
  warm: [number, number, number];
  cool: [number, number, number];
}

export interface FrameParams {
  camPos: [number, number, number];
  /** Column-major 3×3 basis: right, up, forward. */
  basis: Float32Array;
  tanHalfFov: number;
  time: number;
  steps: number;
  disk: DiskLook;
  exposure: number;
  bloomGain: number;
  bloomThreshold: number;
  fade: number;
  grain: number;
  starGain: number;
}

interface Target {
  fb: WebGLFramebuffer;
  tex: WebGLTexture;
  w: number;
  h: number;
}

type Uniforms = Record<string, WebGLUniformLocation | null>;

interface Program {
  prog: WebGLProgram;
  u: Uniforms;
}

const BLOOM_LEVELS = 5;

/** Deterministic PRNG so the noise texture (and therefore the disk) looks the same on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * WebGL2 renderer: ray-traced Schwarzschild black hole into an HDR target, five-level bloom, ACES composite.
 * The caller owns the animation loop and passes a complete camera/look description per frame.
 */
export class BlackHoleRenderer {
  readonly gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject;
  private vbo: WebGLBuffer;
  private noise: WebGLTexture;
  private trace: Program;
  private prefilter: Program;
  private down: Program;
  private up: Program;
  private composite: Program;
  private scene: Target | null = null;
  private bloom: Target[] = [];
  private hdr: boolean;
  width = 0;
  height = 0;

  static create(canvas: HTMLCanvasElement): BlackHoleRenderer | null {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) return null;
    try {
      return new BlackHoleRenderer(gl);
    } catch (e) {
      console.warn("[noir] black hole renderer unavailable:", e);
      return null;
    }
  }

  private constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.hdr = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");

    this.trace = this.program(TRACE_FRAG, [
      "uRes", "uTime", "uCamPos", "uCamBasis", "uTanHalfFov", "uNoise", "uSteps", "uDiskIn", "uDiskOut",
      "uDiskGain", "uDoppler", "uFlow", "uHot", "uWarm", "uCool", "uStarGain",
    ]);
    this.prefilter = this.program(PREFILTER_FRAG, ["uSrc", "uTexel", "uThreshold"]);
    this.down = this.program(DOWN_FRAG, ["uSrc", "uTexel"]);
    this.up = this.program(UP_FRAG, ["uSrc", "uTexel", "uRadius"]);
    this.composite = this.program(COMPOSITE_FRAG, [
      "uScene", "uBloom", "uExposure", "uBloomGain", "uFade", "uTime", "uGrain", "uRes",
    ]);

    // one oversized triangle covering the viewport
    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    if (!vao || !vbo) throw new Error("buffer allocation failed");
    this.vao = vao;
    this.vbo = vbo;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    for (const p of [this.trace, this.prefilter, this.down, this.up, this.composite]) {
      const loc = gl.getAttribLocation(p.prog, "aPos");
      if (loc >= 0) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      }
    }
    gl.bindVertexArray(null);

    this.noise = this.makeNoise();
  }

  private compile(type: number, src: string) {
    const gl = this.gl;
    const sh = gl.createShader(type);
    if (!sh) throw new Error("shader allocation failed");
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error(`shader compile failed: ${log}`);
    }
    return sh;
  }

  private program(frag: string, uniforms: string[]): Program {
    const gl = this.gl;
    const vs = this.compile(gl.VERTEX_SHADER, FULLSCREEN_VERT);
    const fs = this.compile(gl.FRAGMENT_SHADER, frag);
    const prog = gl.createProgram();
    if (!prog) throw new Error("program allocation failed");
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`link failed: ${gl.getProgramInfoLog(prog)}`);
    const u: Uniforms = {};
    for (const name of uniforms) u[name] = gl.getUniformLocation(prog, name);
    return { prog, u };
  }

  private makeNoise() {
    const gl = this.gl;
    const size = 256;
    const rand = mulberry32(0x6e6f6972); // "noir"
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < data.length; i++) data[i] = Math.floor(rand() * 256);
    const tex = gl.createTexture();
    if (!tex) throw new Error("texture allocation failed");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    return tex;
  }

  private target(w: number, h: number): Target {
    const gl = this.gl;
    const tex = gl.createTexture();
    const fb = gl.createFramebuffer();
    if (!tex || !fb) throw new Error("target allocation failed");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (this.hdr) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE && this.hdr) {
      // Half-float render targets unsupported after all: fall back to 8-bit.
      this.hdr = false;
      gl.deleteTexture(tex);
      gl.deleteFramebuffer(fb);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return this.target(w, h);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex, w, h };
  }

  private freeTargets() {
    const gl = this.gl;
    for (const t of [this.scene, ...this.bloom]) {
      if (!t) continue;
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fb);
    }
    this.scene = null;
    this.bloom = [];
  }

  /** Sets the drawing-buffer size (device pixels after the caller's render scale). */
  resize(w: number, h: number) {
    w = Math.max(16, Math.round(w));
    h = Math.max(16, Math.round(h));
    if (w === this.width && h === this.height && this.scene) return;
    const canvas = this.gl.canvas as HTMLCanvasElement;
    canvas.width = w;
    canvas.height = h;
    this.width = w;
    this.height = h;
    this.freeTargets();
    this.scene = this.target(w, h);
    let bw = w;
    let bh = h;
    for (let i = 0; i < BLOOM_LEVELS; i++) {
      bw = Math.max(4, Math.floor(bw / 2));
      bh = Math.max(4, Math.floor(bh / 2));
      this.bloom.push(this.target(bw, bh));
    }
  }

  private pass(p: Program, dst: Target | null, w: number, h: number) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fb : null);
    gl.viewport(0, 0, w, h);
    gl.useProgram(p.prog);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private bind(unit: number, tex: WebGLTexture, loc: WebGLUniformLocation | null) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(loc, unit);
  }

  render(f: FrameParams) {
    const gl = this.gl;
    const scene = this.scene;
    if (!scene || gl.isContextLost()) return;
    gl.disable(gl.BLEND);

    // 1. ray trace
    const t = this.trace;
    gl.useProgram(t.prog);
    gl.uniform2f(t.u.uRes, scene.w, scene.h);
    gl.uniform1f(t.u.uTime, f.time);
    gl.uniform3f(t.u.uCamPos, f.camPos[0], f.camPos[1], f.camPos[2]);
    gl.uniformMatrix3fv(t.u.uCamBasis, false, f.basis);
    gl.uniform1f(t.u.uTanHalfFov, f.tanHalfFov);
    gl.uniform1i(t.u.uSteps, f.steps);
    gl.uniform1f(t.u.uDiskIn, f.disk.inner);
    gl.uniform1f(t.u.uDiskOut, f.disk.outer);
    gl.uniform1f(t.u.uDiskGain, f.disk.gain);
    gl.uniform1f(t.u.uDoppler, f.disk.doppler);
    gl.uniform1f(t.u.uFlow, f.disk.flow);
    gl.uniform3fv(t.u.uHot, f.disk.hot);
    gl.uniform3fv(t.u.uWarm, f.disk.warm);
    gl.uniform3fv(t.u.uCool, f.disk.cool);
    gl.uniform1f(t.u.uStarGain, f.starGain);
    this.bind(0, this.noise, t.u.uNoise);
    this.pass(t, scene, scene.w, scene.h);

    // 2. bloom: prefilter → downsample chain → additive upsample chain
    const b = this.bloom;
    gl.useProgram(this.prefilter.prog);
    gl.uniform2f(this.prefilter.u.uTexel, 1 / scene.w, 1 / scene.h);
    gl.uniform1f(this.prefilter.u.uThreshold, f.bloomThreshold);
    this.bind(0, scene.tex, this.prefilter.u.uSrc);
    this.pass(this.prefilter, b[0], b[0].w, b[0].h);
    for (let i = 1; i < b.length; i++) {
      gl.useProgram(this.down.prog);
      gl.uniform2f(this.down.u.uTexel, 1 / b[i - 1].w, 1 / b[i - 1].h);
      this.bind(0, b[i - 1].tex, this.down.u.uSrc);
      this.pass(this.down, b[i], b[i].w, b[i].h);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = b.length - 1; i > 0; i--) {
      gl.useProgram(this.up.prog);
      gl.uniform2f(this.up.u.uTexel, 1 / b[i].w, 1 / b[i].h);
      gl.uniform1f(this.up.u.uRadius, 1.0);
      this.bind(0, b[i].tex, this.up.u.uSrc);
      this.pass(this.up, b[i - 1], b[i - 1].w, b[i - 1].h);
    }
    gl.disable(gl.BLEND);

    // 3. composite to the canvas
    const c = this.composite;
    gl.useProgram(c.prog);
    gl.uniform1f(c.u.uExposure, f.exposure);
    gl.uniform1f(c.u.uBloomGain, f.bloomGain);
    gl.uniform1f(c.u.uFade, f.fade);
    gl.uniform1f(c.u.uTime, f.time);
    gl.uniform1f(c.u.uGrain, f.grain);
    gl.uniform2f(c.u.uRes, this.width, this.height);
    this.bind(0, scene.tex, c.u.uScene);
    this.bind(1, b[0].tex, c.u.uBloom);
    this.pass(c, null, this.width, this.height);
  }

  dispose() {
    const gl = this.gl;
    this.freeTargets();
    gl.deleteTexture(this.noise);
    for (const p of [this.trace, this.prefilter, this.down, this.up, this.composite]) gl.deleteProgram(p.prog);
    gl.deleteBuffer(this.vbo);
    gl.deleteVertexArray(this.vao);
  }
}

/** Builds a camera basis (column-major right/up/forward) looking from `eye` at `target`, rolled by `roll` rad. */
export function lookAt(eye: [number, number, number], target: [number, number, number], roll = 0): Float32Array {
  const f = norm(sub(target, eye));
  // roll about the forward axis: rotate the reference up vector around f
  let r = norm(cross(f, [0, 1, 0]));
  let u = cross(r, f);
  if (roll !== 0) {
    const c = Math.cos(roll);
    const s = Math.sin(roll);
    const r2: [number, number, number] = [r[0] * c + u[0] * s, r[1] * c + u[1] * s, r[2] * c + u[2] * s];
    const u2: [number, number, number] = [u[0] * c - r[0] * s, u[1] * c - r[1] * s, u[2] * c - r[2] * s];
    r = r2;
    u = u2;
  }
  return new Float32Array([r[0], r[1], r[2], u[0], u[1], u[2], f[0], f[1], f[2]]);
}

function sub(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function cross(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function norm(a: [number, number, number]): [number, number, number] {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
