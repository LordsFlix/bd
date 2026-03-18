// Data for the planets and memories
const memories = [
    {
        id: "planet-1",
        title: "The Day We Met (3rd March 2025)",
        message: "From that moment on, everything felt brighter. You made ordinary days special.",
        color: 0xffb7b2, // Soft pink/peach
        size: 1.2,
        distance: 12,
        speed: 0.0008, // Slowed down significantly
        image: 'planet-1-image.png'
    },
    {
        id: "planet-2",
        title: "Our First Long Conversation",
        message: "We talked for hours and it felt like minutes. I knew I had found someone truly amazing.",
        color: 0xe2f0cb, // Soft light green
        size: 1.5,
        distance: 17,
        speed: 0.0006,
        image: 'planet-2-image.jpg'
    },
    {
        id: "planet-3",
        title: "Our Funniest Moment",
        message: "I can still feel your laugh echoing in my mind. Your smile is my favorite thing in the world.",
        color: 0xffdac1, // Soft orange/peach
        size: 1.0,
        distance: 22,
        speed: 0.0009,
        image: 'planet-3-image.png'
    },
    {
        id: "planet-4",
        title: "My Favorite Memory With You",
        message: "Just being together, no matter where or what we were doing, is what I cherish most.",
        color: 0xc7ceea, // Soft periwinkle/blue
        size: 1.8,
        distance: 28,
        speed: 0.0005,
        image: 'planet-4-image.png'
    },
    {
        id: "planet-5",
        title: "Why You Are Special To Me",
        message: "You are kind, beautiful, and you understand me like no one else does. You are my universe.",
        color: 0xff9a9e, // Vibrant soft pink
        size: 1.4,
        distance: 35,
        speed: 0.0007,
        image: 'planet-5-image.jpg'
    }
];

// State
const state = {
    visitedPlanets: new Set(),
    allPlanetsVisited: false,
    birthdayUnlocked: false,
    focusedPlanet: null,
    isInteracting: true, // Controls if orbit works
    audioContext: null
};

// DOM Elements
const canvasContainer = document.getElementById('canvas-container');
const landingPage = document.getElementById('landing-page');
const enterBtn = document.getElementById('enter-btn');
const musicCheckbox = document.getElementById('music-checkbox');
const bgMusic = document.getElementById('bg-music');
const hoverLabel = document.getElementById('hover-label');
const progressCounter = document.getElementById('progress-counter');
const visitedCountEl = document.getElementById('visited-count');
const totalCountEl = document.getElementById('total-count');

if (totalCountEl) totalCountEl.textContent = memories.length;

const memoryModal = document.getElementById('memory-modal');
const memoryTitle = document.getElementById('memory-title');
const memoryText = document.getElementById('memory-text');
const closeMemoryBtn = document.getElementById('close-memory-btn');

const birthdayModal = document.getElementById('birthday-modal');
const closeBirthdayBtn = document.getElementById('close-birthday-btn');

// --- Three.js Setup ---

const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 60); // Initial angled view

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimization for high DPI
canvasContainer.appendChild(renderer.domElement);

// Orbit Controls (for user exploration)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 150;
controls.autoRotate = true; // Slowly rotate the whole scene initially
controls.autoRotateSpeed = 0.5;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 2, 200);
pointLight.position.set(0, 0, 0); // Sun/Center
scene.add(pointLight);

// --- Starfield Background ---
function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.15,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    const starVertices = [];
    for (let i = 0; i < 3000; i++) {
        const x = (Math.random() - 0.5) * 600;
        const y = (Math.random() - 0.5) * 600;
        const z = (Math.random() - 0.5) * 600;

        // Don't place stars too close to center
        if (Math.sqrt(x * x + y * y + z * z) > 40) {
            starVertices.push(x, y, z);
        }
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    return stars;
}
const starfield = createStarfield();

// --- Planets ---
const planetMeshes = [];
const planetGroup = new THREE.Group();
scene.add(planetGroup);

// Central glowing core (Sun-like object, but subtle)
const coreGeometry = new THREE.SphereGeometry(3, 32, 32);
const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0x2a1c4d, // Deep purple center
});
const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
scene.add(coreMesh);

// Add glowing aura to core
const auraGeometry = new THREE.SphereGeometry(4, 32, 32);
const auraMaterial = new THREE.MeshBasicMaterial({
    color: 0x6b21a8,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
});
const auraMesh = new THREE.Mesh(auraGeometry, auraMaterial);
scene.add(auraMesh);


function createPlanet(data, index) {
    const geometry = new THREE.SphereGeometry(data.size, 64, 64);

    // Create an interesting material - maybe some procedural noise or just a solid color with phong
    const material = new THREE.MeshStandardMaterial({
        color: data.color,
        roughness: 0.6,
        metalness: 0.1,
    });

    const planet = new THREE.Mesh(geometry, material);

    // Add a slight glow
    const glowGeo = new THREE.SphereGeometry(data.size * 1.15, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    planet.add(glow);

    // Initial random angle
    const angle = Math.random() * Math.PI * 2;
    planet.userData = {
        ...data,
        currentAngle: angle,
        orbitY: (Math.random() - 0.5) * 10, // Slight tilt in orbit orbit
        isBirthday: false
    };

    // Position it
    planet.position.x = Math.cos(angle) * data.distance;
    planet.position.z = Math.sin(angle) * data.distance;
    planet.position.y = planet.userData.orbitY;

    planetGroup.add(planet);
    planetMeshes.push(planet);

    // Optional: add a visible orbit ring
    const ringGeo = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 128);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
}

// Instantiate memory planets
memories.forEach((data, i) => createPlanet(data, i));

// --- Birthday Star (Hidden initially) ---
let birthdayStar;
function createBirthdayStar() {
    const data = {
        id: "birthday-star",
        title: "Birthday Star",
        color: 0xffd700, // Gold
        size: 4,
        distance: 0, // Appears in center or very close
        speed: 0
    };

    const geometry = new THREE.SphereGeometry(data.size, 64, 64);
    const material = new THREE.MeshStandardMaterial({
        color: data.color,
        emissive: 0xaa8800,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8,
    });
    birthdayStar = new THREE.Mesh(geometry, material);

    // Intense glow
    const glowGeo = new THREE.SphereGeometry(data.size * 1.3, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffa500,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    birthdayStar.add(new THREE.Mesh(glowGeo, glowMat));

    birthdayStar.userData = { ...data, isBirthday: true };
    birthdayStar.visible = false; // Hidden initially

    scene.add(birthdayStar);
}
createBirthdayStar();


// --- Interaction Logic ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredPlanet = null;

function onPointerMove(event) {
    if (!state.isInteracting) {
        hoverLabel.classList.add('hidden');
        document.body.style.cursor = 'default';
        return;
    }

    const clientX = event.clientX;
    const clientY = event.clientY;

    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    // Raycast
    raycaster.setFromCamera(mouse, camera);
    const interactables = [...planetMeshes];
    if (state.birthdayUnlocked && birthdayStar.visible) interactables.push(birthdayStar);

    const intersects = raycaster.intersectObjects(interactables, true);

    if (intersects.length > 0) {
        // Need to traverse up to find the group mesh if we hit a glow child, but raycasting interactables array explicitly checks main meshes
        let object = intersects[0].object;

        // Ensure we are selecting the planet, not its glow
        if (object.parent === birthdayStar || planetMeshes.includes(object.parent)) {
            object = object.parent;
        } else if (!planetMeshes.includes(object) && object !== birthdayStar) {
            return;
        }

        if (hoveredPlanet !== object) {
            hoveredPlanet = object;
            document.body.style.cursor = 'pointer';

            // Show label
            hoverLabel.textContent = object.userData.title;
            hoverLabel.classList.remove('hidden');

            // Slight scale up effect on hover
            gsap.to(object.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.3 });
        }

        // Update label position to follow planet in 2D space
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(object.matrixWorld);
        vector.project(camera);

        const x = (vector.x * .5 + .5) * window.innerWidth;
        const y = (vector.y * -.5 + .5) * window.innerHeight;

        hoverLabel.style.left = `${x}px`;
        hoverLabel.style.top = `${y - 30}px`; // Slightly above

    } else {
        if (hoveredPlanet) {
            // Reset scale
            gsap.to(hoveredPlanet.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
            hoveredPlanet = null;
            document.body.style.cursor = 'default';
            hoverLabel.classList.add('hidden');
        }
    }
}

function onClick(event) {
    if (!state.isInteracting) return;

    // Explicitly raycast on click to be robust for mobile
    const clientX = event.clientX;
    const clientY = event.clientY;
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const interactables = [...planetMeshes];
    if (state.birthdayUnlocked && birthdayStar.visible) interactables.push(birthdayStar);

    const intersects = raycaster.intersectObjects(interactables, true);
    let targetPlanet = null;
    if (intersects.length > 0) {
        let object = intersects[0].object;
        if (object.parent === birthdayStar || planetMeshes.includes(object.parent)) {
            object = object.parent;
        }
        if (planetMeshes.includes(object) || object === birthdayStar) {
            targetPlanet = object;
        }
    }

    const planet = targetPlanet || hoveredPlanet;
    if (!planet) return;

    state.isInteracting = false;
    hoverLabel.classList.add('hidden');
    controls.autoRotate = false;

    // Get absolute position of the planet
    const targetPosition = new THREE.Vector3();
    planet.getWorldPosition(targetPosition);

    // Calculate camera offset so the planet isn't fully covered
    const offsetLength = planet.userData.isBirthday ? planet.userData.size * 4 : planet.userData.size * 5;
    const offset = targetPosition.clone().normalize().multiplyScalar(offsetLength);

    // If planet is at center (like birthday star), offset in z
    if (targetPosition.length() < 0.1) {
        offset.set(0, 0, offsetLength);
    }

    const cameraDest = targetPosition.clone().add(offset);

    // Slightly shift camera up for better view
    cameraDest.y += 2;

    // Animate Camera
    gsap.to(camera.position, {
        x: cameraDest.x,
        y: cameraDest.y,
        z: cameraDest.z,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => controls.update()
    });

    // Animate Camera Target (Look At)
    gsap.to(controls.target, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 2,
        ease: "power2.inOut",
        onComplete: () => {
            openCard(planet);
        }
    });
}

function openCard(planet) {
    if (planet.userData.isBirthday) {
        // Birthday Star Logic
        birthdayModal.classList.remove('hidden');
        fireConfetti();
    } else {
        // Memory Planet Logic
        memoryTitle.textContent = planet.userData.title;
        memoryText.textContent = planet.userData.message;

        // Optional: dynamic photo replacing based on ID
        const photoPlaceholder = document.getElementById('memory-photo');
        if (planet.userData.image) {
            photoPlaceholder.style.backgroundImage = `url('assets/photos/${planet.userData.image}')`;
            photoPlaceholder.style.backgroundSize = 'cover';
            photoPlaceholder.style.backgroundPosition = 'center';
            photoPlaceholder.innerHTML = ''; // Clear the text
        } else {
            photoPlaceholder.style.backgroundImage = 'none';
            photoPlaceholder.innerHTML = '<span>Memory Photo</span>';
        }

        memoryModal.classList.remove('hidden');

        // Mark as visited
        state.visitedPlanets.add(planet.userData.id);

        if (visitedCountEl) {
            visitedCountEl.textContent = state.visitedPlanets.size;
            if (state.visitedPlanets.size === memories.length) {
                progressCounter.innerHTML = '<span class="glow-text-pink">Birthday Star Unlocked! ✨</span>';
            }
        }

        // Change glow color to indicate visited (white glow)
        if (planet.children.length > 0) {
            planet.children[0].material.color.setHex(0xffffff);
        }
    }
}

function checkUnlock() {
    if (state.visitedPlanets.size === memories.length && !state.allPlanetsVisited) {
        state.allPlanetsVisited = true;

        // Hide core to make room for birthday star
        gsap.to(coreMesh.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 2, onComplete: () => { coreMesh.visible = false; } });
        gsap.to(auraMesh.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 2 });

        setTimeout(() => {
            birthdayStar.visible = true;
            birthdayStar.scale.set(0.01, 0.01, 0.01);

            // Dramatic entrance
            gsap.to(birthdayStar.scale, {
                x: 1, y: 1, z: 1,
                duration: 3,
                ease: "elastic.out(1, 0.3)",
                onComplete: () => {
                    state.birthdayUnlocked = true;
                }
            });

            // Move camera back a bit to see the reveal
            gsap.to(camera.position, {
                y: 30, z: 60, duration: 2, ease: "power2.out"
            });
            gsap.to(controls.target, {
                x: 0, y: 0, z: 0, duration: 2, ease: "power2.out"
            });

        }, 1000);
    }
}

function closeCard() {
    memoryModal.classList.add('hidden');
    birthdayModal.classList.add('hidden');

    // Check if we just closed the last card to unlock
    if (state.visitedPlanets.size === memories.length && !state.allPlanetsVisited) {
        checkUnlock();
        // Return to overview slightly zoomed out
        gsap.to(camera.position, {
            x: 0, y: 30, z: 60,
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => controls.update()
        });

        gsap.to(controls.target, {
            x: 0, y: 0, z: 0,
            duration: 2,
            ease: "power2.inOut",
            onComplete: () => {
                state.isInteracting = true;
                controls.autoRotate = true; // Resume auto-rotate
            }
        });
    } else {
        // Return camera to a nice overview view based on unlocking status
        const dist = state.birthdayUnlocked ? 50 : 50;
        gsap.to(camera.position, {
            x: 0, y: 25, z: dist,
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => controls.update()
        });

        gsap.to(controls.target, {
            x: 0, y: 0, z: 0,
            duration: 2,
            ease: "power2.inOut",
            onComplete: () => {
                state.isInteracting = true;
                controls.autoRotate = true; // Resume auto-rotate
            }
        });
    }
}

// Confetti effect
function fireConfetti() {
    var duration = 5 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function () {
        var timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        var particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
    }, 250);
}

// --- Event Listeners ---
window.addEventListener('pointermove', onPointerMove);

let pointerDownPos = { x: 0, y: 0 };
window.addEventListener('pointerdown', (e) => {
    pointerDownPos.x = e.clientX;
    pointerDownPos.y = e.clientY;
    onPointerMove(e);
});

window.addEventListener('pointerup', (e) => {
    const dist = Math.abs(e.clientX - pointerDownPos.x) + Math.abs(e.clientY - pointerDownPos.y);
    if (dist < 10) {
        onClick(e);
    }
});
closeMemoryBtn.addEventListener('click', closeCard);
closeBirthdayBtn.addEventListener('click', closeCard);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

enterBtn.addEventListener('click', () => {
    // Fade out landing page
    landingPage.style.opacity = '0';
    setTimeout(() => {
        landingPage.classList.add('hidden');
        if (progressCounter) progressCounter.classList.remove('hidden');
    }, 1000);

    // Handle Music
    if (musicCheckbox.checked) {
        // Handle audio context creation on user interaction
        bgMusic.volume = 0.5;
        bgMusic.play().catch(e => console.log("Audio play prevented", e));
    }

    // Animate camera coming closer slightly to start the journey
    gsap.from(camera.position, {
        y: 60,
        z: 90,
        duration: 3,
        ease: "power3.out"
    });
});

let lastTime = Date.now();

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    const time = Date.now();
    const delta = time - lastTime;
    lastTime = time;

    // Orbit planets around the center
    planetMeshes.forEach(planet => {
        const data = planet.userData;

        if (planet !== hoveredPlanet) {
            data.currentAngle += data.speed * delta;
        }

        planet.position.x = Math.cos(data.currentAngle) * data.distance;
        planet.position.z = Math.sin(data.currentAngle) * data.distance;

        // Spin on its own axis
        planet.rotation.y += 0.01;
    });

    if (birthdayStar && birthdayStar.visible) {
        birthdayStar.rotation.y -= 0.005;
        // Subtle floating
        birthdayStar.position.y = Math.sin(time * 0.002) * 0.5;
    }

    controls.update();
    renderer.render(scene, camera);
}

// Start loop
animate();
