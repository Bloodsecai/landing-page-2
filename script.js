const siteHeader = document.querySelector(".site-header");
const navAnchors = document.querySelectorAll('a[href^="#"]');
const faqTriggers = document.querySelectorAll(".faq-trigger");
const navbarLogo = document.getElementById("navbarLogo");

const reviewImage = document.getElementById("reviewImage");
const reviewBounceWrapper = document.getElementById("reviewBounceWrapper");
const aptoResultImage = document.getElementById("aptoPreview");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function getHeaderOffset() {
  return siteHeader ? siteHeader.offsetHeight + 10 : 0;
}

function smoothScrollToY(top) {
  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

function smoothScrollToElement(target) {
  const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
  smoothScrollToY(top);
}

function updateStickyHeader() {
  if (!siteHeader) return;
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);
}

function resetHeroReveal() {
  const heroTargets = document.querySelectorAll("#home .hero-animate-left, #home .hero-animate-right");
  heroTargets.forEach((element) => element.classList.remove("is-visible"));
}

function setAptoImageMotion(isVisible) {
  if (!aptoResultImage || prefersReducedMotion) return;

  aptoResultImage.classList.remove("is-bouncing", "is-floating");

  if (isVisible) {
    // Force a reflow so the pop-in animation restarts on every re-entry.
    void aptoResultImage.offsetWidth;
    aptoResultImage.classList.add("is-bouncing", "is-floating");
  }
}

function applyRevealTargets() {
  const mappings = [
    { selector: "#home .hero-animate-left", direction: "left" },
    { selector: "#home .hero-animate-right", direction: "right" },
    { selector: "main > section.section:not(#apto):not(.anchor-spacer)", direction: "up" },
    { selector: "main > section.prueba, main > section.testimonials, main > section.guidebook, main > section.community, main > section.enroll", direction: "up" },
    { selector: "#about .about-grid > :first-child", direction: "left" },
    { selector: "#about .about-grid > :last-child", direction: "right" },
    { selector: "#mission-vision .mv-card", direction: "up" },
    { selector: "#learner-fit .not-for-reveal-left", direction: "left" },
    { selector: "#learner-fit .not-for-reveal-right", direction: "right" },
    { selector: "#course-preview .course-preview__copy", direction: "left" },
    { selector: "#course-preview .course-preview__media", direction: "right" },
    { selector: "#prueba-breakdown .prueba__row", direction: "up" },
    { selector: "#pricing .priceCard", direction: "up" },
    { selector: "#testimonials .testimonialCard", direction: "up" },
    { selector: "#guidebook .guidebook__wrap", direction: "up" },
    { selector: "#faq .faq__item", direction: "up" },
    { selector: "#community .communityCard:nth-child(odd)", direction: "left" },
    { selector: "#community .communityCard:nth-child(even)", direction: "right" },
    { selector: "#enroll .enroll__shell, #enroll .enrollCard, #enroll .enroll__note, #enroll .enroll__footerBox", direction: "up" },
    { selector: ".site-footer .footer-shell, .site-footer .footer-meta", direction: "up" },
  ];

  const targets = [];
  const seenTargets = new Set();

  mappings.forEach(({ selector, direction }) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (element.hidden || element.closest("[hidden]")) return;
      if (!element.classList.contains("reveal")) {
        element.classList.add("reveal");
      }
      if (!element.dataset.animate) {
        element.dataset.animate = direction;
      }
      if (seenTargets.has(element)) return;
      seenTargets.add(element);
      targets.push(element);
    });
  });

  return targets;
}

function setupRevealObserver(targets) {
  if (!targets.length) return;

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    targets.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  targets.forEach((target) => observer.observe(target));
}

function setupReviewBounceObserver() {
  if (!reviewBounceWrapper) return;

  if (prefersReducedMotion) {
    reviewBounceWrapper.classList.add("is-visible");
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.22,
      rootMargin: "0px 0px -15% 0px",
    }
  );

  observer.observe(reviewBounceWrapper);
}

function setupAptoBounceObserver() {
  const aptoSection = document.getElementById("apto");
  if (!aptoSection || !aptoResultImage) return;

  if (prefersReducedMotion) {
    aptoResultImage.classList.remove("is-bouncing", "is-floating");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        setAptoImageMotion(entry.isIntersecting);
      });
    },
    {
      threshold: 0.22,
      rootMargin: "0px 0px -15% 0px",
    }
  );

  observer.observe(aptoSection);
}

function setupAptoResultToggle() {
  const aptoSection = document.getElementById("apto");
  const aptoToggle = document.getElementById("aptoToggle");
  const aptoPanel = document.getElementById("aptoPanel");
  if (!aptoSection || !aptoToggle || !aptoPanel) return;

  function setOpenState(isOpen) {
    aptoSection.classList.toggle("apto-open", isOpen);
    aptoToggle.setAttribute("aria-expanded", String(isOpen));
    aptoPanel.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
      setAptoImageMotion(true);
    } else {
      setAptoImageMotion(false);
    }
  }

  setOpenState(false);

  aptoToggle.addEventListener("click", () => {
    const isOpen = aptoSection.classList.contains("apto-open");
    setOpenState(!isOpen);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#learner-fit .learner-card").forEach((card) => {
    const content = card.querySelector(".learner-content");
    const toggles = card.querySelectorAll(".learner-toggle, .learner-hint-toggle");
    if (!content || !toggles.length) return;

    function setOpenState(isOpen) {
      card.classList.toggle("is-open", isOpen);
      card.setAttribute("aria-expanded", String(isOpen));
      toggles.forEach((toggle) => toggle.setAttribute("aria-expanded", String(isOpen)));

      if (isOpen) {
        content.hidden = false;
        requestAnimationFrame(() => {
          content.style.maxHeight = `${content.scrollHeight}px`;
          content.style.opacity = "1";
        });
      } else {
        content.style.maxHeight = "0px";
        content.style.opacity = "0";
        window.setTimeout(() => {
          if (!card.classList.contains("is-open")) {
            content.hidden = true;
          }
        }, 250);
      }
    }

    content.hidden = true;
    content.style.maxHeight = "0px";
    content.style.opacity = "0";
    setOpenState(false);

    toggles.forEach((toggle) => {
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        setOpenState(!card.classList.contains("is-open"));
      });
    });

    card.addEventListener("click", (event) => {
      const interactiveTarget = event.target.closest("button, a, input, textarea, select, label");
      if (interactiveTarget) return;

      if (card.classList.contains("is-open") && event.target.closest(".learner-content")) {
        return;
      }

      setOpenState(!card.classList.contains("is-open"));
    });

    card.addEventListener("keydown", (event) => {
      if (event.target !== card) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      setOpenState(!card.classList.contains("is-open"));
    });
  });
});

function setupAnchorScroll() {
  if (document.body && document.body.dataset.anchorScrollBound !== "true") {
    document.body.dataset.anchorScrollBound = "true";
    document.addEventListener("click", (event) => {
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor) return;

      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;

      if (hash === "#top") {
        event.preventDefault();
        resetHeroReveal();
        smoothScrollToY(0);
        history.replaceState(null, "", window.location.pathname + window.location.search);
        return;
      }

      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      smoothScrollToElement(target);
      history.pushState(null, "", hash);
    });
  }

  if (navbarLogo && navbarLogo.dataset.boundTopClick !== "true") {
    navbarLogo.dataset.boundTopClick = "true";
    navbarLogo.addEventListener("click", (event) => {
      event.preventDefault();
      resetHeroReveal();
      smoothScrollToY(0);
      history.replaceState(null, "", window.location.pathname + window.location.search);
    });
  }
}

function setupMobileNav() {
  const navShell = document.querySelector(".nav-shell");
  const navCapsule = document.querySelector(".navCapsule");
  const navLinks = document.querySelector(".nav-links");
  const navCTA = document.querySelector(".navCTA");
  if (!navShell || !navCapsule || !navLinks) return;

  if (navShell.querySelector(".nav-toggle")) return;

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "nav-toggle";
  toggleButton.setAttribute("aria-label", "Toggle navigation menu");
  toggleButton.setAttribute("aria-controls", "mobileNavPanel");
  toggleButton.setAttribute("aria-expanded", "false");
  toggleButton.innerHTML = '<span></span><span></span><span></span>';
  navShell.appendChild(toggleButton);

  const mobilePanel = document.createElement("div");
  mobilePanel.id = "mobileNavPanel";
  mobilePanel.className = "mobile-nav-panel";
  mobilePanel.setAttribute("hidden", "");

  const mobileNav = document.createElement("nav");
  mobileNav.className = "mobile-nav-links";
  mobileNav.setAttribute("aria-label", "Mobile primary");
  navLinks.querySelectorAll("a").forEach((link) => {
    const clone = link.cloneNode(true);
    clone.classList.add("mobile-nav-link");
    mobileNav.appendChild(clone);
  });

  mobilePanel.appendChild(mobileNav);

  if (navCTA) {
    const ctaClone = navCTA.cloneNode(true);
    ctaClone.classList.add("mobile-nav-cta");
    mobilePanel.appendChild(ctaClone);
  }

  navShell.appendChild(mobilePanel);

  const viewportQuery = window.matchMedia("(max-width: 900px)");

  const closeMenu = () => {
    if (mobilePanel.hasAttribute("hidden")) {
      document.body.classList.remove("mobile-nav-open");
      return;
    }
    mobilePanel.classList.remove("is-open");
    toggleButton.classList.remove("is-open");
    toggleButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("mobile-nav-open");
    window.setTimeout(() => {
      if (!mobilePanel.classList.contains("is-open")) {
        mobilePanel.setAttribute("hidden", "");
      }
    }, prefersReducedMotion ? 0 : 200);
  };

  const openMenu = () => {
    mobilePanel.removeAttribute("hidden");
    requestAnimationFrame(() => mobilePanel.classList.add("is-open"));
    toggleButton.classList.add("is-open");
    toggleButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("mobile-nav-open");
  };

  toggleButton.addEventListener("click", () => {
    const isOpen = toggleButton.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  mobilePanel.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  const onViewportChange = (event) => {
    if (!event.matches) {
      closeMenu();
    }
  };

  if (typeof viewportQuery.addEventListener === "function") {
    viewportQuery.addEventListener("change", onViewportChange);
  } else if (typeof viewportQuery.addListener === "function") {
    viewportQuery.addListener(onViewportChange);
  }
}

function setupFaq() {
  const items = document.querySelectorAll(".faq__item");
  if (!items.length) return;

  function openItem(item) {
    const button = item.querySelector(".faq__q");
    const answer = item.querySelector(".faq__a");
    const inner = item.querySelector(".faq__aInner");
    if (!button || !answer || !inner) return;

    item.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");

    if (prefersReducedMotion) {
      answer.style.height = "auto";
      return;
    }

    answer.style.height = "0px";
    const targetHeight = inner.scrollHeight;

    requestAnimationFrame(() => {
      answer.style.height = `${targetHeight}px`;
    });

    const onEnd = (event) => {
      if (event.propertyName !== "height") return;
      if (item.classList.contains("is-open")) {
        answer.style.height = "auto";
      }
      answer.removeEventListener("transitionend", onEnd);
    };

    answer.addEventListener("transitionend", onEnd);
  }

  function closeItem(item) {
    const button = item.querySelector(".faq__q");
    const answer = item.querySelector(".faq__a");
    const inner = item.querySelector(".faq__aInner");
    if (!button || !answer || !inner) return;

    item.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");

    if (prefersReducedMotion) {
      answer.style.height = "0px";
      return;
    }

    answer.style.height = `${inner.scrollHeight}px`;
    requestAnimationFrame(() => {
      answer.style.height = "0px";
    });
  }

  items.forEach((item) => {
    const button = item.querySelector(".faq__q");
    const answer = item.querySelector(".faq__a");
    if (!button || !answer) return;

    item.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
    answer.style.height = "0px";

    button.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      items.forEach((otherItem) => {
        if (otherItem !== item) {
          closeItem(otherItem);
        }
      });

      if (isOpen) {
        closeItem(item);
      } else {
        openItem(item);
      }
    });
  });
}

function setupAptoModal() {
  const aptoTrigger = document.getElementById("aboutAptoButton");
  const aptoModal = document.getElementById("aptoModal");
  const aptoModalClose = document.getElementById("aptoModalClose");
  const aptoModalImg = document.getElementById("aptoModalImg");

  if (!aptoTrigger || !aptoModal || !aptoModalClose || !aptoModalImg) return;

  function openAptoModal() {
    aptoModal.classList.add("is-open");
    aptoModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeAptoModal() {
    aptoModal.classList.remove("is-open");
    aptoModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  aptoTrigger.addEventListener("click", () => {
    if (!aptoModalImg.getAttribute("src")) {
      aptoModalImg.setAttribute("src", "/images/apto.png");
    }
    openAptoModal();
  });

  aptoModalClose.addEventListener("click", closeAptoModal);

  aptoModal.addEventListener("click", (event) => {
    if (event.target === aptoModal || event.target.hasAttribute("data-apto-close")) {
      closeAptoModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAptoModal();
    }
  });
}

function setupReviewModal() {
  const imageModal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImg");
  const closeModal = document.getElementById("closeModal");

  if (!reviewImage || !imageModal || !modalImg || !closeModal) return;

  function closeReviewModal() {
    imageModal.classList.remove("show");
  }

  reviewImage.addEventListener("click", () => {
    modalImg.src = reviewImage.src;
    imageModal.classList.add("show");
  });

  closeModal.addEventListener("click", closeReviewModal);

  imageModal.addEventListener("click", (event) => {
    if (event.target === imageModal) {
      closeReviewModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeReviewModal();
    }
  });
}

function setupPruebaReveal() {
  const rows = document.querySelectorAll(
    ".prueba__row.reveal, .testimonials .testimonialCard.reveal, #pricing .priceCard.reveal"
  );
  if (!rows.length) return;

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    rows.forEach((row) => row.classList.add("is-inview", "is-in", "is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-inview", "is-in", "is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.08,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  rows.forEach((row) => observer.observe(row));
}

function init() {
  const revealTargets = applyRevealTargets();

  setupRevealObserver(revealTargets);
  setupReviewBounceObserver();
  setupAptoResultToggle();
  setupAptoBounceObserver();
  setupMobileNav();
  setupAnchorScroll();
  setupFaq();
  setupAptoModal();
  setupReviewModal();
  setupPruebaReveal();

  updateStickyHeader();

  if (window.location.hash && window.location.hash !== "#top") {
    const target = document.querySelector(window.location.hash);
    if (target) {
      window.setTimeout(() => smoothScrollToElement(target), 70);
    }
  }
}

window.addEventListener("scroll", updateStickyHeader, { passive: true });

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
