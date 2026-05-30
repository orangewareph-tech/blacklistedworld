import { useEffect, useRef } from "react";

const COLORS = ["#e53935", "#ff5252", "#b7410e", "#cd5c5c", "#8b0000", "#ff6b6b", "#a0522d"];

class Particle {
  x = 0; y = 0; vx = 0; vy = 0; size = 1; color = "#e53935"; alpha = 0.5; decay = 0.005; pulse = 0;
  width: number; height: number;
  constructor(width: number, height: number, x: number | null = null, y: number | null = null) {
    this.width = width; this.height = height;
    this.x = x ?? Math.random() * width;
    this.y = y ?? Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.55;
    this.vy = (Math.random() - 0.5) * 0.55;
    this.size = Math.random() * 2.8 + 0.7;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.alpha = Math.random() * 0.55 + 0.35;
    this.decay = Math.random() * 0.007 + 0.0025;
    this.pulse = Math.random() * Math.PI * 2;
  }
  respawn() {
    this.x = Math.random() * this.width;
    this.y = Math.random() * this.height;
    this.alpha = Math.random() * 0.55 + 0.35;
    this.vx = (Math.random() - 0.5) * 0.55;
    this.vy = (Math.random() - 0.5) * 0.55;
    this.size = Math.random() * 2.8 + 0.7;
  }
  update(mouse: { x: number | null; y: number | null }, w: number, h: number) {
    this.width = w; this.height = h;
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0) this.x = w;
    if (this.x > w) this.x = 0;
    if (this.y < 0) this.y = h;
    if (this.y > h) this.y = 0;
    this.vx *= 0.992; this.vy *= 0.992;
    this.vx += (Math.random() - 0.5) * 0.035;
    this.vy += (Math.random() - 0.5) * 0.035;
    this.alpha -= this.decay;
    this.pulse += 0.04;
    if (this.alpha <= 0.08) this.respawn();
    if (mouse.x !== null && mouse.y !== null) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 135 && dist > 0.1) {
        const force = (135 - dist) / 135;
        this.vx += (dx / dist) * force * 1.1;
        this.vy += (dy / dist) * force * 1.1;
        this.alpha = Math.min(0.95, this.alpha + 0.04);
      }
    }
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    if (this.size > 1.9) {
      ctx.shadowBlur = 9;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function RustCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let particles: Particle[] = [];
    for (let i = 0; i < 135; i++) particles.push(new Particle(width, height));

    const mouse: { x: number | null; y: number | null } = { x: null, y: null };


    let raf = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) { p.update(mouse, width, height); p.draw(ctx); }
      // connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 105 && dist > 8) {
            const alpha = (1 - dist / 105) * 0.22 * Math.min(particles[i].alpha, particles[j].alpha);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = "#e53935";
            ctx.lineWidth = 0.85;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      if (Math.random() < 0.12 && particles.length < 195) particles.push(new Particle(width, height));
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="opacity-[0.48]"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "70vh",
        zIndex: 0,
        pointerEvents: "none",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.45) 18%, #000 40%, #000 100%)",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.45) 18%, #000 40%, #000 100%)",
      }}
    />
  );
}


