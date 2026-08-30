(function () {
  "use strict";

  document.documentElement.classList.add("js-enabled");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const header = document.getElementById("site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.getElementById("primary-navigation");
  const navigationLinks = Array.from(
    document.querySelectorAll("[data-nav-link]")
  );
  const sectionElements = Array.from(
    document.querySelectorAll("main section[id]")
  );

  let menuIsOpen = false;
  let lastFocusedElement = null;
  let scrollFrameRequested = false;

  function setHeaderState() {
    if (!header) {
      return;
    }

    header.classList.toggle("is-scrolled", window.scrollY > 32);
  }

  function setActiveNavigation() {
    if (!sectionElements.length) {
      return;
    }

    const marker = window.scrollY + window.innerHeight * 0.38;
    let activeSection = sectionElements[0];

    sectionElements.forEach(function (section) {
      if (section.offsetTop <= marker) {
        activeSection = section;
      }
    });

    if (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4
    ) {
      activeSection = sectionElements[sectionElements.length - 1];
    }

    navigationLinks.forEach(function (link) {
      const linkTarget = link.getAttribute("href");
      const isActive = linkTarget === "#" + activeSection.id;

      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function handleScroll() {
    if (scrollFrameRequested) {
      return;
    }

    scrollFrameRequested = true;

    window.requestAnimationFrame(function () {
      setHeaderState();
      setActiveNavigation();
      scrollFrameRequested = false;
    });
  }

  setHeaderState();
  setActiveNavigation();

  window.addEventListener("scroll", handleScroll, {
    passive: true
  });

  window.addEventListener("resize", handleScroll);

  function getFocusableMenuItems() {
    if (!navigation) {
      return [];
    }

    return Array.from(
      navigation.querySelectorAll("a[href], button:not([disabled])")
    );
  }

  function openMenu() {
    if (!menuButton || !navigation || menuIsOpen) {
      return;
    }

    menuIsOpen = true;
    lastFocusedElement = document.activeElement;

    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Close navigation menu");

    navigation.classList.add("is-open");
    header.classList.add("menu-active");
    document.body.classList.add("menu-open");

    const focusableItems = getFocusableMenuItems();

    if (focusableItems.length) {
      window.setTimeout(function () {
        focusableItems[0].focus();
      }, 220);
    }
  }

  function closeMenu(options) {
    const settings = options || {};

    if (!menuButton || !navigation || !menuIsOpen) {
      return;
    }

    menuIsOpen = false;

    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation menu");

    navigation.classList.remove("is-open");
    header.classList.remove("menu-active");
    document.body.classList.remove("menu-open");

    if (
      settings.restoreFocus &&
      lastFocusedElement instanceof HTMLElement
    ) {
      lastFocusedElement.focus();
    }
  }

  if (menuButton && navigation) {
    menuButton.addEventListener("click", function () {
      if (menuIsOpen) {
        closeMenu({
          restoreFocus: true
        });
      } else {
        openMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!menuIsOpen) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();

        closeMenu({
          restoreFocus: true
        });

        return;
      }

      if (event.key === "Tab") {
        const focusableItems = getFocusableMenuItems();
        const firstItem = focusableItems[0];
        const lastItem = focusableItems[focusableItems.length - 1];

        if (!firstItem || !lastItem) {
          return;
        }

        if (
          event.shiftKey &&
          document.activeElement === firstItem
        ) {
          event.preventDefault();
          menuButton.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === menuButton
        ) {
          event.preventDefault();
          firstItem.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === lastItem
        ) {
          event.preventDefault();
          menuButton.focus();
        }
      }
    });

    document.addEventListener("click", function (event) {
      if (!menuIsOpen) {
        return;
      }

      const clickedInsideNavigation = navigation.contains(event.target);
      const clickedMenuButton = menuButton.contains(event.target);

      if (!clickedInsideNavigation && !clickedMenuButton) {
        closeMenu({
          restoreFocus: false
        });
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1100 && menuIsOpen) {
        closeMenu({
          restoreFocus: false
        });
      }
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (event) {
      const targetId = anchor.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.querySelector(targetId);

      if (!target) {
        return;
      }

      event.preventDefault();

      closeMenu({
        restoreFocus: false
      });

      target.scrollIntoView({
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
        block: "start"
      });

      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", targetId);
      }
    });
  });

  const revealElements = Array.from(
    document.querySelectorAll(".reveal")
  );

  if (
    "IntersectionObserver" in window &&
    !prefersReducedMotion.matches
  ) {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    revealElements.forEach(function (element) {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach(function (element) {
      element.classList.add("is-visible");
    });
  }

  const portraitImage = document.querySelector(".portrait-image");

  if (portraitImage) {
    const portraitFrame = portraitImage.closest(".portrait-frame");

    function showPortrait() {
      portraitImage.classList.remove("is-missing");

      if (portraitFrame) {
        portraitFrame.classList.add("has-image");
      }
    }

    function showPortraitPlaceholder() {
      portraitImage.classList.add("is-missing");

      if (portraitFrame) {
        portraitFrame.classList.remove("has-image");
      }
    }

    portraitImage.addEventListener("load", showPortrait);
    portraitImage.addEventListener(
      "error",
      showPortraitPlaceholder
    );

    if (portraitImage.complete) {
      if (portraitImage.naturalWidth > 0) {
        showPortrait();
      } else {
        showPortraitPlaceholder();
      }
    }
  }

  const counterElements = Array.from(
    document.querySelectorAll("[data-counter]")
  );

  function animateCounter(element) {
    const rawText = element.textContent
      .trim()
      .replace(/,/g, "");

    const target = Number(rawText);

    if (!Number.isFinite(target) || target < 0) {
      return;
    }

    if (prefersReducedMotion.matches) {
      element.textContent = target.toLocaleString();
      return;
    }

    const duration = 1100;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      element.textContent = Math.round(
        target * easedProgress
      ).toLocaleString();

      if (progress < 1) {
        window.requestAnimationFrame(updateCounter);
      }
    }

    window.requestAnimationFrame(updateCounter);
  }

  if (
    counterElements.length &&
    "IntersectionObserver" in window
  ) {
    const counterObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.6
      }
    );

    counterElements.forEach(function (counter) {
      counterObserver.observe(counter);
    });
  }

  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");

  if (contactForm && formStatus) {
    const formFields = {
      name: contactForm.elements.namedItem("name"),
      email: contactForm.elements.namedItem("email"),
      subject: contactForm.elements.namedItem("subject"),
      message: contactForm.elements.namedItem("message")
    };

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function getValidationMessage(fieldName, value) {
      if (!value) {
        return "This field is required.";
      }

      if (fieldName === "name" && value.length < 2) {
        return "Please enter at least 2 characters.";
      }

      if (
        fieldName === "email" &&
        !emailPattern.test(value)
      ) {
        return "Please enter a valid email address.";
      }

      if (
        fieldName === "subject" &&
        value.length < 3
      ) {
        return "Please enter a clearer subject.";
      }

      if (
        fieldName === "message" &&
        value.length < 20
      ) {
        return "Please write at least 20 characters.";
      }

      return "";
    }

    function validateField(fieldName) {
      const field = formFields[fieldName];
      const errorElement = document.getElementById(
        fieldName + "-error"
      );

      if (!field || !errorElement) {
        return true;
      }

      const errorMessage = getValidationMessage(
        fieldName,
        field.value.trim()
      );

      errorElement.textContent = errorMessage;

      field.setAttribute(
        "aria-invalid",
        errorMessage ? "true" : "false"
      );

      return !errorMessage;
    }

    Object.keys(formFields).forEach(function (fieldName) {
      const field = formFields[fieldName];

      if (!field) {
        return;
      }

      field.addEventListener("blur", function () {
        validateField(fieldName);
      });

      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") {
          validateField(fieldName);
        }

        formStatus.className = "form-status";
        formStatus.textContent = "";
      });
    });

    contactForm.addEventListener("submit", function (event) {
  const fieldNames = Object.keys(formFields);
  const validationResults = fieldNames.map(validateField);
  const formIsValid = validationResults.every(Boolean);

  if (!formIsValid) {
    event.preventDefault();

    formStatus.className = "form-status is-visible is-error";
    formStatus.textContent =
      "Please correct the highlighted fields before sending.";

    const firstInvalidField = fieldNames
      .map(function (fieldName) {
        return formFields[fieldName];
      })
      .find(function (field) {
        return (
          field &&
          field.getAttribute("aria-invalid") === "true"
        );
      });

    if (firstInvalidField) {
      firstInvalidField.focus();
    }

    return;
  }

  formStatus.className = "form-status is-visible is-success";
  formStatus.textContent = "Sending your message...";
});

      contactForm.reset();

      fieldNames.forEach(function (fieldName) {
        const field = formFields[fieldName];
        const errorElement = document.getElementById(
          fieldName + "-error"
        );

        if (field) {
          field.removeAttribute("aria-invalid");
        }

        if (errorElement) {
          errorElement.textContent = "";
        }
      });

      formStatus.focus();
    });
  }

  const currentYear = document.getElementById("current-year");

  if (currentYear) {
    currentYear.textContent = String(new Date().getFullYear());
  }
})();
