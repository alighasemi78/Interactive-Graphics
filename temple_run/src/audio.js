import * as THREE from "three";

export class Audio {
    constructor(camera) {
        this.camera = camera;

        this.audioDir = "/assets/audio";
        this.backgroundAudioPath = this.audioDir + "/background.mp3";
        this.jumpAudioPath = this.audioDir + "/jump.mp3";
        this.hitAudioPath = this.audioDir + "/hit.mp3";
        this.screamAudioPath = this.audioDir + "/scream.mp3";
        this.jetPackAudioPath = this.audioDir + "/jetPack.mp3";
        this.gunReadyAudioPath = this.audioDir + "/gunReady.mp3";
        this.gunShotAudioPath = this.audioDir + "/gunShot.mp3";

        this.loadAudio();
    }

    loadAudio() {
        const listener = new THREE.AudioListener();
        this.camera.add(listener);

        const audioLoader = new THREE.AudioLoader();

        this._backgroundAudio = new THREE.Audio(listener);
        audioLoader.load(this.backgroundAudioPath, (buffer) => {
            this._backgroundAudio.setBuffer(buffer);
            this._backgroundAudio.setLoop(true);
            this._backgroundAudio.setVolume(0.5);
        });

        this._jumpAudio = new THREE.Audio(listener);
        audioLoader.load(this.jumpAudioPath, (buffer) => {
            this._jumpAudio.setBuffer(buffer);
            this._jumpAudio.setVolume(0.5);
        });

        this._hitAudio = new THREE.Audio(listener);
        audioLoader.load(this.hitAudioPath, (buffer) => {
            this._hitAudio.setBuffer(buffer);
            this._hitAudio.setVolume(0.5);
        });

        this._screamAudio = new THREE.Audio(listener);
        audioLoader.load(this.screamAudioPath, (buffer) => {
            this._screamAudio.setBuffer(buffer);
            this._screamAudio.setVolume(0.5);
        });

        this._jetPackAudio = new THREE.Audio(listener);
        audioLoader.load(this.jetPackAudioPath, (buffer) => {
            this._jetPackAudio.setBuffer(buffer);
            this._jetPackAudio.setLoop(true);
            this._jetPackAudio.setVolume(0.5);
        });

        this._gunReadyAudio = new THREE.Audio(listener);
        audioLoader.load(this.gunReadyAudioPath, (buffer) => {
            this._gunReadyAudio.setBuffer(buffer);
            this._gunReadyAudio.setVolume(1);
        });

        this._gunShotAudio = new THREE.Audio(listener);
        audioLoader.load(this.gunShotAudioPath, (buffer) => {
            this._gunShotAudio.setBuffer(buffer);
            this._gunShotAudio.setVolume(0.5);
        });
    }

    get backgroundAudio() {
        return this._backgroundAudio;
    }

    get screamAudio() {
        return this._screamAudio;
    }

    get jumpAudio() {
        return this._jumpAudio;
    }

    get hitAudio() {
        return this._hitAudio;
    }

    get jetPackAudio() {
        return this._jetPackAudio;
    }

    get gunReadyAudio() {
        return this._gunReadyAudio;
    }

    get gunShotAudio() {
        return this._gunShotAudio;
    }
}
