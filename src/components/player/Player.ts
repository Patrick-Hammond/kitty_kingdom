import gsap, {Linear, Power3} from "gsap";
import {AnimatedSprite} from "pixi.js";
import GameComponent from "@breakspace/GameComponent";
import {Vec2, Vec2Like} from "@lib/math/Geometry";
import {Direction} from "@lib/utils/Types";
import {PLAYER_MOVED, ROUND_FINISHED, NEXT_ROUND} from "../../GameEvents";
import {TileToPixel} from "./../Map";
import Camera from "breakspace/src/breakspace/display/Camera";
import Map from "../Map";
import Springs from "../Springs";
import PlayerControl from "./PlayerControl";
import { PathTileType } from "Constants";

enum PlayerState {
    IDLE, MOVING, FALLING, DISABLED
}

export default class Player extends GameComponent {

    private playerControl: PlayerControl;
    private anim: AnimatedSprite;
    private position = new Vec2();
    private state: PlayerState;
    private springs: Springs;

    public constructor(private map: Map, private camera: Camera) {
        super();

        this.anim = this.assetFactory.CreateAnimatedSprite("player_1");
        this.anim.anchor.set(0.5);
        this.anim.pivot.x = -32;
        this.anim.scale.set(0.5);
        this.anim.animationSpeed = 0.1;
        this.root.addChild(this.anim);

        this.springs = new Springs();
        this.playerControl = new PlayerControl(0);

        this.game.dispatcher.on(NEXT_ROUND, this.OnNextRound, this);
        this.game.dispatcher.on(ROUND_FINISHED, this.OnRoundFinished, this);
    }

    get Springs(): Springs {
        return this.springs;
    }

    get Position() : Vec2 {
        return this.position;
    }

    Start(position: Vec2Like): void {
        this.state = PlayerState.IDLE;
        this.position.Copy(position);
        const pos = TileToPixel(this.position);
        this.anim.position.set(pos.x, pos.y);
        this.camera.MoveTo(this.anim);
    }

    HitSpring(): void {
        gsap.killTweensOf(this.anim);
        this.state = PlayerState.FALLING;

        this.position.Copy(this.map.GetRandomPosition());
        const pos = TileToPixel(this.position);
        gsap.to(this.anim, 0.75, {x: pos.x, y: pos.y - 400, ease: Power3.easeOut,
            onUpdate: () => {
                this.camera.MoveTo(this.anim);
            }
        });
        gsap.to(this.anim, 1, {x: pos.x, y: pos.y, delay: 0.75, ease: Power3.easeIn,
            onComplete: () => {
                this.state = PlayerState.IDLE
                this.camera.MoveTo(this.anim);
            }
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
                gsap.to(this.anim, .5, {
                    x: pos.x, y: pos.y, ease: Linear.easeNone,
                    onUpdate: () => this.camera.MoveTo(this.anim),
                    onComplete: () => {
                        this.state = PlayerState.IDLE;
                        this.anim.stop();
                        this.game.dispatcher.emit(PLAYER_MOVED, this.position);
                    }
                });
            }
        }
    }

    private DropSpring() : void {
        this.springs.Drop(this.position, 1);
    }

    private OnRoundFinished(): void {
        this.state = PlayerState.DISABLED;
    }

    private OnNextRound(): void {
        this.state = PlayerState.IDLE;
    }
}
