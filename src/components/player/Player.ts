import gsap, {Linear, Power1, Power3} from "gsap";
import {AnimatedSprite} from "pixi.js";
import GameComponent from "@breakspace/GameComponent";
import {Vec2} from "@lib/math/Geometry";
import {Direction} from "@lib/utils/Types";
import {PLAYER_MOVED, LEVEL_FINISHED, LEVEL_START} from "../../GameEvents";
import {TileToPixel, PlayerHomeLocation} from "../map/Map";
import Camera from "breakspace/src/breakspace/display/Camera";
import Map from "../map/Map";
import Springs from "../items/Springs";
import PlayerControl from "./PlayerControl";
import { PathTileType } from "Constants";
import { SoundInstance } from "breakspace/src/breakspace/sound/Sound";
import { Wait } from "breakspace/src/_lib/utils/Timing";
import { NullFunction } from "breakspace/src/_lib/patterns/FunctionUtils";
import { ColorReplaceFilter } from "pixi-filters";
import { RemoveFromParent } from "breakspace/src/breakspace/display/Utils";

enum PlayerState {
    IDLE, MOVING, FALLING, DISABLED
}

export default class Player extends GameComponent {

    private playerControl: PlayerControl;
    private anim: AnimatedSprite;
    private flame: AnimatedSprite;
    private position = new Vec2();
    private state: PlayerState;
    private springs: Springs;
    private gallopSound: SoundInstance;
    private speed: number = 0.5;
    private speedCancel = NullFunction;
    private speedFilter = new ColorReplaceFilter(0x85b800, 0xb81600);

    public constructor(private map: Map, private camera: Camera) {
        super();

        this.anim = this.assetFactory.CreateAnimatedSprite("player_1");
        this.anim.anchor.set(0.5);
        this.anim.pivot.x = -32;
        this.anim.scale.set(0.5);
        this.anim.animationSpeed = 0.1;
        this.root.addChild(this.anim);

        this.flame = this.assetFactory.CreateAnimatedSprite("flame");
        this.flame.animationSpeed = 0.1;
        this.flame.position.set(25, -28);

        this.springs = new Springs();
        this.playerControl = new PlayerControl(0);

        this.gallopSound = this.game.sound.PlaySprite("sounds", "move");
        this.gallopSound.muted = true;

        this.game.dispatcher.on(LEVEL_START, this.OnLevelStart, this);
        this.game.dispatcher.on(LEVEL_FINISHED, this.OnLevelFinished, this);
    }

    get Springs(): Springs {
        return this.springs;
    }

    get Position() : Vec2 {
        return this.position;
    }

    private OnLevelStart(): void {
        this.game.ticker.add(this.OnUpdate, this);

        this.state = PlayerState.IDLE;
        this.position.Copy(PlayerHomeLocation);
        const pos = TileToPixel(this.position);
        this.anim.position.set(pos.x, pos.y);
        this.camera.MoveTo(this.anim);
    }

    private OnLevelFinished(): void {
        this.state = PlayerState.DISABLED;
    }

    HitSpring(): void {
        gsap.killTweensOf(this.anim);
        this.state = PlayerState.FALLING;

        this.position.Copy(this.map.GetRandomPosition());
        const pos = TileToPixel(this.position);
        gsap.to(this.anim, 1, {x: pos.x, y: pos.y, ease: Power1.easeIn,
            onUpdate: () => {
                this.camera.MoveTo(this.anim);
            }
        });
        gsap.to(this.anim, 1.5, {rotation: Math.PI * 6,
            onComplete: () => {
                this.state = PlayerState.IDLE
                this.anim.rotation = 0;
            }
        });

        const s = this.anim.scale.x * 2;
        gsap.to(this.anim.scale, 1, {x: s, y: s, yoyo: true, repeat: 1, ease: Power3.easeOut});
        gsap.to(this.camera, 1, {scale: 1, yoyo: true, repeat: 1, ease: Power3.easeOut});

        this.game.sound.PlaySprite("sounds", "boing");
    }

    HitIceblock(): void {
        this.speedCancel();
        this.speed = 0.2;
        this.anim.filters = [this.speedFilter];
        this.anim.addChild(this.flame);
        this.flame.gotoAndPlay(0);
        this.speedCancel = Wait(10000, () => {
            this.speed = 0.5;
            this.anim.filters = null;
            this.flame.stop();
            RemoveFromParent(this.flame);
        });
    }

    OnUpdate(): void {
        const input = this.playerControl.Get();
        if(input && input.length) {
            input.forEach(i => i === "fire" ? this.DropSpring() : this.Move(i));
        }
    }

    private Move(direction: Direction): void {

        if(this.state === PlayerState.IDLE) {
            const tileType = this.map.GetTile(this.position, direction).type;

            if(tileType === PathTileType.toString()) {
                this.state = PlayerState.MOVING;
                this.anim.play();
                this.gallopSound.muted = false;

                switch(direction) {
                    case "left":
                        this.position.x -= 1;
                        this.anim.scale.x = -0.5;
                        this.anim.pivot.x = 32;
                        break;
                    case "right":
                        this.position.x += 1;
                        this.anim.scale.x = 0.5;
                        this.anim.pivot.x = -32;
                        break;
                    case "up":
                        this.position.y -= 1;
                        break;
                    case "down":
                        this.position.y += 1;
                        break;
                    }

                const pos = TileToPixel(this.position);
                gsap.to(this.anim, this.speed, {
                    x: pos.x, y: pos.y, ease: Linear.easeNone,
                    onUpdate: () => this.camera.MoveTo(this.anim),
                    onComplete: () => {
                        this.state = PlayerState.IDLE;
                        this.anim.stop();
                        this.gallopSound.muted = true;
                        this.game.dispatcher.emit(PLAYER_MOVED, this.position);
                    }
                });
            }
        }
    }

    private DropSpring() : void {
        this.springs.Drop(this.position, 1);
    }
}
