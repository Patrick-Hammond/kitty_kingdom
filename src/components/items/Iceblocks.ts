
import GameComponent from "@breakspace/GameComponent";
import { Vec2Like, Vec2 } from "@lib/math/Geometry";
import { Sprite } from "pixi.js";
import ObjectPool from "@lib/patterns/ObjectPool";
import AssetFactory from "@breakspace/loading/AssetFactory";
import Map, { TileToPixel } from "../map/Map";
import { RemoveFromParent } from "@breakspace/display/Utils";
import { Wait } from "breakspace/src/_lib/utils/Timing";
import { RandomInt } from "breakspace/src/_lib/math/Utils";
import { NullFunction } from "breakspace/src/_lib/patterns/FunctionUtils";
import { NEXT_ROUND, ROUND_FINISHED } from "GameEvents";

export default class Iceblocks extends GameComponent {

    private icePool: ObjectPool<IceBlock>;
    private cancel = NullFunction;

    constructor(private map: Map) {
        super();

        this.icePool = new ObjectPool<IceBlock>(2, () => new IceBlock(), s => RemoveFromParent(s));
    }

    protected OnInitialise(): void {

        this.game.dispatcher.on(ROUND_FINISHED, this.OnRoundFinished, this);
        this.game.dispatcher.on(NEXT_ROUND, this.OnNextRound, this);

        this.Drop(this.map.GetRandomPosition(), 2);
    }

    Drop(position: Vec2Like, max: number): boolean {
        const hasIceblock = this.HasIceblock(position);
        if(!hasIceblock) {
            if(this.icePool.Popped.length < max) {
                const iceblock = this.icePool.Get();
                iceblock.SetPosition(position);
                this.root.addChild(iceblock);
            }
        }
        return hasIceblock;
    }

    Collides(position: Vec2Like): boolean {
        const hit = this.icePool.Popped.find(iceblock => iceblock.Collides(position));
        if(hit) {
            this.game.sound.PlaySprite("sounds", "slurp");

            this.Restore(hit);

            this.cancel = Wait(RandomInt(25, 60) * 1000, () => {
                this.Drop(this.map.GetRandomPosition(), 2);
            });
        }
        return hit != null;
    }

    private Restore(iceblock: IceBlock): void {
        RemoveFromParent(iceblock);
        this.icePool.Put(iceblock);
    }

    private HasIceblock(position: Vec2Like): boolean {
        return this.icePool.Popped.some(spring => spring.Collides(position));
    }

    private OnRoundFinished(): void {
        this.cancel();
    }

    private OnNextRound(): void {
        this.Drop(this.map.GetRandomPosition(), 2);
    }
}

class IceBlock extends Sprite {

    private tilePos: Vec2 = new Vec2(-1, -1);

    constructor() {
        super(AssetFactory.inst.CreateTexture("iceblock"));

        this.pivot.set(-7, -7);
        this.scale.set(0.5);
    }

    SetPosition(position: Vec2Like): void {
        this.tilePos.Copy(position);

        const pos = TileToPixel(this.tilePos);
        this.position.set(pos.x, pos.y);
    }

    Collides(position: Vec2Like): boolean {
        return this.tilePos.Equals(position);
    }
}