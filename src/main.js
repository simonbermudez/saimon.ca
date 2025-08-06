import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Main application class
class SaimonApp {
    constructor() {
        this.scenes = {};
        this.renderers = {};
        this.cameras = {};
        this.frameId = null;
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        this.init();
    }

    async init() {
        // Wait for DOM to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            await this.setup();
        }
    }

    async setup() {
        try {
            // Initialize all components
            await this.initializeScenes();
            this.initializeNavigation();
            this.initializeScrollEffects();
            this.initializeContactForm();
            this.initializeClusterCarousel();
            
            // Start render loop
            this.animate();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.hideLoadingScreen();
        }
    }

    async initializeScenes() {
        // Initialize hero scene
        await this.createHeroScene();
        
        // Initialize about scene
        await this.createAboutScene();
        
        // Initialize cluster GPU cards
        this.createClusterCards();
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    async createHeroScene() {
        const canvas = document.getElementById('hero-canvas');
        if (!canvas) return;

        // Create scene, camera, renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            canvas, 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance'
        });
        
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        // Store references
        this.scenes.hero = scene;
        this.cameras.hero = camera;
        this.renderers.hero = renderer;

        // Create GPU geometry (simplified representation)
        const gpuGeometry = new THREE.BoxGeometry(4, 0.8, 6);
        
        // Create materials with neon glow effect
        const gpuMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d3748,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x00ffd1,
            emissiveIntensity: 0.1
        });

        // Create GPU mesh
        const gpu = new THREE.Mesh(gpuGeometry, gpuMaterial);
        scene.add(gpu);

        // Add cooling fans (simple cylinders)
        const fanGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 8);
        const fanMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a202c,
            metalness: 0.6,
            roughness: 0.4
        });

        const fan1 = new THREE.Mesh(fanGeometry, fanMaterial);
        fan1.position.set(-1.2, 0.5, 1);
        fan1.rotation.x = Math.PI / 2;
        scene.add(fan1);

        const fan2 = new THREE.Mesh(fanGeometry, fanMaterial);
        fan2.position.set(1.2, 0.5, 1);
        fan2.rotation.x = Math.PI / 2;
        scene.add(fan2);

        // Store fan references for animation
        this.heroFans = [fan1, fan2];
        this.heroGPU = gpu;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x00ffd1, 1, 100);
        pointLight.position.set(0, 5, 5);
        scene.add(pointLight);

        const pointLight2 = new THREE.PointLight(0xff4d97, 0.5, 100);
        pointLight2.position.set(-5, -2, 3);
        scene.add(pointLight2);

        // Position camera
        camera.position.set(0, 2, 8);
        camera.lookAt(0, 0, 0);

        // Add particles for ambiance
        this.createParticles(scene, 'hero');
    }

    async createAboutScene() {
        const canvas = document.getElementById('about-canvas');
        if (!canvas) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            canvas, 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance'
        });
        
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        this.scenes.about = scene;
        this.cameras.about = camera;
        this.renderers.about = renderer;

        // Create parallax particle field
        this.createParticles(scene, 'about');

        // Add subtle lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        scene.add(ambientLight);

        camera.position.z = 5;
    }

    createParticles(scene, sceneType) {
        const particleCount = this.isReducedMotion ? 50 : 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 50;     // x
            positions[i + 1] = (Math.random() - 0.5) * 50; // y
            positions[i + 2] = (Math.random() - 0.5) * 50; // z
            
            velocities[i] = (Math.random() - 0.5) * 0.02;     // vx
            velocities[i + 1] = (Math.random() - 0.5) * 0.02; // vy
            velocities[i + 2] = (Math.random() - 0.5) * 0.02; // vz
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: sceneType === 'hero' ? 0x00ffd1 : 0x484f58,
            size: sceneType === 'hero' ? 0.1 : 0.05,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        // Store particle data for animation
        particles.userData = { velocities, sceneType };
        
        if (sceneType === 'hero') {
            this.heroParticles = particles;
        } else {
            this.aboutParticles = particles;
        }
    }

    createClusterCards() {
        const clusterCards = document.querySelectorAll('.gpu-card-3d');
        
        clusterCards.forEach((card, index) => {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(50, card.clientWidth / card.clientHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                alpha: true,
                powerPreference: 'low-power'
            });
            
            renderer.setSize(card.clientWidth, card.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setClearColor(0x000000, 0);
            
            // Create mini GPU card
            const geometry = new THREE.BoxGeometry(2, 0.4, 3);
            const material = new THREE.MeshStandardMaterial({
                color: 0x2d3748,
                metalness: 0.7,
                roughness: 0.3,
                emissive: 0x00ffd1,
                emissiveIntensity: 0.05
            });
            
            const gpu = new THREE.Mesh(geometry, material);
            scene.add(gpu);
            
            // Add lighting
            const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
            scene.add(ambientLight);
            
            const pointLight = new THREE.PointLight(0x00ffd1, 0.5, 50);
            pointLight.position.set(2, 2, 2);
            scene.add(pointLight);
            
            camera.position.set(0, 1, 4);
            camera.lookAt(0, 0, 0);
            
            // Append canvas to card
            card.appendChild(renderer.domElement);
            
            // Store reference
            this.scenes[`cluster-${index}`] = { scene, camera, renderer, gpu };
        });
    }

    initializeNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuIcon = document.getElementById('menu-icon');
        const closeIcon = document.getElementById('close-icon');
        
        // Mobile menu toggle functionality
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
                
                // Toggle menu visibility
                mobileMenu.classList.toggle('hidden');
                
                // Update button state
                mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
                
                // Toggle icons
                if (menuIcon && closeIcon) {
                    menuIcon.classList.toggle('hidden');
                    closeIcon.classList.toggle('hidden');
                }
            });

            // Close mobile menu when clicking on a nav link
            const mobileNavLinks = mobileMenu.querySelectorAll('.nav-link');
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                    mobileMenuButton.setAttribute('aria-expanded', 'false');
                    
                    // Reset icons
                    if (menuIcon && closeIcon) {
                        menuIcon.classList.remove('hidden');
                        closeIcon.classList.add('hidden');
                    }
                });
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuButton.contains(e.target) && !mobileMenu.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                    mobileMenuButton.setAttribute('aria-expanded', 'false');
                    
                    // Reset icons
                    if (menuIcon && closeIcon) {
                        menuIcon.classList.remove('hidden');
                        closeIcon.classList.add('hidden');
                    }
                }
            });

            // Close mobile menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                    mobileMenuButton.setAttribute('aria-expanded', 'false');
                    
                    // Reset icons
                    if (menuIcon && closeIcon) {
                        menuIcon.classList.remove('hidden');
                        closeIcon.classList.add('hidden');
                    }
                    
                    // Return focus to menu button
                    mobileMenuButton.focus();
                }
            });

            // Close mobile menu on window resize if desktop size is reached
            window.addEventListener('resize', () => {
                if (window.innerWidth >= 1024) { // lg breakpoint
                    mobileMenu.classList.add('hidden');
                    mobileMenuButton.setAttribute('aria-expanded', 'false');
                    
                    // Reset icons
                    if (menuIcon && closeIcon) {
                        menuIcon.classList.remove('hidden');
                        closeIcon.classList.add('hidden');
                    }
                }
            });
        }
        
        // Smooth scrolling for all navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const target = document.querySelector(targetId);
                
                if (target) {
                    const offsetTop = target.offsetTop - 80; // Account for nav height
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Update active nav link on scroll
        window.addEventListener('scroll', this.throttle(() => {
            const sections = document.querySelectorAll('section');
            const scrollPos = window.scrollY + 100;
            
            sections.forEach(section => {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                
                if (scrollPos >= top && scrollPos < top + height) {
                    navLinks.forEach(link => link.classList.remove('text-neon-cyan'));
                    const activeLink = document.querySelector(`a[href="#${section.id}"]`);
                    if (activeLink) {
                        activeLink.classList.add('text-neon-cyan');
                    }
                }
            });
        }, 100));
    }

    initializeScrollEffects() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -10% 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                }
            });
        }, observerOptions);

        // Observe sections for animations
        const sections = document.querySelectorAll('section');
        sections.forEach(section => observer.observe(section));

        // Observe tool cards
        const toolCards = document.querySelectorAll('.tool-card');
        toolCards.forEach(card => observer.observe(card));
    }

    initializeContactForm() {
        const form = document.getElementById('contact-form');
        const successDiv = document.getElementById('form-success');
        const errorDiv = document.getElementById('form-error');

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
            
            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            try {
                // Simulate API call (replace with actual endpoint)
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    successDiv.classList.remove('hidden');
                    form.reset();
                } else {
                    throw new Error('Network response was not ok');
                }
                
            } catch (error) {
                console.error('Form submission error:', error);
                errorDiv.classList.remove('hidden');
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
                input.classList.add('border-red-400');
            } else {
                errorDiv.classList.add('hidden');
                input.classList.remove('border-red-400');
            }
        });

        return isValid;
    }

    initializeClusterCarousel() {
        const carousel = document.getElementById('cluster-carousel');
        if (!carousel) return;

        // Add touch/mouse drag scrolling
        let isDown = false;
        let startX;
        let scrollLeft;

        carousel.addEventListener('mousedown', (e) => {
            isDown = true;
            carousel.style.cursor = 'grabbing';
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        });

        carousel.addEventListener('mouseleave', () => {
            isDown = false;
            carousel.style.cursor = 'grab';
        });

        carousel.addEventListener('mouseup', () => {
            isDown = false;
            carousel.style.cursor = 'grab';
        });

        carousel.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - carousel.offsetLeft;
            const walk = (x - startX) * 2;
            carousel.scrollLeft = scrollLeft - walk;
        });
    }

    animate() {
        this.frameId = requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        // Animate hero scene
        if (this.heroGPU && !this.isReducedMotion) {
            this.heroGPU.rotation.y = Math.sin(time * 0.5) * 0.3;
            this.heroGPU.rotation.x = Math.sin(time * 0.3) * 0.1;
        }

        if (this.heroFans && !this.isReducedMotion) {
            this.heroFans.forEach(fan => {
                fan.rotation.z += 0.1;
            });
        }

        // Animate particles
        this.animateParticles(this.heroParticles, time);
        this.animateParticles(this.aboutParticles, time);

        // Animate cluster cards
        Object.keys(this.scenes).forEach(key => {
            if (key.startsWith('cluster-')) {
                const sceneData = this.scenes[key];
                if (sceneData.gpu && !this.isReducedMotion) {
                    sceneData.gpu.rotation.y += 0.01;
                }
                sceneData.renderer.render(sceneData.scene, sceneData.camera);
            }
        });

        // Render main scenes
        if (this.scenes.hero && this.cameras.hero && this.renderers.hero) {
            this.renderers.hero.render(this.scenes.hero, this.cameras.hero);
        }

        if (this.scenes.about && this.cameras.about && this.renderers.about) {
            this.renderers.about.render(this.scenes.about, this.cameras.about);
        }
    }

    animateParticles(particles, time) {
        if (!particles || this.isReducedMotion) return;

        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.userData.velocities;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];

            // Wrap particles around
            if (Math.abs(positions[i]) > 25) positions[i] *= -1;
            if (Math.abs(positions[i + 1]) > 25) positions[i + 1] *= -1;
            if (Math.abs(positions[i + 2]) > 25) positions[i + 2] *= -1;
        }

        particles.geometry.attributes.position.needsUpdate = true;
        particles.rotation.y += 0.001;
    }

    handleResize() {
        Object.keys(this.cameras).forEach(key => {
            const camera = this.cameras[key];
            const renderer = this.renderers[key];
            const canvas = renderer.domElement;

            if (canvas.parentElement) {
                const width = canvas.parentElement.clientWidth;
                const height = canvas.parentElement.clientHeight;

                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            }
        });

        // Resize cluster cards
        Object.keys(this.scenes).forEach(key => {
            if (key.startsWith('cluster-')) {
                const sceneData = this.scenes[key];
                const canvas = sceneData.renderer.domElement;
                const container = canvas.parentElement;
                
                if (container) {
                    sceneData.camera.aspect = container.clientWidth / container.clientHeight;
                    sceneData.camera.updateProjectionMatrix();
                    sceneData.renderer.setSize(container.clientWidth, container.clientHeight);
                }
            }
        });
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.5s ease-out';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // Cleanup method
    destroy() {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
        }

        // Dispose of all Three.js resources
        Object.keys(this.scenes).forEach(key => {
            const scene = this.scenes[key];
            if (scene.dispose) {
                scene.dispose();
            }
        });

        Object.keys(this.renderers).forEach(key => {
            const renderer = this.renderers[key];
            if (renderer.dispose) {
                renderer.dispose();
            }
        });
    }
}

// Initialize the application
const app = new SaimonApp();

// Handle page visibility change to pause/resume animations
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (app.frameId) {
            cancelAnimationFrame(app.frameId);
        }
    } else {
        app.animate();
    }
});

// Export for potential external use
export default SaimonApp;
