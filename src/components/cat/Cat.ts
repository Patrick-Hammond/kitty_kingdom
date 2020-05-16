import gsap, {Linear} from "gsap";
import {AdjustmentFilter} from "pixi-filters";
import {FindShortestPath} from "@lib/algorithms/PathSearch";
import {AnimationSequence} from "@breakspace/display/AnimationSequence";
import {RemoveFromParent, Callback} from "@breakspace/display/Utils";
import GameComponent from "@breakspace/GameComponent";
import {Vec2, Vec2Like} from "@lib/math/Geometry";
import {Wait} from "@lib/utils/Timing";
import {PlayerHomeLocation, VikingHomeLocation} from "../map/Map";
import {CAT_FOLLOWING, CAT_HOME_PLAYER, CAT_HOME_VIKING, CAT_MOVED} from "../../GameEvents";
import {TileToPixel} from "../map/Map";
import Map from "../map/Map";

enum CatState {
    FALLING, ACTIVE, HOME
}

export default class Cat extends GameComponent {
    private anim: AnimationSequence;
    private position = new Vec2();
    private followTartget: Vec2;
    private tint = new AdjustmentFilter();
    private speed = Math.random() * 0.5 + 1;
    private state: CatState;

    constructor(private parent: PIXI.Container, private map: Map) {
        super();

        this.anim = new AnimationSequence(["cat_fall", "cat_sit", "cat_walkr", "cat_walkl", "cat_walku", "cat_walkd"]);
        this.anim.root.pivot.set(-7, -7);
        this.anim.root.scale.set(0.5);
        this.anim.root.filters = [this.tint];
        this.root.addChild(this.anim.root);
    }

    get Position(): Vec2 {
        return this.position;
    }

    Start(): void {
        this.SetRandomTint();

        this.position.Copy(this.map.GetRandomPosition());
        this.FallIn();
    }

    CheckCollision(position: Vec2Like): boolean {
        return this.state === CatState.ACTIVE && this.position.Equals(position.x, position.y);
    }

    Follow(target: Vec2): void {
        if(this.state === CatState.ACTIVE) {
            if(target !== this.followTartget) {
                const startFollowing = this.followTartget == null;
                this.followTartget = target;
                if(startFollowing) {
                    this.MoveToFollowTarget();
                }
                this.game.sound.PlaySprite("sounds", "meow2");
            }
            this.game.dispatcher.emit(CAT_FOLLOWING, target);
        }
    }

    Destroy(): void {
        this.followTartget = null;
        this.anim.Stop();
        RemoveFromParent(this.root);
    }

    private MoveTo(x: number, y: number, onComplete?: () => void): void {
        this.position.Set(x, y);
        const pos = TileToPixel({x, y});
        const root = this.anim.root;
        gsap.to(root, this.speed, {x: pos.x, y: pos.y, ease: Linear.easeNone, onComplete: () => {
            Callback(onComplete);
        }});

        if(pos.x !== root.x) {
            this.anim.PlayLooped(pos.x > root.x ? "cat_walkr" : "cat_walkl");
        } else if(pos.y !== root.y) {
            this.anim.PlayLooped(pos.y > root.y ? "cat_walkd" : "cat_walku");
        }

        Wait(this.speed * 0.75, () => this.game.dispatcher.emit(CAT_MOVED, this));
    }

    private MoveToFollowTarget(): void {

        if(this.CheckIsHome()) {
            return;
        }

        const path = FindShortestPath(this.map, this.position, this.followTartget);
        if(path.length > 1) {
            this.MoveTo(path[1].x, path[1].y, () => this.MoveToFollowTarget());
        } else {
            this.anim.Play("cat_sit");
            Wait(1000, this.MoveToFollowTarget, this);
        }
    }

    private SetRandomTint(): void {
        this.tint.red   = Math.random() > 0.6 ? 0.7 + Math.random() * 0.5 : 1;
        this.tint.green = Math.random() > 0.6 ? 0.7 + Math.random() * 0.5 : 1;
        this.tint.blue  = Math.random() > 0.6 ? 0.7 + Math.random() * 0.5 : 1;
    }

    private FallIn(): void {
        this.parent.parent.addChild(this.root);
        this.state = CatState.FALLING;
        const pos = TileToPixel(this.position);
        this.anim.root.position.set(pos.x, pos.y);
        this.anim.Play("cat_fall");

        gsap.from(this.anim.root, 5, {x: pos.x, y: pos.y - 400, ease: Linear.easeNone, onComplete: () => {
            this.state = CatState.ACTIVE;
            this.anim.Play("cat_sit");
            this.parent.addChild(this.root);
        }});
    }

    private CheckIsHome(): boolean {
        const homePlayer = this.position.Equals(PlayerHomeLocation);
        const homeViking = this.position.Equals(VikingHomeLocation);
        const isHome = homePlayer || homeViking;
        if (isHome) {
            Wait(200, () => this.game.sound.PlaySprite("sounds", "meow1"));
            this.state = CatState.HOME;
            this.Destroy();
            this.game.dispatcher.emit(homePlayer ? CAT_HOME_PLAYER : CAT_HOME_VIKING,
                {r: this.tint.red, g: this.tint.green, b: this.tint.blue}, this);
        }
        return isHome;
    }
}
