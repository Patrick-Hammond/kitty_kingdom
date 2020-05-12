import GameComponent from "@breakspace/GameComponent";
import Camera from "breakspace/src/breakspace/display/Camera";
import HomePlayer from "./components/player/HomePlayer";
import HomeViking from "./components/viking/HomeViking";
import Map, {PlayerHomeLocation, VikingHomeLocation}  from "./components/Map";
import Player from "./components/player/Player";
import Viking from "./components/viking/Viking";
import Collisions from "./components/Collisions";
import Cats from "./components/cat/Cats";
import {Scenes, AssetPath, GameHeight, GameWidth} from "./Constants";
import ScoreKeeper from "./components/ScoreKeeper";
import { TITLE_SCREEN_CLOSED, ROUND_FINISHED, NEXT_ROUND } from "./GameEvents";
import TileMapRenderer from "@breakspace/display/TileMapRenderer";
// import { KawaseBlurFilter } from "pixi-filters";
import Game from "@breakspace/Game";
import TitlePage from "./components/scenes/TitlePage";
import Summary from "./components/scenes/Summary";
import { LoadTileMap } from "@breakspace/loading/tilemap/TileMapLoader";
import TileMapModel from "@breakspace/loading/tilemap/TiledJson";
import { Rectangle } from "breakspace/src/_lib/math/Geometry";

export default class Main extends GameComponent {

    private camera: Camera;
    private mapModel: TileMapModel;
    private map: Map;
    private mapRenderer: TileMapRenderer;
    private player: Player;
    private playerHome: HomePlayer;
    private viking: Viking;
    private vikingHome: HomeViking;
    private cats: Cats;

    // private blur = new KawaseBlurFilter(4, 5);

    constructor(game: Game) {
        super();

        game.loader.add(AssetPath + "spritesheet.json");
        game.loader.add(AssetPath + "numbers-export.fnt");
        game.loader.load(() => {
            LoadTileMap('level2', AssetPath + 'level2.json')
                .then((map: TileMapModel) => {

                    this.mapModel = map;

                    game.sceneManager.AddScene(Scenes.TITLE, new TitlePage());
                    game.sceneManager.AddScene(Scenes.GAME, this);
                    game.sceneManager.AddScene(Scenes.SUMMARY, new Summary());

                    game.sceneManager.ShowScene(Scenes.TITLE);
                })
                .catch((error: Error) => {
                    throw(error);
                });
        });

        game.dispatcher.once(TITLE_SCREEN_CLOSED, this.Start, this);
        game.dispatcher.on(ROUND_FINISHED, this.OnRoundFinished, this);
        game.dispatcher.on(NEXT_ROUND, this.OnNextRound, this);
    }

    protected OnInitialise(): void {

        const bounds = new Rectangle(0, 0, this.mapModel.width * this.mapModel.tilewidth, this.mapModel.height * this.mapModel.tileheight);
        this.camera = new Camera({x: GameWidth, y: GameHeight}, 0.4, bounds);

        this.map = new Map(this.mapModel);
        this.mapRenderer = new TileMapRenderer(this.mapModel, this.camera);

        this.player = new Player(this.map, this.camera);
        this.playerHome = new HomePlayer();

        this.viking = new Viking(this.map);
        this.vikingHome = new HomeViking();

        this.cats = new Cats(this.map);

        new Collisions(this.player, this.viking, this.cats);

        new ScoreKeeper();

        this.root.addChild(this.mapRenderer);
        this.mapRenderer.addChild(
            this.player.Springs.root, this.viking.Springs.root,
            this.cats.root, this.viking.root, this.player.root,
            this.playerHome.root, this.vikingHome.root
        );
    }

    private Start(): void {

        this.game.sceneManager.ShowScene(Scenes.GAME);

        this.player.Start(PlayerHomeLocation);
        this.viking.Start(VikingHomeLocation);
        this.cats.Start();

        this.game.ticker.add(this.OnUpdate, this);
    }

    private OnUpdate(): void {
        this.player.OnUpdate();
    }

    private OnRoundFinished(): void {
        // this.mapRenderer.filters = [this.blur];
        // this.mapRenderer.filterArea.copyFrom(this.game.screen);
    }

    private OnNextRound(): void {
        // this.mapRenderer.filters = null;
    }
}

new Main(new Game({width: GameWidth, height: GameHeight, fullscreen: true }));