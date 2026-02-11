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
  const heroTargets = document.querySelectorAll("#hero .hero-animate-left, #hero .hero-animate-right");
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
    { selector: "#hero .hero-animate-left", direction: "left" },
    { selector: "#hero .hero-animate-right", direction: "right" },
    { selector: "#mission-vision .mv-card", direction: "up" },
    { selector: "#learner-fit .not-for-reveal-left", direction: "left" },
    { selector: "#learner-fit .not-for-reveal-right", direction: "right" },
    { selector: "#course-preview .course-preview__copy", direction: "left" },
    { selector: "#course-preview .course-preview__media", direction: "right" },
    { selector: "#upcoming-features .upcoming-section__header", direction: "up" },
    { selector: "#upcoming-features .upcoming-card:nth-child(odd)", direction: "left" },
    { selector: "#upcoming-features .upcoming-card:nth-child(even)", direction: "right" },
    { selector: "#platform-features .upcoming-section__header", direction: "up" },
    { selector: "#platform-features .platform-item:nth-child(odd)", direction: "left" },
    { selector: "#platform-features .platform-item:nth-child(even)", direction: "right" },
  ];

  const targets = [];

  mappings.forEach(({ selector, direction }) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.classList.add("reveal");
      element.dataset.animate = direction;
      targets.push(element);
    });
  });

  return targets;
}

function setupRevealObserver(targets) {
  if (!targets.length) return;

  if (prefersReducedMotion) {
    targets.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    {
      threshold: 0.22,
      rootMargin: "0px 0px -15% 0px",
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
  document.querySelectorAll(".learner-toggle").forEach((btn) => {
    const card = btn.closest(".learner-card");
    const content = card ? card.querySelector(".learner-content") : null;
    if (!card || !content) return;

    content.hidden = true;
    content.style.maxHeight = "0px";
    content.style.opacity = "0";

    btn.addEventListener("click", () => {
      const targetCard = btn.closest(".learner-card");
      const targetContent = targetCard ? targetCard.querySelector(".learner-content") : null;
      if (!targetCard || !targetContent) return;

      const isOpen = targetCard.classList.contains("is-open");

      targetCard.classList.toggle("is-open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));

      if (!isOpen) {
        targetContent.hidden = false;
        requestAnimationFrame(() => {
          targetContent.style.maxHeight = `${targetContent.scrollHeight}px`;
          targetContent.style.opacity = "1";
        });
      } else {
        targetContent.style.maxHeight = "0px";
        targetContent.style.opacity = "0";
        window.setTimeout(() => {
          if (!targetCard.classList.contains("is-open")) {
            targetContent.hidden = true;
          }
        }, 250);
      }
    });
  });
});

function setupAnchorScroll() {
  navAnchors.forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
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
  });

  if (navbarLogo) {
    navbarLogo.addEventListener("click", (event) => {
      event.preventDefault();
      resetHeroReveal();
      smoothScrollToY(0);
      history.replaceState(null, "", window.location.pathname + window.location.search);
    });
  }
}

function setupFaq() {
  faqTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const answerId = trigger.getAttribute("aria-controls");
      const answer = answerId ? document.getElementById(answerId) : null;
      if (!answer) return;

      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!isOpen));
      answer.hidden = isOpen;

      const faqItem = trigger.closest(".faq-item");
      if (faqItem) {
        faqItem.classList.toggle("is-open", !isOpen);
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
      aptoModalImg.setAttribute("src", "images/apto.png");
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

function init() {
  const revealTargets = applyRevealTargets();

  setupRevealObserver(revealTargets);
  setupReviewBounceObserver();
  setupAptoResultToggle();
  setupAptoBounceObserver();
  setupAnchorScroll();
  setupFaq();
  setupAptoModal();
  setupReviewModal();

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
