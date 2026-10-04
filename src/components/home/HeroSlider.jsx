import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./HeroSlider.css";

const SLIDE_INTERVAL = 5500;
const SWIPE_THRESHOLD = 45;

function ArrowIcon({ direction }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={`hero-arrow-icon is-${direction}`}
    >
      <path
        d="M15 5l-7 7 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HeroSlider({ slides }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const touchStartX = useRef(null);

  const reduceMotion = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  })[0];

  const total = slides.length;

  function goTo(next) {
    setIndex((next + total) % total);
  }

  useEffect(() => {
    if (reduceMotion || paused || total < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, SLIDE_INTERVAL);

    return () => window.clearInterval(timer);
  }, [reduceMotion, paused, total]);

  function handleKeyDown(event) {
    if (event.key === "ArrowRight") {
      goTo(index + 1);
    }

    if (event.key === "ArrowLeft") {
      goTo(index - 1);
    }
  }

  function handleTouchStart(event) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event) {
    if (touchStartX.current === null) {
      return;
    }

    const distance = event.changedTouches[0].clientX - touchStartX.current;

    touchStartX.current = null;

    if (Math.abs(distance) < SWIPE_THRESHOLD) {
      return;
    }

    if (distance < 0) {
      goTo(index + 1);
    } else {
      goTo(index - 1);
    }
  }

  if (!total) {
    return null;
  }

  return (
    <section
      className={`hero ${reduceMotion ? "is-static" : ""}`}
      aria-roledescription="carousel"
      aria-label="Voltix highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="hero-track"
        style={{
          transform: `translate3d(-${index * 100}%, 0, 0)`,
        }}
      >
        {slides.map((slide, slideIndex) => (
          <div
            key={slideIndex}
            className="hero-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${slideIndex + 1} of ${total}`}
            aria-hidden={slideIndex === index ? undefined : true}
          >
            <div className="voltix-container hero-slide-inner">
              <div className="hero-copy">
                {slide.kicker ? (
                  <p className="hero-kicker">{slide.kicker}</p>
                ) : null}

                <h2 className="hero-title">{slide.title}</h2>

                {slide.text ? <p className="hero-text">{slide.text}</p> : null}

                <div className="hero-cta-row">
                  {slide.primary ? (
                    <Link
                      to={slide.primary.href}
                      className="hero-cta hero-cta-primary"
                      tabIndex={slideIndex === index ? undefined : -1}
                    >
                      {slide.primary.label}
                    </Link>
                  ) : null}

                  {slide.secondary ? (
                    <Link
                      to={slide.secondary.href}
                      className="hero-cta hero-cta-ghost"
                      tabIndex={slideIndex === index ? undefined : -1}
                    >
                      {slide.secondary.label}
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="hero-art">
                {slide.badge ? (
                  <span className="hero-badge">{slide.badge}</span>
                ) : null}

                <img
                  className="hero-image"
                  src={slide.image}
                  alt={slide.alt || ""}
                  loading={slideIndex === 0 ? "eager" : "lazy"}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {total > 1 ? (
        <>
          <button
            type="button"
            className="hero-arrow hero-arrow-prev"
            aria-label="Previous slide"
            onClick={() => goTo(index - 1)}
          >
            <ArrowIcon direction="prev" />
          </button>

          <button
            type="button"
            className="hero-arrow hero-arrow-next"
            aria-label="Next slide"
            onClick={() => goTo(index + 1)}
          >
            <ArrowIcon direction="next" />
          </button>

          <div className="hero-dots">
            {slides.map((slide, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                className="hero-dot"
                aria-label={`Go to slide ${dotIndex + 1}`}
                aria-current={dotIndex === index ? true : undefined}
                onClick={() => goTo(dotIndex)}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
