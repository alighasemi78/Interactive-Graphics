import * as THREE from "three";

export class Road {
    constructor(scene, skyTexture) {
        this.scene = scene;
        this.skyTexture = skyTexture;

        this.roadLength = 20;
        this._tiles = [];

        this.easyMode = {
            avgGapInterval: 1.0,
            avgJetPackInterval: 15.0,
            avgObstaclesInterval: 1.0,
        };

        this.mediumMode = {
            avgGapInterval: 0.5,
            avgJetPackInterval: 20.0,
            avgObstaclesInterval: 0.5,
        };

        this.hardMode = {
            avgGapInterval: 0.25,
            avgJetPackInterval: 25.0,
            avgObstaclesInterval: 0.25,
        };

        this.lastGapTime = 0;
        this.nextGapIn = this.sampleNextTime(this.easyMode.avgGapInterval);
        this.isGapFrame = false;
        this.gapTilesRemaining = 0;

        this.lastJetPackTime = 0;
        this.nextJetPackIn = this.sampleNextTime(
            this.easyMode.avgJetPackInterval
        );
        this.isJetPackFrame = false;
        this.jetPackTile = 0;

        this.lastObstaclesTime = 0;
        this.nextObstaclesIn = this.sampleNextTime(
            this.easyMode.avgObstaclesInterval
        );
        this.isObstaclesFrame = false;
        this.obstaclesTiles = [];
        this.obstaclesTilesRemaining = 0;

        this.sampleTile = this.createSampleTile();
        this.sampleLaserGate = this.createSampleLaserGate();
        this.sampleMeteorite = this.createSampleMeteorite();
        this.sampleJetpack = this.createSampleJetPack();

        this.createTiles();
    }

    createSampleTile() {
        this._tileWidth = 2; // Width of each tile
        this.tileHeight = 0.2;

        const tileGeometry = new THREE.BoxGeometry(
            this._tileWidth,
            this.tileHeight,
            this._tileWidth
        );
        const tileMaterial = new THREE.MeshStandardMaterial({
            color: "black",
        });

        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.receiveShadow = true;
        tile.position.set(0, 0, 0);

        return tile;
    }

    createSampleLaserGate() {
        const poleWidth = 0.3;
        const poleHeight = 1;

        const laserGate = new THREE.Group();

        const poleL = new THREE.Mesh(
            new THREE.BoxGeometry(poleWidth, poleHeight, poleWidth),
            new THREE.MeshStandardMaterial({
                color: 0x888888,
            })
        );
        const poleR = poleL.clone();

        poleL.position.set(-this.tileWidth / 2 + poleWidth / 2, 0, 0);
        poleR.position.set(this.tileWidth / 2 - poleWidth / 2, 0, 0);

        const laser = new THREE.Mesh(
            new THREE.BoxGeometry(
                this.tileWidth - 2 * poleWidth,
                poleHeight / 2,
                poleWidth / 2
            ),
            new THREE.MeshStandardMaterial({
                color: "red",
                emissive: "red",
                transparent: true,
                opacity: 0.4,
                emissiveIntensity: 2,
            })
        );
        laser.position.set(0, 0, 0);

        laserGate.add(poleL, poleR, laser);
        laserGate.position.set(0, poleHeight / 2, 0);
        return laserGate;
    }

    createSampleMeteorite() {
        const meteoriteWidth = this.tileWidth / 3;

        const geometry = new THREE.IcosahedronGeometry(meteoriteWidth, 0);
        const material = new THREE.MeshStandardMaterial({
            color: "brown",
            roughness: 1.0,
        });
        const rock = new THREE.Mesh(geometry, material);

        rock.position.set(0, 0, 0);

        return rock;
    }

    createSampleJetPack() {
        const jetPack = new THREE.Group();

        const material = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.6,
            metalness: 0.8,
        });

        // Two cylindrical thrusters
        for (let i = -1; i <= 1; i += 2) {
            const thruster = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 0.8, 12),
                material
            );
            thruster.position.set(i * 0.2, 0, 0); // adjust spacing

            // Flame
            const flameMat = new THREE.MeshStandardMaterial({
                color: 0xff6600,
                emissive: 0xff2200,
                transparent: true,
                opacity: 0.7,
            });

            const flame = new THREE.Mesh(
                new THREE.ConeGeometry(0.05, 0.3, 8),
                flameMat
            );
            flame.rotation.x = Math.PI; // Flip down
            flame.position.set(0, -0.45, 0);
            thruster.add(flame);

            jetPack.add(thruster);
        }

        jetPack.position.y = this.tileHeight + 0.4;

        return jetPack;
    }

    createLaserGate(x, z) {
        const laserGate = this.sampleLaserGate.clone();
        laserGate.position.x = x;
        laserGate.position.z = z;
        return laserGate;
    }

    createMeteorite(x, z) {
        const asteroid = this.sampleMeteorite.clone();
        // Apply random non-uniform scale
        asteroid.scale.set(
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4
        );
        asteroid.position.x = x;
        asteroid.position.z = z;

        return asteroid;
    }

    createObstacle(x, z) {
        let obstacle = null;
        if (Math.random() < 0.5) {
            obstacle = this.createLaserGate(x, z);
        } else {
            obstacle = this.createMeteorite(x, z);
        }
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        obstacle.userData.box = obstacleBox;

        return obstacle;
    }

    createJetPack(x, z) {
        const jetPack = this.sampleJetpack.clone();
        jetPack.position.x = x;
        jetPack.position.z = z;

        const jetPackBox = new THREE.Box3().setFromObject(jetPack);
        jetPack.userData.box = jetPackBox;

        return jetPack;
    }

    createTiles() {
        for (let i = 0; i < this.roadLength; i++) {
            const row = [];
            for (let j = 0; j < 3; j++) {
                const tile = this.sampleTile.clone();
                tile.position.set(
                    j * this._tileWidth - this._tileWidth,
                    0,
                    -i * this._tileWidth
                );
                tile.visible = true;
                tile.userData.hasJetPack = false;
                tile.userData.hasObstacle = false;

                row.push(tile);
                this.scene.add(tile);
            }
            this._tiles.push(row);
        }
    }

    sampleNextTime(avgInterval) {
        return -Math.log(1 - Math.random()) * avgInterval;
    }

    update(elapsedSeconds) {
        let intervals = {
            avgGapInterval: 0,
            avgJetPackInterval: 0,
            avgObstaclesInterval: 0,
        };

        if (elapsedSeconds < 60) {
            intervals = this.easyMode;
        } else if (elapsedSeconds < 120) {
            intervals = this.mediumMode;
        } else {
            intervals = this.hardMode;
        }

        if (elapsedSeconds - this.lastGapTime >= this.nextGapIn) {
            this.isGapFrame = true;
            this.lastGapTime = elapsedSeconds;
            this.nextGapIn = this.sampleNextTime(intervals.avgGapInterval);
            this.gapTilesRemaining = 3;
        }

        if (elapsedSeconds - this.lastJetPackTime >= this.nextJetPackIn) {
            this.isJetPackFrame = true;
            this.lastJetPackTime = elapsedSeconds;
            this.nextJetPackIn = this.sampleNextTime(
                intervals.avgJetPackInterval
            );
            this.jetPackTile = Math.floor(Math.random() * 3);
        }

        if (elapsedSeconds - this.lastObstaclesTime >= this.nextObstaclesIn) {
            this.isObstaclesFrame = true;
            this.lastObstaclesTime = elapsedSeconds;
            this.nextObstaclesIn = this.sampleNextTime(
                intervals.avgObstaclesInterval
            );
            this.obstaclesTiles = Array.from(
                { length: 3 },
                () => Math.random() < 0.5
            );
            this.obstaclesTilesRemaining = 3;
        }

        this._tiles.forEach((row) => {
            row.forEach((tile, i) => {
                tile.position.z += 0.1;

                if (tile.userData.hasJetPack) {
                    tile.userData.jetPack.position.z += 0.1;
                    tile.userData.jetPack.rotation.y += 0.05;
                }

                if (tile.userData.hasObstacle) {
                    tile.userData.obstacle.position.z += 0.1;
                }

                if (tile.position.z > 20) {
                    tile.position.z -= this.roadLength * this._tileWidth;

                    if (this.isGapFrame && this.gapTilesRemaining > 0) {
                        tile.visible = false;
                        this.gapTilesRemaining--;
                        if (this.gapTilesRemaining === 0) {
                            this.isGapFrame = false;
                        }
                    } else {
                        tile.visible = true;
                    }

                    if (tile.userData.hasJetPack) {
                        this.scene.remove(tile.userData.jetPack);
                    }

                    if (
                        tile.visible &&
                        this.isJetPackFrame &&
                        this.jetPackTile === i
                    ) {
                        tile.userData.hasJetPack = true;
                        this.isJetPackFrame = false;

                        const jetPack = this.createJetPack(
                            tile.position.x,
                            tile.position.z
                        );
                        tile.userData.jetPack = jetPack;
                        this.scene.add(jetPack);
                    } else {
                        tile.userData.hasJetPack = false;
                    }

                    if (tile.userData.hasObstacle) {
                        this.scene.remove(tile.userData.obstacle);
                    }

                    if (
                        tile.visible &&
                        !tile.userData.hasJetPack &&
                        this.isObstaclesFrame &&
                        this.obstaclesTilesRemaining > 0
                    ) {
                        if (this.obstaclesTiles[i]) {
                            tile.userData.hasObstacle = true;

                            const obstacle = this.createObstacle(
                                tile.position.x,
                                tile.position.z
                            );
                            tile.userData.obstacle = obstacle;
                            this.scene.add(obstacle);
                        }

                        this.obstaclesTilesRemaining--;
                        if (this.obstaclesTilesRemaining === 0) {
                            this.isObstaclesFrame = false;
                        }
                    }
                }
            });
        });
    }

    getTileAt(x, z) {
        let selected_tile = null;
        let min_dis = Infinity;

        this._tiles.forEach((row) => {
            row.forEach((tile) => {
                if (
                    Math.sqrt(
                        (tile.position.x - x) ** 2 + (tile.position.z - z) ** 2
                    ) < min_dis
                ) {
                    selected_tile = tile;
                    min_dis = Math.sqrt(
                        (tile.position.x - x) ** 2 + (tile.position.z - z) ** 2
                    );
                }
            });
        });

        return selected_tile;
    }

    checkCollision(playerBox, handlePlayerHit, hitAudio) {
        // Collision check
        this._tiles.forEach((row) => {
            row.forEach((tile) => {
                if (tile.userData.hasObstacle) {
                    const obstacle = tile.userData.obstacle;
                    obstacle.userData.box.setFromObject(obstacle);
                    if (playerBox.intersectsBox(obstacle.userData.box)) {
                        if (!obstacle.userData.hit) {
                            obstacle.userData.hit = true; // prevent multiple triggers
                            handlePlayerHit(hitAudio);
                        }
                    }
                }
            });
        });
    }

    checkBulletCollision(bulletBox, handleBulletHit) {
        // Check collision between bullet and obstacles
        this._tiles.forEach((row) => {
            row.forEach((tile) => {
                if (tile.userData.hasObstacle) {
                    const obstacle = tile.userData.obstacle;
                    obstacle.userData.box.setFromObject(obstacle);
                    if (bulletBox.intersectsBox(obstacle.userData.box)) {
                        if (!obstacle.userData.hit) {
                            obstacle.userData.hit = true; // prevent multiple triggers
                            // Flashing effect
                            let flashCount = 0;
                            const maxFlashes = 6;
                            const flashInterval = 60; // ms
                            const originalVisible = obstacle.visible;
                            const flash = () => {
                                obstacle.visible = !obstacle.visible;
                                flashCount++;
                                if (flashCount < maxFlashes) {
                                    setTimeout(flash, flashInterval);
                                } else {
                                    obstacle.visible = originalVisible;
                                    // Remove obstacle from scene and tile
                                    this.scene.remove(obstacle);
                                    tile.userData.hasObstacle = false;
                                    tile.userData.obstacle = null;
                                    handleBulletHit(obstacle);
                                }
                            };
                            flash();
                        }
                    }
                }

                const tileBox = new THREE.Box3().setFromObject(tile);
                if (bulletBox.intersectsBox(tileBox)) {
                    handleBulletHit(tile);
                }
            });
        });
    }

    checkJetPack(playerBox, handleJetPack) {
        // Collision check
        this._tiles.forEach((row) => {
            row.forEach((tile) => {
                if (tile.userData.hasJetPack) {
                    const jetPack = tile.userData.jetPack;
                    jetPack.userData.box.setFromObject(jetPack);
                    if (playerBox.intersectsBox(jetPack.userData.box)) {
                        if (!jetPack.userData.hit) {
                            jetPack.userData.hit = true; // prevent multiple triggers
                            handleJetPack(jetPack);
                        }
                    }
                }
            });
        });
    }

    get tiles() {
        return this._tiles;
    }

    get tileWidth() {
        return this._tileWidth;
    }
}
