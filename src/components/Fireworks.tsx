import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  trail: { x: number; y: number }[];
}

interface Rocket {
  x: number;
  y: number;
  vy: number;
  targetY: number;
  color: string;
  exploded: boolean;
}

const COLORS = [
  "#ff3d00",
  "#ffab00",
  "#00e676",
  "#2979ff",
  "#d500f9",
  "#ff6d00",
  "#00bcd4",
  "#ff1744",
  "#76ff03",
  "#ffd740",
];

export default function Fireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let animationId: number;
    const particles: Particle[] = [];
    const rockets: Rocket[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const createExplosion = (x: number, y: number) => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const count = 60 + Math.random() * 40;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 4;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 60 + Math.random() * 40,
          color,
          size: 2 + Math.random() * 2,
          trail: [],
        });
      }
    };

    const launchRocket = () => {
      rockets.push({
        x: Math.random() * canvas.width,
        y: canvas.height,
        vy: -(8 + Math.random() * 4),
        targetY: canvas.height * (0.15 + Math.random() * 0.35),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        exploded: false,
      });
    };

    let lastLaunch = 0;
    const animate = (time: number) => {
      ctx.fillStyle = "rgba(10, 10, 10, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Launch new rockets
      if (time - lastLaunch > 400 + Math.random() * 800) {
        launchRocket();
        if (Math.random() > 0.5) launchRocket();
        lastLaunch = time;
      }

      // Update & draw rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;

        // Draw rocket trail
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(r.x, r.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = r.color + "44";
        ctx.fill();

        if (r.y <= r.targetY) {
          createExplosion(r.x, r.y);
          rockets.splice(i, 1);
        }
      }

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.shift();

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // gravity
        p.vx *= 0.98;
        p.vy *= 0.98;

        const alpha = 1 - p.life / p.maxLife;

        // Draw trail
        for (let j = 0; j < p.trail.length; j++) {
          const t = p.trail[j];
          const ta = (j / p.trail.length) * alpha * 0.3;
          ctx.beginPath();
          ctx.arc(t.x, t.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle =
            p.color +
            Math.floor(ta * 255)
              .toString(16)
              .padStart(2, "0");
          ctx.fill();
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle =
          p.color +
          Math.floor(alpha * 255)
            .toString(16)
            .padStart(2, "0");
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3 * alpha, 0, Math.PI * 2);
        ctx.fillStyle =
          p.color +
          Math.floor(alpha * 50)
            .toString(16)
            .padStart(2, "0");
        ctx.fill();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
