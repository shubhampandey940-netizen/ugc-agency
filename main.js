// MAIN JAVASCRIPT - AI STUDIO

document.addEventListener('DOMContentLoaded', () => {
  // 1. INITIALIZE LUCIDE ICONS
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // 2. INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS
  const fadeElements = document.querySelectorAll('.fade-in');
  const fadeObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  fadeElements.forEach(el => fadeObserver.observe(el));

  // 3. STICKY NAVBAR
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 4. MOBILE NAV TOGGLE
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');
  
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        const isMenu = icon.getAttribute('data-lucide') === 'menu';
        icon.setAttribute('data-lucide', isMenu ? 'x' : 'menu');
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    });

    // Close menu when link is clicked
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.setAttribute('data-lucide', 'menu');
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        }
      });
    });
  }

  // 5. MOUSE SPOTLIGHT EFFECT (SERVICES CARDS)
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // 6. VIDEO HOVER PLAY/PAUSE (PORTFOLIO GRIDS)
  const portfolioCards = document.querySelectorAll('.portfolio-card');
  portfolioCards.forEach(card => {
    const video = card.querySelector('.portfolio-video');
    
    if (video) {
      // Play on hover
      card.addEventListener('mouseenter', () => {
        video.play().catch(err => {
          // Ignore autoplay blocks
          console.log('Video autoplay prevented on hover: ', err.message);
        });
      });

      // Pause when leaving
      card.addEventListener('mouseleave', () => {
        video.pause();
      });
    }
  });

  // 7. LIGHTBOX MODAL FOR PORTFOLIO VIDEOS
  const lightbox = document.getElementById('video-lightbox');
  const lightboxVideo = document.getElementById('lightbox-video');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxCategory = document.getElementById('lightbox-category');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDesc = document.getElementById('lightbox-desc');

  const openLightbox = (card) => {
    const videoSrc = card.getAttribute('data-video-src');
    const title = card.getAttribute('data-title');
    const category = card.getAttribute('data-category');
    const desc = card.getAttribute('data-desc');

    if (!videoSrc) return;

    // Pause all card videos first
    document.querySelectorAll('.portfolio-video').forEach(v => v.pause());

    // Populate and open lightbox
    lightboxVideo.src = videoSrc;
    lightboxCategory.textContent = category;
    lightboxTitle.textContent = title;
    lightboxDesc.textContent = desc;

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Lock background scrolling

    // Auto play in lightbox (with controls and audio potential)
    lightboxVideo.muted = false;
    lightboxVideo.play().catch(err => {
      console.log('Autoplay with audio blocked. Playing muted first...', err);
      lightboxVideo.muted = true;
      lightboxVideo.play().catch(e => console.error('Failed to play video in modal: ', e));
    });
  };

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Unlock scrolling
    lightboxVideo.pause();
    lightboxVideo.src = '';
  };

  // Attach click listeners to cards
  portfolioCards.forEach(card => {
    // Click expand button
    const expandBtn = card.querySelector('.expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(card);
      });
    }

    // Click card container (excluding video controls area)
    card.addEventListener('click', (e) => {
      // Don't open if they specifically clicked controls elements on the video
      if (e.target.tagName.toLowerCase() === 'video' && e.target.hasAttribute('controls')) {
        // Let browser handle native controls clicks
        return;
      }
      openLightbox(card);
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  // Click outside content to close
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  // Escape key close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  // 8. CONTACT FORM SIMULATION
  const contactForm = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');
  const resetFormBtn = document.getElementById('reset-form-btn');

  if (contactForm && formSuccess) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Show submitting state on button
      const submitBtn = contactForm.querySelector('.btn-submit');
      const submitText = submitBtn.querySelector('span');
      const submitIcon = submitBtn.querySelector('i');
      
      const originalText = submitText.textContent;
      submitText.textContent = 'Sending...';
      submitBtn.style.opacity = '0.8';
      submitBtn.disabled = true;

      // Simulate network request
      setTimeout(() => {
        contactForm.classList.add('inactive');
        formSuccess.classList.add('active');
        
        // Reset button state
        submitText.textContent = originalText;
        submitBtn.style.opacity = '';
        submitBtn.disabled = false;
      }, 1200);
    });
  }

  if (resetFormBtn && contactForm && formSuccess) {
    resetFormBtn.addEventListener('click', () => {
      contactForm.reset();
      formSuccess.classList.remove('active');
      contactForm.classList.remove('inactive');
    });
  }
});
