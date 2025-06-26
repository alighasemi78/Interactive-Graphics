import * as THREE from "three";
import { Bullet } from "./bullet";

export class Plane {
    constructor(scene, audio, tileWidth, skyTexture, updateGunReadyText) {
        this.scene = scene;
        this.audio = audio;
        this.tileWidth = tileWidth;
        this.skyTexture = skyTexture;
        this.updateGunReadyText = updateGunReadyText;

        this.planeOffset = 6;
        this.plane = null;
        this.createPlane();

        this._gunReady = false;
        this.maxBullets = 10;
        this.bullets = [];
        this.bulletBar = document.getElementById("bullet-bar");
        for (let i = 0; i < this.maxBullets; i++) {
            const bullet = document.createElement("div");
            bullet.className = "bullet";
            bullet.style.width = `${100 / this.maxBullets - 1}%`;
            this.bulletBar.appendChild(bullet);
        }
    }

    createBody(material) {
        const bodyTopWidth = 0.2;
        const bodyBottomWidth = 0.1;
        const bodyDepth = 2;

        const bodyGeometry = new THREE.CylinderGeometry(
            bodyTopWidth,
            bodyBottomWidth,
            bodyDepth
        );
        bodyGeometry.rotateX(-Math.PI / 2);

        const body = new THREE.Mesh(bodyGeometry, material);

        body.position.set(0, 0, 0);
        body.userData.bottomWidth = bodyBottomWidth;
        body.userData.slope = Math.asin(
            (bodyTopWidth - bodyBottomWidth) / 2 / bodyDepth
        );

        return body;
    }

    createBlade(zRotation) {
        const bladeWidth = 0.1;
        const bladeHeight = 0.8;
        const bladeDepth = 0.01;
        const material = new THREE.MeshStandardMaterial({ color: "white" });

        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(bladeWidth, bladeHeight, bladeDepth),
            material
        );

        blade.rotateZ(zRotation);
        blade.position.set(0, 0, -bladeDepth / 2);

        return blade;
    }

    createPropeller(body) {
        const bodyBox = new THREE.Box3().setFromObject(body);
        const bodySize = new THREE.Vector3();
        const bodyCenter = new THREE.Vector3();
        bodyBox.getSize(bodySize);
        bodyBox.getCenter(bodyCenter);

        const propeller = new THREE.Group();

        const blade1 = this.createBlade(Math.PI / 4);
        const blade2 = this.createBlade(-Math.PI / 4);

        propeller.add(blade1, blade2);
        propeller.position.set(
            bodyCenter.x,
            bodyCenter.y,
            bodyCenter.z - bodySize.z / 2
        );

        return propeller;
    }

    createWing(body, material, xPosition) {
        const wingWidth = 1.5;
        const wingHeight = 0.05;
        const wingDepth = 0.6;

        const bodyBox = new THREE.Box3().setFromObject(body);
        const bodySize = new THREE.Vector3();
        const bodyCenter = new THREE.Vector3();
        bodyBox.getSize(bodySize);
        bodyBox.getCenter(bodyCenter);

        const wing = new THREE.Mesh(
            new THREE.BoxGeometry(wingWidth, wingHeight, wingDepth),
            material
        );

        wing.position.set(
            bodyCenter.x +
                (xPosition * bodySize.x) / 2 +
                (xPosition * wingWidth) / 2 -
                xPosition * Math.sin(body.userData.slope) * bodySize.z,
            bodyCenter.y,
            bodyCenter.z
        );

        return wing;
    }

    createTail(body, material, position) {
        const tailWidth = 0.3;
        const tailDepth = 0.01;

        const bodyBox = new THREE.Box3().setFromObject(body);
        const bodySize = new THREE.Vector3();
        const bodyCenter = new THREE.Vector3();
        bodyBox.getSize(bodySize);
        bodyBox.getCenter(bodyCenter);

        const tailShape = new THREE.Shape();
        tailShape.moveTo(0, 0);
        tailShape.lineTo(0, tailWidth);
        tailShape.lineTo(tailWidth, 0);
        tailShape.lineTo(0, 0);

        const tailGeometry = new THREE.ExtrudeGeometry(tailShape, {
            depth: tailDepth,
            bevelEnabled: false,
        });

        const tail = new THREE.Mesh(tailGeometry, material);

        tail.position.set(
            bodyCenter.x +
                (position === "right"
                    ? body.userData.bottomWidth / 2
                    : position === "left"
                    ? -body.userData.bottomWidth / 2
                    : 0),
            bodyCenter.y +
                (position === "top" ? body.userData.bottomWidth / 2 : 0),
            bodyCenter.z + bodySize.z / 2
        );
        tail.rotation.set(
            position === "top" ? 0 : -Math.PI / 2,
            position === "top" ? Math.PI / 2 : 0,
            position === "left" ? Math.PI / 2 : 0
        );

        return tail;
    }

    createFlashlight(body) {
        const bodyBox = new THREE.Box3().setFromObject(body);
        const bodySize = new THREE.Vector3();
        const bodyCenter = new THREE.Vector3();
        bodyBox.getSize(bodySize);
        bodyBox.getCenter(bodyCenter);

        const flashlight = new THREE.SpotLight(0xffffff, 250);

        flashlight.position.set(
            bodyCenter.x,
            bodyCenter.y - bodySize.y / 2,
            bodyCenter.z - bodySize.z / 2
        );
        flashlight.position.set(0, 5, 5);
        flashlight.target.position.set(
            bodyCenter.x,
            bodyCenter.y - this.planeOffset,
            bodyCenter.z - this.planeOffset - 10 * this.tileWidth
        ); // pointing slightly downward and forward

        flashlight.angle = Math.PI / 4;
        flashlight.penumbra = 0.2; // softness at the edge
        flashlight.decay = 2; // how quickly it fades
        flashlight.distance = Math.sqrt(
            (bodyCenter.y - this.planeOffset) ** 2 +
                (bodyCenter.z - this.planeOffset - 10 * this.tileWidth) ** 2
        ); // max distance of light
        flashlight.castShadow = true;

        // const spotlightHelper = new THREE.SpotLightHelper(flashlight);
        // this.scene.add(spotlightHelper);

        return flashlight;
    }

    createPlane() {
        this.plane = new THREE.Group();

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: "yellow",
            side: THREE.DoubleSide,
            envMap: this.skyTexture,
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 10,
        });

        const body = this.createBody(bodyMaterial);
        this.propeller = this.createPropeller(body);
        const rightWing = this.createWing(body, bodyMaterial, 1);
        const leftWing = this.createWing(body, bodyMaterial, -1);
        const topTail = this.createTail(body, bodyMaterial, "top");
        const rightTail = this.createTail(body, bodyMaterial, "right");
        const leftTail = this.createTail(body, bodyMaterial, "left");
        const flashlight = this.createFlashlight(body);

        this.plane.add(
            body,
            this.propeller,
            rightWing,
            leftWing,
            topTail,
            rightTail,
            leftTail
        );
        this.plane.position.set(0, this.planeOffset, this.planeOffset);

        this.scene.add(this.plane);
        this.scene.add(flashlight);
    }

    fireBullet() {
        console.log(this.bullets.length);
        if (this.bullets.length < this.maxBullets) {
            this.audio.gunShotAudio.stop();
            this.audio.gunShotAudio.play();

            const bullet = new Bullet(this.scene, this.plane.position);
            this.bullets.push(bullet);

            this.bulletBar.children[
                this.maxBullets - this.bullets.length
            ].style.background = "transparent";
        }
    }

    update(player, road, elapsedSeconds) {
        if (elapsedSeconds > 0 && elapsedSeconds % 30 == 0) {
            if (!this._gunReady) {
                this._gunReady = true;
                this.audio.gunReadyAudio.stop();
                this.audio.gunReadyAudio.play();

                Array.from(this.bulletBar.children).forEach((child) => {
                    child.style.background = "yellow";
                });
            }
        } else {
            if (this.bullets.length >= this.maxBullets) {
                this._gunReady = false;

                let counter = 0;
                this.bullets.forEach((bullet) => {
                    if (bullet.isOutOfBounds()) {
                        counter++;
                    }
                });

                if (counter >= this.maxBullets) {
                    this.bullets = [];
                }
            }
        }
        this.updateGunReadyText(this._gunReady);

        this.propeller.rotation.z += 0.2;

        const time = performance.now() * 0.005; // time in milliseconds → seconds
        const swing = Math.sin(time * 1) * 0.1; // speed and amplitude

        // Arms swing opposite to legs
        this.plane.rotation.x = -swing;
        this.plane.position.y -= swing * 0.1;

        const desiredZ = player.position.z + this.planeOffset;
        this.plane.position.z += (desiredZ - this.plane.position.z) * 0.05;

        const desiredX = player.position.x;
        this.plane.position.x += (desiredX - this.plane.position.x) * 0.05;

        this.bullets.forEach((bullet, index) => {
            bullet.update(road);
            if (bullet.isOutOfBounds()) {
                this.scene.remove(bullet.mesh);
            }
        });
    }

    get gunReady() {
        return this._gunReady;
    }
}
