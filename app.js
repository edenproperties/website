/* Native scrolling: no scroll hijacking and no runtime dependencies. */
(() => {
  "use strict";
  document.documentElement.classList.add("js-enabled");
  const story = document.getElementById("scroll-story");
  const stage = story.querySelector(".story-stage");
  const slides = [...document.querySelectorAll("[data-slide]")];
  const controls = [...document.querySelectorAll("[data-story]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let scheduled = false;

  function updateStory() {
    scheduled = false;
    const box = story.getBoundingClientRect();
    const distance = Math.max(1, story.offsetHeight - stage.offsetHeight);
    const progress = clamp(-box.top / distance, 0, 1) * (slides.length - 1);
    const base = Math.floor(progress);
    // Hold each photograph, then dissolve into the next as scrolling continues.
    const blend = reducedMotion.matches
      ? 0
      : clamp((progress - base - 0.6) / 0.4, 0, 1);
    const active = reducedMotion.matches
      ? Math.round(progress)
      : Math.min(slides.length - 1, base + (blend >= 0.5 ? 1 : 0));
    slides.forEach((slide, index) => {
      const opacity = reducedMotion.matches
        ? Number(index === active)
        : index === base
          ? 1
          : index === base + 1
            ? blend
            : 0;
      slide.style.opacity = String(opacity);
      slide.style.visibility = opacity > 0 ? "visible" : "hidden";
      slide.classList.toggle("is-active", index === active);
      slide.inert = index !== active;
    });
    controls.forEach((control, index) =>
      control.setAttribute("aria-current", String(index === active)),
    );
  }

  function scheduleUpdate() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateStory);
    }
  }

  controls.forEach((control, index) => {
    control.addEventListener("click", () => {
      const start = story.getBoundingClientRect().top + window.scrollY;
      const distance = Math.max(1, story.offsetHeight - stage.offsetHeight);
      window.scrollTo({
        top: start + (distance * index) / (slides.length - 1),
        behavior: reducedMotion.matches ? "instant" : "smooth",
      });
    });
  });
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  reducedMotion.addEventListener("change", scheduleUpdate);
  updateStory();

  const header = document.getElementById("header");
  const video = document.getElementById("hero-video");
  const toggle = document.getElementById("motion-toggle");
  let manuallyPaused = false;
  const saveData = Boolean(navigator.connection?.saveData);

  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  function updateToggle() {
    toggle.setAttribute("aria-pressed", String(video.paused));
    toggle.setAttribute(
      "aria-label",
      video.paused ? "Play background motion" : "Pause background motion",
    );
    toggle.textContent = video.paused ? "▷  Play motion" : "Ⅱ  Pause motion";
  }

  function syncMotion() {
    const enabled = !reducedMotion.matches && !saveData;
    document.documentElement.classList.toggle("js-motion", enabled);
    toggle.hidden = !enabled;
    if (!enabled || manuallyPaused || document.hidden) {
      video.pause();
    } else {
      if (!video.getAttribute("src")) video.src = video.dataset.src;
      video.play().catch(() => {
        // Autoplay may be blocked; keep the poster and offer explicit playback.
        updateToggle();
      });
    }
    updateToggle();
  }

  toggle.addEventListener("click", () => {
    manuallyPaused = !video.paused;
    syncMotion();
  });
  video.addEventListener("play", updateToggle);
  video.addEventListener("pause", updateToggle);
  video.addEventListener("error", () => {
    toggle.hidden = true;
  });
  reducedMotion.addEventListener("change", syncMotion);
  document.addEventListener("visibilitychange", syncMotion);

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(".reveal")
    .forEach((element) => revealObserver.observe(element));
  document.getElementById("year").textContent = String(
    new Date().getFullYear(),
  );
  syncMotion();
})();
