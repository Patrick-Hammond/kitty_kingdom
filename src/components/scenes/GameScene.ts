import GameComponent from "@breakspace/GameComponent";
import Player from "../player/Player";
import Viking from "../viking/Viking";
import Collisions from "../map/Collisions";
import Cats from "../cat/Cats";
import HomePlayer from "../player/HomePlayer";
import HomeViking from "../viking/HomeViking";
import Iceblocks from "components/items/Iceblocks";
import Map from "components/map/Map";
import Camera from "breakspace/src/breakspace/display/Camera";
import TileMapRenderer from "breakspace/src/breakspace/display/TileMapRenderer";

export default class GameScene extends GameComponent {

    private player: Player;
    private playerHome: HomePlayer;
    private viking: Viking;
    private vikingHome: HomeViking;
    private cats: Cats;
    private iceblocks: Iceblocks;

    constructor(map: Map, mapRenderer: TileMapRenderer, camera: Camera) {
        super();

        this.player = new Player(map, camera);
        this.playerHome = new HomePlayer();

        this.viking = new Viking(map);
        this.vikingHome = new HomeViking();

        this.cats = new Cats(map);

        this.iceblocks = new Iceblocks(map);

        new Collisions(this.player, this.viking, this.cats, this.iceblocks);

        this.root.addChild(mapRenderer);
        mapRenderer.overlay.addChild(
            this.player.Springs.root, this.viking.Springs.root,
            this.cats.root, this.viking.root, this.player.root, this.iceblocks.root,
            this.playerHome.root, this.vikingHome.root
        );
    }
}
