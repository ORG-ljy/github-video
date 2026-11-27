import React, { useEffect, useRef } from 'react';
import { random, useCurrentFrame } from 'remotion';

/**
 * 100% 程序化逐帧渲染的新海诚日漫风「深夜高架桥收费站」真动态动画（非静图缩放！）
 * - 飘动的暮色云层 + 闪烁的东京天际线窗灯
 * - 真 3D 透视高架桥与飞驰车流光轨（左侧 95% 畅通疾驰，右侧收费站真实堵车红灯闪烁）
 * - 斜落日漫雨丝与湿润路面反光
 */
export const LiveHighwayCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1920;
    const t = frame / 30;
    const vpX = W * 0.52;
    const vpY = H * 0.44;

    // 1. 暮色到深夜新海诚渐变天空
    const sky = ctx.createLinearGradient(0, 0, 0, vpY + 120);
    sky.addColorStop(0, '#050916');
    sky.addColorStop(0.55, '#0F1B38');
    sky.addColorStop(0.82, '#2B2B52');
    sky.addColorStop(1, '#6B3A5B');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 远景落日余晖光晕
    const glow = ctx.createRadialGradient(W * 0.25, vpY - 10, 10, W * 0.25, vpY - 10, 420);
    glow.addColorStop(0, 'rgba(255, 146, 92, 0.42)');
    glow.addColorStop(0.5, 'rgba(217, 95, 118, 0.16)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, vpY + 200);

    // 2. 缓慢飘动的日漫云层
    for (let i = 0; i < 7; i++) {
      const baseX = (random(`cloud-x-${i}`) * 1400 + t * (10 + i * 2.5)) % 1500 - 220;
      const baseY = 260 + random(`cloud-y-${i}`) * 340;
      const rx = 140 + random(`cloud-r-${i}`) * 130;
      const ry = 42 + random(`cloud-ry-${i}`) * 36;
      const cg = ctx.createRadialGradient(baseX, baseY, 10, baseX, baseY, rx);
      cg.addColorStop(0, 'rgba(130, 148, 198, 0.24)');
      cg.addColorStop(0.6, 'rgba(62, 74, 118, 0.16)');
      cg.addColorStop(1, 'rgba(15, 23, 48, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(baseX, baseY, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. 东京城市天际线剪影 + 闪烁窗灯
    const bldCount = 22;
    for (let i = 0; i < bldCount; i++) {
      const bw = 44 + Math.floor(random(`bw-${i}`) * 58);
      const bh = 110 + Math.floor(random(`bh-${i}`) * 260);
      const bx = i * 52 - 20;
      const by = vpY + 40 - bh;
      ctx.fillStyle = i % 2 === 0 ? '#0B1224' : '#111A33';
      ctx.fillRect(bx, by, bw, bh + 80);

      // 窗灯闪烁
      for (let wy = by + 16; wy < vpY + 10; wy += 18) {
        for (let wx = bx + 8; wx < bx + bw - 10; wx += 14) {
          const seed = random(`win-${i}-${wx}-${wy}`);
          if (seed > 0.62) {
            const twinkle = 0.55 + 0.45 * Math.sin(t * 2.5 + seed * 20);
            ctx.fillStyle = seed > 0.85
              ? `rgba(255, 209, 102, ${0.75 * twinkle})`
              : `rgba(147, 197, 253, ${0.5 * twinkle})`;
            ctx.fillRect(wx, wy, 7, 9);
          }
        }
      }
    }

    // 4. 真 3D 透视高架桥路面（从灭点延伸到屏幕底部）
    const roadTopL = vpX - 75;
    const roadTopR = vpX + 75;
    const roadBotL = -160;
    const roadBotR = W + 160;

    const roadGrad = ctx.createLinearGradient(0, vpY, 0, H);
    roadGrad.addColorStop(0, '#101522');
    roadGrad.addColorStop(0.45, '#151B2B');
    roadGrad.addColorStop(1, '#090D16');
    ctx.fillStyle = roadGrad;
    ctx.beginPath();
    ctx.moveTo(roadTopL, vpY);
    ctx.lineTo(roadTopR, vpY);
    ctx.lineTo(roadBotR, H);
    ctx.lineTo(roadBotL, H);
    ctx.closePath();
    ctx.fill();

    // 透视投影函数：z in [0..1] (0 = 灭点远处, 1 = 镜头底部), lane in [-1..1]
    const project = (z: number, lane: number) => {
      const zp = Math.pow(z, 2.05); // 真实透视非线性
      const y = vpY + zp * (H - vpY);
      const left = roadTopL + zp * (roadBotL - roadTopL);
      const right = roadTopR + zp * (roadBotR - roadTopR);
      const x = left + ((lane + 1) / 2) * (right - left);
      const scale = 0.14 + zp * 1.4;
      return { x, y, scale };
    };

    // 护栏发光边线
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.32)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(roadTopL, vpY);
    ctx.lineTo(roadBotL, H);
    ctx.moveTo(roadTopR, vpY);
    ctx.lineTo(roadBotR, H);
    ctx.stroke();

    // 飞驰向前的车道虚线（左侧快车道）
    for (const laneX of [-0.5, 0.0, 0.5]) {
      for (let d = 0; d < 14; d++) {
        const z1 = ((d / 14) + (t * 0.42) % (1 / 14));
        const z2 = Math.min(1, z1 + 0.032);
        if (z1 > 0.04 && z1 < 0.98) {
          const p1 = project(z1, laneX);
          const p2 = project(z2, laneX);
          ctx.strokeStyle = laneX === 0 ? 'rgba(255, 209, 102, 0.55)' : 'rgba(226, 232, 240, 0.25)';
          ctx.lineWidth = Math.max(1.5, p1.scale * 4);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    // 5. 左侧 95% 畅通车道：疾驰的暖黄/青绿光轨车流
    for (let i = 0; i < 16; i++) {
      const lane = -0.82 + (i % 3) * 0.34;
      const speed = 0.34 + (i % 4) * 0.09;
      const zHead = ((random(`car-z-${i}`) + t * speed) % 0.96) + 0.04;
      const zTail = Math.max(0.02, zHead - 0.14);
      const pHead = project(zHead, lane);
      const pTail = project(zTail, lane);

      const isGreen = i % 3 === 0;
      const streakGrad = ctx.createLinearGradient(pTail.x, pTail.y, pHead.x, pHead.y);
      streakGrad.addColorStop(0, 'rgba(0,0,0,0)');
      streakGrad.addColorStop(0.5, isGreen ? 'rgba(52, 211, 153, 0.55)' : 'rgba(255, 209, 102, 0.65)');
      streakGrad.addColorStop(1, isGreen ? 'rgba(167, 243, 208, 0.98)' : 'rgba(255, 248, 220, 0.98)');

      ctx.strokeStyle = streakGrad;
      ctx.lineWidth = Math.max(2, pHead.scale * 9);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pTail.x, pTail.y);
      ctx.lineTo(pHead.x, pHead.y);
      ctx.stroke();

      // 车头高光点
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(pHead.x, pHead.y, Math.max(2, pHead.scale * 5), 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. 中景红色发光收费站龙门架（z = 0.42）
    const gateZ = 0.44;
    const gL = project(gateZ, -1.04);
    const gR = project(gateZ, 1.04);
    const gMid = project(gateZ, 0.05);
    const gateH = 92;

    // 收费站龙门柱与顶棚
    ctx.fillStyle = '#1E2538';
    ctx.fillRect(gL.x, gL.y - gateH, gR.x - gL.x, 26);
    ctx.fillRect(gL.x, gL.y - gateH, 14, gateH);
    ctx.fillRect(gR.x - 14, gR.y - gateH, 14, gateH);
    ctx.fillRect(gMid.x - 8, gMid.y - gateH, 16, gateH);

    // 右侧收费站红色拥堵警示拱门（脉动红光）
    const pulse = 0.72 + 0.28 * Math.sin(t * 7.5);
    ctx.strokeStyle = `rgba(255, 77, 79, ${pulse})`;
    ctx.lineWidth = 8;
    ctx.shadowColor = '#FF3B30';
    ctx.shadowBlur = 28;
    ctx.beginPath();
    ctx.moveTo(gMid.x + 8, gMid.y - gateH + 14);
    ctx.quadraticCurveTo((gMid.x + gR.x) / 2, gMid.y - gateH - 42, gR.x - 10, gR.y - gateH + 14);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 7. 右侧 5% 堵车收费站：真实排队刹车红灯（几乎不动 + 缓慢挪动）
    for (let j = 0; j < 7; j++) {
      const zJam = gateZ + 0.04 + j * 0.068 + Math.sin(t * 1.5 + j) * 0.004;
      const laneJam = 0.35 + (j % 2) * 0.36;
      const pj = project(zJam, laneJam);
      const cw = pj.scale * 46;
      const ch = pj.scale * 22;

      // 车身暗剪影
      ctx.fillStyle = '#181E2E';
      ctx.fillRect(pj.x - cw / 2, pj.y - ch, cw, ch);

      // 两个强烈红光刹车尾灯 + 湿滑路面倒影
      const brakeGlow = ctx.createRadialGradient(pj.x, pj.y, 2, pj.x, pj.y, cw * 1.25);
      brakeGlow.addColorStop(0, `rgba(255, 59, 48, ${0.85 * pulse})`);
      brakeGlow.addColorStop(0.5, `rgba(255, 59, 48, ${0.28 * pulse})`);
      brakeGlow.addColorStop(1, 'rgba(255, 59, 48, 0)');
      ctx.fillStyle = brakeGlow;
      ctx.beginPath();
      ctx.ellipse(pj.x, pj.y + ch * 0.5, cw * 1.2, ch * 1.4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FF4D4F';
      ctx.fillRect(pj.x - cw * 0.38, pj.y - ch * 0.55, cw * 0.22, ch * 0.28);
      ctx.fillRect(pj.x + cw * 0.16, pj.y - ch * 0.55, cw * 0.22, ch * 0.28);
    }

    // 8. 细密日漫斜落雨丝
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.18)';
    ctx.lineWidth = 1.5;
    for (let r = 0; r < 65; r++) {
      const rx = (random(`rain-x-${r}`) * (W + 300) - t * 240) % (W + 300);
      const ry = (random(`rain-y-${r}`) * H + t * 1450) % H;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 14, ry + 58);
      ctx.stroke();
    }
  }, [frame]);

  return (
    <canvas
      ref={canvasRef}
      width={1080}
      height={1920}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  );
};

/**
 * 100% 程序化逐帧渲染的新海诚「深夜东京窗景 + 漂浮微尘 + 雨丝 + 极速光粒子」动态画布
 */
export const LiveTokyoNightCanvas: React.FC<{ speedBoost?: boolean }> = ({ speedBoost = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1920;
    const t = frame / 30;

    // 深夜蓝紫渐变
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#060A17');
    bg.addColorStop(0.55, '#0F1830');
    bg.addColorStop(1, '#080C18');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 暖色台灯丁达尔光晕（左下角）
    const lamp = ctx.createRadialGradient(180, 1320, 30, 180, 1320, 720);
    lamp.addColorStop(0, 'rgba(255, 186, 82, 0.28)');
    lamp.addColorStop(0.5, 'rgba(255, 145, 65, 0.08)');
    lamp.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, W, H);

    // 窗外呼吸感东京夜景焦外光斑（Bokeh）
    const bokehColors = ['#FFD166', '#5CE1E6', '#FF6B8B', '#818CF8', '#34D399'];
    for (let i = 0; i < 36; i++) {
      const bx = (random(`bk-x-${i}`) * W + Math.sin(t * 0.4 + i) * 18);
      const by = 220 + random(`bk-y-${i}`) * 1150;
      const br = 18 + random(`bk-r-${i}`) * 58;
      const alpha = 0.08 + 0.08 * Math.sin(t * 1.6 + i * 1.7);
      const col = bokehColors[i % bokehColors.length];
      ctx.globalAlpha = alpha;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 缓慢上升的暖金色空气微尘（日漫电影灵魂细节）
    for (let d = 0; d < 42; d++) {
      const dx = (random(`dust-x-${d}`) * W + Math.sin(t * 0.8 + d) * 32 + W) % W;
      const dy = (H - ((random(`dust-y-${d}`) * H + t * (28 + (d % 5) * 9)) % H));
      const dr = 1.6 + random(`dust-r-${d}`) * 3.2;
      ctx.fillStyle = `rgba(255, 224, 150, ${0.35 + 0.35 * Math.sin(t * 2 + d)})`;
      ctx.beginPath();
      ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 若开启 speedBoost（30x+ 提速高潮），发射向上的青绿/金色光束流
    if (speedBoost) {
      for (let s = 0; s < 26; s++) {
        const sx = random(`sp-x-${s}`) * W;
        const sy = H - ((random(`sp-y-${s}`) * H + t * (900 + (s % 4) * 260)) % (H + 200));
        const sh = 90 + (s % 3) * 65;
        const sg = ctx.createLinearGradient(sx, sy, sx, sy + sh);
        sg.addColorStop(0, s % 2 === 0 ? 'rgba(52, 211, 153, 0.8)' : 'rgba(255, 209, 102, 0.75)');
        sg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = sg;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy + sh);
        ctx.stroke();
      }
    }
  }, [frame, speedBoost]);

  return (
    <canvas
      ref={canvasRef}
      width={1080}
      height={1920}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  );
};
