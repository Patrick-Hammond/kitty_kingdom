import gsap, {Linear, Power3} from "gsap";
import {AnimatedSprite} from "pixi.js";
import {FindShortestPath, SearchNode, FindClosestNode} from "@lib/algorithms/PathSearch";
import {Callback} from "@breakspace/display/Utils";
import GameComponent from "@breakspace/GameComponent";
import {Vec2, Vec2Like} from "@lib/math/Geometry";
import {NullFunction} from "@lib/patterns/FunctionUtils";
import {Cancel, Wait} from "@lib/utils/Timing";
import {Direction} from "@lib/utils/Types";
import {PathTileType} from "../../Constants";
import {CAT_FOLLOWING, VIKING_MOVED, CAT_POSITIONS, ROUND_FINISHED, NEXT_ROUND} from "../../GameEvents";
import {TileToPixel, VikingHomeLocation, VikingWayPoints} from "../map/Map";
import Map from "../map/Map";
import Springs from "../items/Springs";
import { SoundInstance } from "breakspace/src/breakspace/sound/Sound";
import { RandomInt } from "breakspace/src/_lib/math/Utils";

enum VikingState {
    PATROLLING, END_PATROL, GOING_HOME, FALLING, DISABLED
}

export default class Viking extends GameComponent {

    private anim: AnimatedSprite;
    private position = new Vec2();
    private state: VikingState;
    private catPositions: SearchNode[] = [];
    private cancelDelayedPatrol: Cancel = NullFunction;
    private patrolIndex: number = -1;
    private springs: Springs;
    private gallopSound: SoundInstance;
    private speed: number = 0.75;

    public constructor(private map: Map) {
        super();

        this.anim = this.assetFactory.CreateAnimatedSprite("viking");
        this.anim.anchor.set(0.5);
        this.anim.scale.set(-1, 1);
        this.anim.pivot.x = 16;
        this.anim.animationSpeed = 0.1;
        this.anim.play();
        this.root.addChild(this.anim);

        this.springs = new Springs();

        this.gallopSound = this.game.sound.PlaySprite("sounds", "horse");
        this.gallopSound.volume = 0;

        this.game.dispatcher.on(CAT_FOLLOWING, this.OnCatFollowing, this);
        this.game.dispatcher.on(CAT_POSITIONS, (cats) => this.catPositions = cats);
        this.game.dispatcher.on(ROUND_FINISHED, this.OnRoundFinished, this);
        this.game.dispatcher.on(NEXT_ROUND, this.OnNextRound, this);
    }

    get Springs(): Springs {
        return this.springs;
    }

    Start(position: Vec2Like): void {
        this.position.Copy(position);
        const pos = TileToPixel(this.position);
        this.anim.position.set(pos.x, pos.y);
        this.Patrol();
    }

    HitSpring(): void {
        this.cancelDelayedPatrol();
        gsap.killTweensOf(this.anim);
        this.state = VikingState.FALLING;

        this.position.Copy(this.map.GetRandomPosition());
        const pos = TileToPixel(this.position);
        gsap.to(this.anim, 1, {x: pos.x, y: pos.y - 400, ease: Power3.easeOut});

        const s = this.anim.scale.x * 2;
        gsap.to(this.anim.scale, 1, {x: s, y: s, yoyo: true, repeat: 1, ease: Power3.easeOut});
        gsap.to(this.anim, 1, {x: pos.x, y: pos.y, delay: 1, ease: Power3.easeIn,
            onComplete: () => {
                this.ChaseCat();
                this.anim.rotation = 0;
            }
        });
        gsap.to(this.anim, 1.75, {rotation: Math.PI * 6});
        this.game.sound.PlaySprite("sounds", "boing");
    }

    HitIceblock(): void {
        this.speed *= 0.5;
        Wait(5000, () => this.speed = 0.75);
    }

    DropSpring() : void {
        this.springs.Drop(this.position, 1);
    }

    SetListenerPosition(position: Vec2): void {
        const distance = Math.abs(position.length - this.position.length) / 10;
        const volume = distance > 1 ? 0 : 1 - Math.sqrt(distance);
        this.gallopSound.volume = volume;

        if(Math.random() > 0.93) {
            const neigh = this.game.sound.PlaySprite("sounds", "neigh" + RandomInt(1, 2));
            neigh.volume = volume;
        }
    }

    private OnCatFollowing(target: Vec2): void {
        if(this.state === VikingState.PATROLLING && target === this.position) {
            this.state = VikingState.END_PATROL;
            this.cancelDelayedPatrol();
        }
    }

    private ChaseCat(): void {
        this.state = VikingState.PATROLLING;

        if(this.catPositions.length) {
            const closestCat = FindClosestNode(this.map, this.position, this.catPositions);
            if(closestCat) {
                this.MoveTo(closestCat.position.x, closestCat.position.y, () => this.Patrol());
                return;
            }
        }

        this.Patrol();
    }

    private Patrol(): void {
        this.state = VikingState.PATROLLING;

        if(this.patrolIndex === -1) {
            let len = Number.MAX_VALUE;
            VikingWayPoints.forEach((c, i) =>  {
                const {x, y} = c;
                const path = FindShortestPath(this.map, this.position, {x, y});
                if(path.length < len) {
                    len = path.length;
                    this.patrolIndex = i;
                }
            });
        }

        const route = VikingWayPoints[this.patrolIndex];
        this.MoveTo(route.x, route.y, () => this.ChaseCat());
        this.patrolIndex = ++this.patrolIndex % VikingWayPoints.length;
    }

    private MoveTo(x: number, y: number, onComplete?: () => void): void {

        const path = FindShortestPath(this.map, this.position, {x, y});
        if(path && path.length > 1) {
            const p = path[1];
            if(p.x !== this.position.x) {
                this.Move(p.x < this.position.x ? "left" : "right", () => this.MoveTo(x, y, onComplete));
            } else {
                this.Move(p.y < this.position.y ? "up" : "down", () => this.MoveTo(x, y, onComplete));
            }
        } else {
           Callback(onComplete);
        }
    }

    private Move(direction: Direction, onComplete?: () => void): void {

        if(this.state === VikingState.DISABLED) {
            return;
        }

        const tileType = this.map.GetTile(this.position, direction).type;

        if(tileType === PathTileType.toString()) {
            this.anim.play();

            switch(direction) {
                case "left":
                    this.position.x -= 1;
                    this.anim.scale.x = -1;
                    this.anim.pivot.x = 16;
                    break;
                case "right":
                    this.position.x += 1;
                    this.anim.scale.x = 1;
                    this.anim.pivot.x = -16;
                    break;
                case "up":
                    this.position.y -= 1;
                    break;
                case "down":
                    this.position.y += 1;
                    break;
                }

            const pos = TileToPixel(this.position);
            gsap.to(this.anim, this.speed, {x: pos.x, y: pos.y, ease: Linear.easeNone, onComplete: () => {
                if(this.state === VikingState.END_PATROL) {
                    this.GoHome();
                } else {
                    Callback(onComplete);
                }
            }});

            Wait(500, () => this.game.dispatcher.emit(VIKING_MOVED, this.position));
        }
    }

    private GoHome(): void {
        this.state = VikingState.GOING_HOME;
        this.MoveTo(VikingHomeLocation.x, VikingHomeLocation.y, () => {
            this.cancelDelayedPatrol = Wait(5000, () => this.ChaseCat());
        });
    }

    private OnRoundFinished(): void {
        this.state = VikingState.DISABLED;
    }

    private OnNextRound(): void {
        this.springs.Reset();
        this.cancelDelayedPatrol();
        gsap.killTweensOf(this.anim);

        this.Start(VikingHomeLocation);
    }
}
