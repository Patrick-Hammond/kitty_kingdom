import GameComponent from "@breakspace/GameComponent";
import {Vec2, Vec2Like} from "@lib/math/Geometry";
import Player from "../player/Player";
import {PLAYER_MOVED, VIKING_MOVED} from "../../GameEvents";
import Cats from "../cat/Cats";
import Viking from "../viking/Viking";
import { Queue } from "@lib/datastructures/Queue";
import Iceblocks from "components/items/Iceblocks";

export default class Collisions extends GameComponent {

    private trail = Queue.Create<Vec2Like>(5);

    constructor(
        private player: Player,
        private viking: Viking,
        private cats: Cats,
        private iceblocks: Iceblocks) {

        super();

        this.game.dispatcher.on(PLAYER_MOVED, this.OnPlayerMoved, this);
        this.game.dispatcher.on(VIKING_MOVED, this.OnVikingMoved, this);
    }

    private OnPlayerMoved(position: Vec2): void {

        if(this.iceblocks.Collides(position)) {
            this.player.HitIceblock();
        }

        if(this.viking.Springs.Collides(position)) {
            this.player.HitSpring();
            return;
        }

        this.CheckCollisionWithCat(position);
    }

    private OnVikingMoved(position: Vec2): void {

        if(this.iceblocks.Collides(position)) {
            this.player.HitIceblock();
        }

        if(this.player.Springs.Collides(position)) {
            this.viking.HitSpring();
            return;
        }

        this.CheckCollisionWithCat(position);

        const playerChasing = this.trail.Queue(position.Clone()).Read().some(pos => this.player.Position.Equals(pos));
        if(playerChasing && Math.random() > 0.6) {
            this.viking.DropSpring();
        }

        this.viking.SetListenerPosition(this.player.Position);
    }

    private CheckCollisionWithCat(position: Vec2): void {
        this.cats.CheckCollision(position).forEach(cat => cat.Follow(position));
    }
}
