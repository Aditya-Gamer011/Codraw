"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AmbientParticles from "./AmbientParticles";
import CaveGlowEffect from "./CaveGlowEffect";
import { Sparkles, MoveRight } from "lucide-react";

interface Props {
  onEnterApp: () => void;
}

export default function CinematicLanding({ onEnterApp }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const skyRef = useRef<HTMLDivElement | null>(null);
  const cloudsRef = useRef<HTMLDivElement | null>(null);
  const tertiaryMountainsRef = useRef<HTMLDivElement | null>(null);
  const mainMountainRef = useRef<HTMLDivElement | null>(null);
  const promptRef = useRef<HTMLDivElement | null>(null);
  const flashOverlayRef = useRef<HTMLDivElement | null>(null);

  const hasEnteredRef = useRef(false);
  const progressRef = useRef(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const origBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 1. Idle Cloud Drift Animation
    const cloudTween = gsap.to(cloudsRef.current, {
      xPercent: -6,
      duration: 35,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // 2. Idle Prompt Float & Glow Animation
    const arrowTween = gsap.to(".scroll-arrow", {
      y: 12,
      opacity: 1,
      duration: 1.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Function to update all layer transforms based on 0..1 progress
    const updateTransforms = (p: number) => {
      // 0..0.2 progress: fade out prompt
      if (promptRef.current) {
        promptRef.current.style.opacity = `${Math.max(0, 1 - p * 5)}`;
        promptRef.current.style.transform = `translateY(${p * 50}px)`;
      }

      // Layer 1: Sky (subtle scale 1 -> 1.15)
      if (skyRef.current) {
        skyRef.current.style.transform = `scale(${1 + p * 0.15}) translateY(${p * 15}px)`;
      }

      // Layer 2: Clouds (scale 1 -> 1.35, fade)
      if (cloudsRef.current) {
        cloudsRef.current.style.transform = `scale(${1 + p * 0.35}) translateY(${p * 30}px)`;
        cloudsRef.current.style.opacity = `${Math.max(0.2, 0.9 - p * 0.7)}`;
      }

      // Layer 3: Tertiary Mountains (scale 1 -> 1.7)
      if (tertiaryMountainsRef.current) {
        tertiaryMountainsRef.current.style.transform = `scale(${1 + p * 0.7}) translateY(${p * 45}px)`;
      }

      // Layer 4: Main Mountain & Cave (scale 1 -> 8.2 into cave mouth)
      if (mainMountainRef.current) {
        mainMountainRef.current.style.transformOrigin = "49% 38%";
        mainMountainRef.current.style.transform = `scale(${1 + p * 8.2}) translateY(${p * 20}px)`;
      }

      // Cave Glow Intensification
      const glowEl = containerRef.current?.querySelector(".cave-glow-container") as HTMLElement | null;
      if (glowEl) {
        glowEl.style.transformOrigin = "49% 38%";
        glowEl.style.transform = `scale(${1 + p * 4.0}) translateY(${p * 20}px)`;
        glowEl.style.opacity = `${0.8 + p * 0.2}`;
      }
    };

    // Smoothly animate target progress
    let animFrame: number;
    let currentP = 0;

    const triggerEnterSequence = () => {
      if (hasEnteredRef.current) return;
      hasEnteredRef.current = true;

      if (flashOverlayRef.current) {
        gsap.to(flashOverlayRef.current, {
          opacity: 1,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: () => {
            document.body.style.overflow = "hidden";
            onEnterApp();
          },
        });
      } else {
        onEnterApp();
      }
    };

    const tick = () => {
      const targetP = progressRef.current;

      if (hasEnteredRef.current) {
        // Freeze at full zoom during transition
        updateTransforms(1.0);
        return;
      }

      currentP += (targetP - currentP) * 0.1; // Smooth dampening easing
      updateTransforms(currentP);

      if (currentP > 0.96) {
        progressRef.current = 1.0;
        updateTransforms(1.0);
        triggerEnterSequence();
        return;
      }
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);

    // Event listener for Wheel / Trackpad scroll
    const handleWheel = (e: WheelEvent) => {
      if (hasEnteredRef.current) return;
      e.preventDefault();
      const delta = e.deltaY * 0.0012;
      progressRef.current = Math.min(1, Math.max(0, progressRef.current + delta));
    };

    // Event listener for Touch Swipe
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (hasEnteredRef.current) return;
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (hasEnteredRef.current) return;
      const touchY = e.touches[0].clientY;
      const delta = (touchStartY - touchY) * 0.003;
      touchStartY = touchY;
      progressRef.current = Math.min(1, Math.max(0, progressRef.current + delta));
    };

    // Event listener for Keydown
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasEnteredRef.current) return;
      if (["ArrowDown", "PageDown", "Space"].includes(e.code)) {
        e.preventDefault();
        progressRef.current = Math.min(1, progressRef.current + 0.15);
      } else if (["ArrowUp", "PageUp"].includes(e.code)) {
        e.preventDefault();
        progressRef.current = Math.max(0, progressRef.current - 0.15);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(animFrame);
      cloudTween.kill();
      arrowTween.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      document.body.style.overflow = origBodyOverflow || "hidden";
    };
  }, [onEnterApp]);

  const handleQuickEnter = () => {
    progressRef.current = 1.0;
    hasEnteredRef.current = true;
    if (flashOverlayRef.current) {
      gsap.to(flashOverlayRef.current, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          document.body.style.overflow = "hidden";
          onEnterApp();
        },
      });
    } else {
      onEnterApp();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-[#020205] select-none text-white font-sans"
    >
      {/* Flash / Dark Vignette Transition Overlay */}
      <div
        ref={flashOverlayRef}
        className="pointer-events-none fixed inset-0 z-50 bg-black opacity-0 transition-opacity duration-300"
      />

      {/* Skip / Enter Direct Button */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-3">
        <button
          onClick={handleQuickEnter}
          className="flex items-center gap-2.5 rounded-full border border-white/20 bg-black/60 px-5 py-2.5 text-xs font-semibold tracking-wide text-zinc-100 backdrop-blur-xl transition hover:border-cyan-400 hover:bg-black/80 hover:text-white active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.6)] cursor-pointer"
        >
          <span>Enter Codraw IDE</span>
          <MoveRight size={14} className="text-cyan-400" />
        </button>
      </div>

      {/* Stacked Parallax Landscape Container */}
      <div className="relative h-full w-full overflow-hidden">
        {/* Layer 1: Sky (Backmost) */}
        <div
          ref={skyRef}
          className="absolute inset-0 z-0 h-full w-full bg-cover bg-center transition-transform duration-75 ease-out"
          style={{
            backgroundImage: "url('/sky-final.png')",
          }}
        />

        {/* Layer 2: Clouds */}
        <div
          ref={cloudsRef}
          className="absolute inset-0 z-10 h-full w-full bg-cover bg-center mix-blend-screen opacity-90 transition-transform duration-75 ease-out"
          style={{
            backgroundImage: "url('/clouds-final.png')",
          }}
        />

        {/* Layer 3: Tertiary Mountains (Far Background) */}
        <div
          ref={tertiaryMountainsRef}
          className="absolute inset-0 z-20 h-full w-full bg-cover bg-center transition-transform duration-75 ease-out"
          style={{
            backgroundImage: "url('/tertiary-mountains-final.png')",
          }}
        />

        {/* Cave Ambient Glow Effect */}
        <div className="cave-glow-container pointer-events-none absolute inset-0 z-25 opacity-80 transition-all duration-75 ease-out">
          <CaveGlowEffect />
        </div>

        {/* Ambient Ember & Dust Particles */}
        <AmbientParticles />

        {/* Layer 4: Main Mountain with Cave (Frontmost Landscape) */}
        <div
          ref={mainMountainRef}
          className="absolute inset-0 z-30 h-full w-full bg-cover bg-center transition-transform duration-75 ease-out"
          style={{
            backgroundImage: "url('/mountain-final.png')",
          }}
        />

        {/* Layer 5: Hero Title Overlay & Scroll Prompt */}
        <div
          ref={promptRef}
          className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-between pb-14 pt-16 text-center transition-all duration-150"
        >
          {/* Subtle Branding Header with codraw-text.png */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-xs font-medium text-cyan-300 backdrop-blur-md shadow-lg">
              <Sparkles size={13} className="animate-pulse text-amber-400" />
              <span>AI-Powered Full-Stack Canvas & IDE</span>
            </div>

            {/* Official Codraw Text Graphic Asset */}
            <img
              src="/codraw-text.png"
              alt="Codraw"
              className="h-24 md:h-40 lg:h-48 w-auto max-w-[90vw] object-contain drop-shadow-[0_8px_35px_rgba(0,0,0,0.95)] filter brightness-110"
            />
          </div>

          {/* Idle Scroll Prompt */}
          <div className="flex flex-col items-center gap-4">
            <div className="scroll-arrow flex flex-col items-center gap-2">
              {/* Image Arrow */}
              <img
                src="/arow-final.png"
                alt="Scroll arrow"
                className="h-28 w-28 md:h-36 md:w-36 object-contain drop-shadow-[0_0_24px_rgba(251,191,36,0.85)] filter brightness-110"
              />
            </div>

            {/* High-Contrast Glassmorphic Scroll Pill */}
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-6 py-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-xl">
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <p className="font-sans text-xs md:text-sm font-semibold tracking-[0.35em] uppercase text-zinc-100 drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                Scroll to enter
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
