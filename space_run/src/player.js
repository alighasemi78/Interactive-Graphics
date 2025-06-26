import * as THREE from "three";

export class Player {
    constructor(
        scene,
        tileWidth,
        audio,
        updateHealthBar,
        updateJetPackBar,
        endGame
    ) {
        this.scene = scene;
        this.tileWidth = tileWidth;
        this.audio = audio;
        this.updateHealthBar = updateHealthBar;
        this.updateJetPackBar = updateJetPackBar;
        this.endGame = endGame;

        this.lane = 0;

        this.isJumping = false;
        this.isSecondJumping = false;
        this.verticalVelocity = 0;
        this.gravity = -0.01;
        this.jumpVelocity = 0.3;

        this.isFlying = false;
        this.timeFlying = 0;

        this.health = 3; // Player's health

        this.createPlayer();
    }

    createLeg(material, xPosition) {
        const shinWidth = 0.1;
        const shinLength = 0.6;
        const shinAngle = -Math.PI / 6;
        const thighWidth = 0.2;
        const thighLength = 0.4;
        const thighAngle = Math.PI / 6;

        const leg = new THREE.Group();

        const shin = new THREE.Mesh(
            new THREE.BoxGeometry(shinWidth, shinLength, shinWidth),
            material
        );
        shin.castShadow = true;
        shin.rotateX(shinAngle);

        shin.position.set(
            0,
            -(shinLength / 2) * Math.cos(shinAngle) -
                thighLength * Math.cos(thighAngle),
            -(shinLength / 2) * Math.sin(shinAngle) -
                thighLength * Math.sin(thighAngle)
        );

        const thighMaterial = new THREE.MeshStandardMaterial({ color: "red" });
        const thigh = new THREE.Mesh(
            new THREE.BoxGeometry(thighWidth, thighLength, thighWidth),
            thighMaterial
        );
        thigh.castShadow = true;
        thigh.rotateX(thighAngle);

        thigh.position.set(
            0,
            -(thighLength / 2) * Math.cos(thighAngle),
            -(thighLength / 2) * Math.sin(thighAngle)
        );

        leg.add(thigh, shin);
        leg.position.set(
            xPosition,
            shinLength * Math.cos(shinAngle) -
                (shinWidth / 2) * Math.sin(shinAngle) +
                thighLength * Math.cos(thighAngle),
            shinLength * Math.sin(shinAngle) +
                thighLength * Math.sin(thighAngle)
        );
        leg.userData.joint = leg.position;

        return leg;
    }

    createTorso(leg) {
        this.torsoWidth = 0.5;
        this.torsoHeight = 0.8;
        this.torsoDepth = 0.3;

        const legBox = new THREE.Box3().setFromObject(leg);
        const legSize = new THREE.Vector3();
        legBox.getSize(legSize);

        const material = new THREE.MeshStandardMaterial({ color: "blue" });

        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(
                this.torsoWidth,
                this.torsoHeight,
                this.torsoDepth
            ),
            material
        );
        torso.castShadow = true;
        torso.position.set(
            0,
            legSize.y + this.torsoHeight / 2,
            leg.userData.joint.z
        );

        return torso;
    }

    createArm(material, xPosition, leg) {
        const bicepWidth = 0.1;
        const bicepHeight = 0.4;
        const handAngle = Math.PI / 3;

        const legBox = new THREE.Box3().setFromObject(leg);
        const legSize = new THREE.Vector3();
        legBox.getSize(legSize);

        const torsoBox = new THREE.Box3().setFromObject(this.torso);
        const torsoCenter = new THREE.Vector3();
        torsoBox.getCenter(torsoCenter);

        const arm = new THREE.Group();

        const bicep = new THREE.Mesh(
            new THREE.BoxGeometry(bicepWidth, bicepHeight, bicepWidth),
            material
        );
        bicep.castShadow = true;
        bicep.position.set(0, -bicepHeight / 2, 0);

        const hand = new THREE.Mesh(
            new THREE.BoxGeometry(bicepWidth, bicepHeight, bicepWidth),
            material
        );
        hand.castShadow = true;
        hand.rotateX(handAngle);
        hand.position.set(
            0,
            -bicepHeight - (bicepHeight / 2) * Math.cos(handAngle),
            -(bicepHeight / 2) * Math.sin(handAngle)
        );

        arm.add(bicep, hand);
        arm.position.set(
            xPosition,
            legSize.y + this.torsoHeight,
            torsoCenter.z
        );

        return arm;
    }

    createHead(material, leg) {
        const headWidth = 0.3;
        const hairHeight = 0.05;

        const legBox = new THREE.Box3().setFromObject(leg);
        const legSize = new THREE.Vector3();
        legBox.getSize(legSize);

        const torsoBox = new THREE.Box3().setFromObject(this.torso);
        const torsoCenter = new THREE.Vector3();
        torsoBox.getCenter(torsoCenter);

        const head = new THREE.Group();

        const face = new THREE.Mesh(
            new THREE.BoxGeometry(headWidth, headWidth, headWidth),
            material
        );
        face.castShadow = true;
        face.position.set(0, 0, 0);

        const hairMaterial = new THREE.MeshStandardMaterial({
            color: "black",
        });

        const hair = new THREE.Mesh(
            new THREE.BoxGeometry(headWidth, hairHeight, headWidth),
            hairMaterial
        );
        hair.castShadow = true;
        hair.position.set(0, headWidth / 2 + hairHeight / 2, 0);

        head.add(hair, face);
        head.position.set(
            0,
            legSize.y + this.torsoHeight + headWidth / 2,
            torsoCenter.z
        );

        return head;
    }

    createPlayer() {
        this._player = new THREE.Group();

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: "sandybrown",
        });

        this.leftLeg = this.createLeg(bodyMaterial, 0.15);
        this.rightLeg = this.createLeg(bodyMaterial, -0.15);

        this.torso = this.createTorso(this.leftLeg);

        this.leftArm = this.createArm(bodyMaterial, -0.35, this.leftLeg);
        this.rightArm = this.createArm(bodyMaterial, 0.35, this.leftLeg);

        const head = this.createHead(bodyMaterial, this.leftLeg);

        this._player.add(
            head,
            this.torso,
            this.leftArm,
            this.rightArm,
            this.leftLeg,
            this.rightLeg
        );

        this._player.position.set(0, 0.1, 0);
        this.scene.add(this._player);

        this.playerBox = new THREE.Box3().setFromObject(this._player);
    }

    lateralMove(direction) {
        this.lane += direction;
        this.lane = Math.max(this.lane, -1);
        this.lane = Math.min(this.lane, 1);
    }

    jump() {
        if (!this.isFlying && !this.isSecondJumping) {
            if (this.isJumping) {
                this.isSecondJumping = true;
                this.secondJumpStartY = this._player.position.y;
            }
            this.verticalVelocity = this.jumpVelocity;
            this.isJumping = true;
            if (this.audio.jumpAudio.isPlaying) this.audio.jumpAudio.stop();
            this.audio.jumpAudio.play();
        }
    }

    stopJump() {
        if (this.isJumping) {
            this.verticalVelocity = 10 * this.gravity;
        }
    }

    handlePlayerHit() {
        if (!this.audio.hitAudio.isPlaying) this.audio.hitAudio.play();
        this.health--;
        this.updateHealthBar(this.health);

        // Bring monster closer after each hit
        // monsterOffsetZ = Math.max(monsterOffsetZ - 0.5, 0.5); // minimum distance

        // Flash effect
        let flashDuration = 2000; // in ms
        let flashInterval = 200;
        let flashCount = 0;
        const flashTimer = setInterval(() => {
            this._player.visible = !this._player.visible;
            flashCount += flashInterval;
            if (flashCount >= flashDuration) {
                clearInterval(flashTimer);
                this._player.visible = true;
            }
        }, flashInterval);

        // Check for death
        if (this.health <= 0) {
            console.log("💀 Monster caught the player!");
            this.endGame();
        }
    }

    handleJetPack(jetPack) {
        if (!this.isFlying) {
            this.isFlying = true;
            this.jetPack = jetPack.clone();
            this.scene.remove(jetPack);
            this.scene.add(this.jetPack);
            this.audio.jetPackAudio.play();
        }
    }

    update(road) {
        if (this.timeFlying >= 5) {
            this.updateJetPackBar(this.timeFlying);
            this.isFlying = false;
            this.timeFlying = 0;
            this.scene.remove(this.jetPack);
            this.audio.jetPackAudio.stop();
        }

        // Smooth lane transition (optional)
        const targetX = this.lane * this.tileWidth;
        this._player.position.x += (targetX - this._player.position.x) * 0.2;

        // Apply vertical velocity
        if (this.isJumping) {
            this._player.position.y += this.verticalVelocity;
            this.verticalVelocity += this.gravity;
        } else {
            if (this.isFlying) {
                this.leftArm.rotation.x = 0;
                this.rightArm.rotation.x = 0;
                this.leftLeg.rotation.x = 0;
                this.rightLeg.rotation.x = 0;
            } else {
                const time = performance.now() * 0.005; // time in milliseconds → seconds
                const swing = Math.sin(time * 3) * 1; // speed and amplitude

                // Arms swing opposite to legs
                this.leftArm.rotation.x = swing;
                this.rightArm.rotation.x = -swing;
                this.leftLeg.rotation.x = swing;
                this.rightLeg.rotation.x = -swing;
            }
        }

        if (this.isFlying) {
            this.updateJetPackBar(this.timeFlying);
            this._player.position.y += (4 - this._player.position.y) * 0.05;

            const torsoBox = new THREE.Box3().setFromObject(this.torso);
            const torsoCenter = new THREE.Vector3();
            torsoBox.getCenter(torsoCenter);

            this.jetPack.position.set(
                torsoCenter.x,
                torsoCenter.y,
                torsoCenter.z + this.torsoDepth / 2 + 0.1
            );
            this.jetPack.rotation.y = 0;

            this.timeFlying += 0.01;
        }

        const tile = road.getTileAt(
            this._player.position.x,
            this._player.position.z
        );
        if (
            tile.visible &&
            this._player.position.y <= 0.1 &&
            this._player.position.y >= -0.5
        ) {
            if (this.isJumping) {
                this._player.position.y = 0;
                this.verticalVelocity = 0;
                this.isJumping = false;
                this.isSecondJumping = false;
            }
        } else if (!this.isFlying) {
            this.isJumping = true;
        }

        // Game over if fallen too far
        if (this._player.position.y < -0.5) {
            if (!this.audio.screamAudio.isPlaying)
                this.audio.screamAudio.play();
            this.endGame();
        }

        // Update player bounding box
        this.playerBox.setFromObject(this._player);

        road.checkCollision(
            this.playerBox,
            this.handlePlayerHit.bind(this),
            this.audio.hitAudio
        );

        road.checkJetPack(this.playerBox, this.handleJetPack.bind(this));
    }

    get player() {
        return this._player;
    }
}
