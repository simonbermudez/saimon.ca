// Main application: page UI + the WebGL Tesla stage
class SaimonApp {
    constructor() {
        this.stage = null;
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.documentElement.classList.add('js');

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    async setup() {
        this.initializeNavigation();
        this.initializeScrollEffects();
        this.initializeCounters();
        this.initializeToolSpotlight();
        this.initializeContactForm();
        this.initializeClusterCarousel();

        // Never keep the boot screen up longer than this
        setTimeout(() => this.hideLoadingScreen(), 4000);
        try {
            await this.initializeStage();
        } catch (error) {
            console.error('WebGL stage unavailable:', error);
            document.documentElement.classList.add('no-webgl');
            document.body.classList.add('no-webgl');
            this.hideLoadingScreen();
        }
    }

    async initializeStage() {
        const canvas = document.getElementById('gl');
        if (!canvas) throw new Error('Missing #gl canvas');

        // Wordmark textures are drawn with the web fonts, so wait (briefly) for them
        if (document.fonts?.ready) {
            await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
        }

        const { GpuStage } = await import('./gpu/stage.js');
        this.stage = new GpuStage(canvas, {
            reducedMotion: this.isReducedMotion,
            callouts: [...document.querySelectorAll('.callout')],
            clusterSticky: document.querySelector('.cluster-sticky'),
        });
        this.stage.onFirstFrame = () => setTimeout(() => this.hideLoadingScreen(), 350);
        this.stage.start();

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stage.stop();
            else this.stage.start();
        });
    }

    initializeNavigation() {
        const nav = document.getElementById('site-nav');
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuIcon = document.getElementById('menu-icon');
        const closeIcon = document.getElementById('close-icon');

        const setMenu = (open) => {
            mobileMenu.classList.toggle('hidden', !open);
            mobileMenuButton.setAttribute('aria-expanded', String(open));
            menuIcon?.classList.toggle('hidden', open);
            closeIcon?.classList.toggle('hidden', !open);
            nav.classList.toggle('is-scrolled', open || window.scrollY > 24);
        };

        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                setMenu(mobileMenuButton.getAttribute('aria-expanded') !== 'true');
            });
            mobileMenu.querySelectorAll('a').forEach((link) => {
                link.addEventListener('click', () => setMenu(false));
            });
            document.addEventListener('click', (e) => {
                if (!nav.contains(e.target)) setMenu(false);
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
                    setMenu(false);
                    mobileMenuButton.focus();
                }
            });
            window.addEventListener('resize', () => {
                if (window.innerWidth >= 1024) setMenu(false);
            });
        }

        // Smooth scrolling for in-page links (scroll-margin handles the nav offset)
        document.querySelectorAll('a.nav-link[href^="#"]').forEach((link) => {
            link.addEventListener('click', (e) => {
                const target = document.querySelector(link.getAttribute('href'));
                if (!target) return;
                e.preventDefault();
                target.scrollIntoView({ behavior: this.isReducedMotion ? 'auto' : 'smooth' });
                history.replaceState(null, '', link.getAttribute('href'));
            });
        });

        // Frosted nav once scrolled
        const onScroll = () => {
            if (mobileMenu?.classList.contains('hidden')) {
                nav.classList.toggle('is-scrolled', window.scrollY > 24);
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        // Active section highlight
        const links = [...document.querySelectorAll('.nav-links .nav-link')];
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${entry.target.id}`));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        document.querySelectorAll('main > header, main > section').forEach((s) => observer.observe(s));
    }

    initializeScrollEffects() {
        const items = document.querySelectorAll('.reveal');
        if (this.isReducedMotion || !('IntersectionObserver' in window)) {
            items.forEach((el) => el.classList.add('is-visible'));
            return;
        }

        // Stagger siblings that enter together
        const observer = new IntersectionObserver((entries) => {
            const entering = entries.filter((e) => e.isIntersecting);
            entering.forEach((entry, i) => {
                entry.target.style.setProperty('--delay', `${Math.min(i, 8) * 70}ms`);
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

        items.forEach((el) => observer.observe(el));
    }

    initializeCounters() {
        const counters = document.querySelectorAll('[data-count]');
        if (this.isReducedMotion) return;

        const run = (el) => {
            const end = parseFloat(el.dataset.count);
            const decimals = parseInt(el.dataset.decimals || '0', 10);
            const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
            const start = performance.now();
            const duration = 1800;
            const step = (now) => {
                const t = Math.min(1, (now - start) / duration);
                const eased = 1 - Math.pow(1 - t, 4);
                el.textContent = fmt.format(end * eased);
                if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setTimeout(() => run(entry.target), 600);
                    observer.unobserve(entry.target);
                }
            });
        });
        counters.forEach((el) => observer.observe(el));
    }

    initializeToolSpotlight() {
        document.querySelectorAll('.tool-card').forEach((card) => {
            card.addEventListener('pointermove', (e) => {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${e.clientX - r.left}px`);
                card.style.setProperty('--my', `${e.clientY - r.top}px`);
            });
        });
    }

    initializeContactForm() {
        const form = document.getElementById('contact-form');
        const successDiv = document.getElementById('form-success');
        const errorDiv = document.getElementById('form-error');
        const submitButton = form?.querySelector('button[type="submit"]');

        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Clear previous messages
            successDiv.classList.add('hidden');
            errorDiv.classList.add('hidden');

            // Validate form
            if (!this.validateForm(form)) {
                return;
            }

            // Show loading state
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;

            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            try {
                let response;

                // Option 1: Formspree (recommended)
                if (window.FORMSPREE_ID) {
                    response = await fetch(`https://formspree.io/f/${window.FORMSPREE_ID}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });
                }
                // Option 2: Netlify Forms (if hosted on Netlify)
                else if (window.location.hostname.includes('netlify')) {
                    response = await fetch('/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            'form-name': 'contact',
                            ...data
                        })
                    });
                }
                // Option 3: EmailJS (client-side email service)
                else if (window.emailjs && window.EMAILJS_CONFIG) {
                    await window.emailjs.send(
                        window.EMAILJS_CONFIG.serviceID,
                        window.EMAILJS_CONFIG.templateID,
                        {
                            from_name: data.name,
                            from_email: data.email,
                            message: data.message
                        },
                        window.EMAILJS_CONFIG.publicKey
                    );
                    response = { ok: true };
                }
                // Fallback: Show instructions for manual setup
                else {
                    throw new Error('No email service configured');
                }

                if (response.ok) {
                    successDiv.classList.remove('hidden');
                    form.reset();
                    successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    throw new Error('Network response was not ok');
                }

            } catch (error) {
                console.error('Form submission error:', error);

                let errorMessage = 'There was an error sending your message. ';

                if (error.message === 'No email service configured') {
                    errorMessage += 'Please contact us directly at your-email@saimon.ca or set up a form service.';
                } else {
                    errorMessage += 'Please try again or contact us directly.';
                }

                errorDiv.innerHTML = `
                    <p>${errorMessage}</p>
                    <p class="mt-2 text-sm">Alternative: Email us directly at <a href="mailto:contact@saimon.ca">contact@saimon.ca</a></p>
                `;
                errorDiv.classList.remove('hidden');
                errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } finally {
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }

    validateForm(form) {
        const fields = [
            { name: 'name', required: true, type: 'text' },
            { name: 'email', required: true, type: 'email' },
            { name: 'message', required: true, type: 'text', minLength: 10 }
        ];

        let isValid = true;

        fields.forEach(field => {
            const input = form.querySelector(`[name="${field.name}"]`);
            const errorDiv = document.getElementById(`${field.name}-error`);
            let errorMessage = '';

            if (field.required && !input.value.trim()) {
                errorMessage = `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required.`;
                isValid = false;
            } else if (field.type === 'email' && input.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    errorMessage = 'Please enter a valid email address.';
                    isValid = false;
                }
            } else if (field.minLength && input.value.length < field.minLength) {
                errorMessage = `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} must be at least ${field.minLength} characters.`;
                isValid = false;
            }

            if (errorMessage) {
                errorDiv.textContent = errorMessage;
                errorDiv.classList.remove('hidden');
                input.classList.add('is-invalid');
            } else {
                errorDiv.classList.add('hidden');
                input.classList.remove('is-invalid');
            }
        });

        return isValid;
    }

    initializeClusterCarousel() {
        const carousel = document.getElementById('cluster-carousel');
        if (!carousel) return;

        // Mouse drag scrolling for the horizontal node strip (small screens)
        let isDown = false;
        let startX;
        let scrollLeft;

        carousel.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        });
        ['mouseleave', 'mouseup'].forEach((evt) => carousel.addEventListener(evt, () => { isDown = false; }));
        carousel.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - carousel.offsetLeft;
            carousel.scrollLeft = scrollLeft - (x - startX) * 2;
        });
    }

    hideLoadingScreen() {
        document.getElementById('loading-screen')?.classList.add('is-done');
    }
}

const app = new SaimonApp();

export default SaimonApp;
export { app };
