import GameComponent from "@breakspace/GameComponent";
import ObjectPool from "@lib/patterns/ObjectPool";
import Cat from "./Cat";
import Map from "../Map";
import {CAT_POSITIONS, CAT_HOME_PLAYER, CAT_HOME_VIKING, NEXT_ROUND} from "../../GameEvents";
import { GetInterval, Wait } from "@lib/utils/Timing";
import { Vec2Like } from "@lib/math/Geometry";

export default class Cats extends GameComponent {

    private cats: ObjectPool<Cat>;
    private catDispatched: number;


    constructor(map: Map) {

        super();

        this.cats = new ObjectPool<Cat>(6, () => new Cat(this.root, map), cat => cat.Destroy());

        this.game.dispatcher.on(CAT_HOME_PLAYER, (tint, cat) => this.OnCatHome(cat));
        this.game.dispatcher.on(CAT_HOME_VIKING, (tint, cat) => this.OnCatHome(cat));
        this.game.dispatcher.on(NEXT_ROUND, this.OnRoundStart, this);
    }

    Start(): void {
        this.catDispatched = 0;

        GetInterval(5000, this.DispatchNext, this);
        Wait(500, this.DispatchNext, this);

        GetInterval(5000, this.BroadcastPositions, this);
    }

    CheckCollision(position: Vec2Like): Cat[] {
        return this.cats.Popped.filter(cat => cat.CheckCollision(position));
    }

    private DispatchNext(): void {
        if(this.catDispatched < 6) {
            this.cats.Get().Start();
            this.catDispatched++;
        }
    }

    private BroadcastPositions(): void {
        this.game.dispatcher.emit(CAT_POSITIONS, this.cats.Popped);
    }

    private OnCatHome(cat: Cat) : void {
        this.cats.Put(cat);
    }

    private OnRoundStart(): void {
        this.catDispatched = 0;
        this.cats.RestoreAll();
    }
}
