import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class World {
    constructor() {
        this.createScene();
        this.createSky();
        this.createCamera();
        this.createRenderer();
        this.createControls();

        window.addEventListener("resize", () => {
            this._camera.aspect = window.innerWidth / window.innerHeight;
            this._camera.updateProjectionMatrix();
            this._renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    createScene() {
        this._scene = new THREE.Scene();
        this._scene.fog = new THREE.Fog("black", 5, 40);
    }

    createSky() {
        const loader = new THREE.CubeTextureLoader();
        loader.setPath("/assets/textures/sky/");

        const skies = [
            "dark-s_nx.jpg",
            "dark-s_ny.jpg",
            "dark-s_nz.jpg",
            "dark-s_px.jpg",
            "dark-s_py.jpg",
            "dark-s_pz.jpg",
        ];

        const scene = this._scene;
        this._skyTexture = loader.load(skies, function (texture) {
            // This is called after all 6 images are loaded
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;

            // Apply it to the scene background or an object
            scene.background = texture;
        });

        const moonLight = new THREE.DirectionalLight(0x9999ff, 10); // soft blue light
        moonLight.position.set(-50, 50, -100);
        this._scene.add(moonLight);

        // const moonLightHelper = new THREE.DirectionalLightHelper(moonLight, 5);
        // this._scene.add(moonLightHelper);
    }

    createCamera() {
        this._camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this._camera.position.set(8, 8, 8);
    }

    createRenderer() {
        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this._renderer.domElement);
    }

    createControls() {
        this._controls = new OrbitControls(
            this._camera,
            this._renderer.domElement
        );
        this._controls.enableDamping = true; // for smooth motion
        this._controls.dampingFactor = 0.05;
        this._controls.update();
    }

    handleKeyPress(animate, hud, audio, player, plane) {
        window.addEventListener("keydown", (event) => {
            hud.updateScreen(audio.backgroundAudio, animate, this);

            // Handle lane movement after game starts
            if (event.code === "ArrowLeft") {
                player.lateralMove(-1);
            } else if (event.code === "ArrowRight") {
                player.lateralMove(1);
            } else if (event.code === "ArrowUp") {
                player.jump(audio.jumpAudio);
            } else if (event.code === "ArrowDown") {
                player.stopJump();
            } else if (event.code === "Space" && plane.gunReady) {
                plane.fireBullet();
            }
        });
    }

    getElapsedSeconds() {
        return Math.floor((Date.now() - this._startTime) / 1000);
    }

    get scene() {
        return this._scene;
    }

    get skyTexture() {
        return this._skyTexture;
    }

    get camera() {
        return this._camera;
    }

    get renderer() {
        return this._renderer;
    }

    get controls() {
        return this._controls;
    }

    set startTime(value) {
        this._startTime = value;
    }
}
