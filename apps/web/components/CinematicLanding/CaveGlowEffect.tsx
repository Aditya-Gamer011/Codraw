"use client";

export default function CaveGlowEffect() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {/* Cave Mouth Radial Glow */}
      <div
        className="absolute top-[38%] left-[50%] -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] md:h-[500px] md:w-[500px] rounded-full opacity-70 blur-[70px] mix-blend-screen animate-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(251, 146, 60, 0.85) 0%, rgba(245, 158, 11, 0.5) 40%, rgba(147, 51, 234, 0.2) 75%, transparent 100%)",
          animationDuration: "4s",
        }}
      />
      {/* Secondary Inner Portal Light */}
      <div
        className="absolute top-[38%] left-[50%] -translate-x-1/2 -translate-y-1/2 h-[150px] w-[150px] md:h-[220px] md:w-[220px] rounded-full opacity-90 blur-[40px] mix-blend-screen animate-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(255, 237, 213, 0.95) 0%, rgba(251, 191, 36, 0.8) 50%, transparent 100%)",
          animationDuration: "2.5s",
        }}
      />
    </div>
  );
}
