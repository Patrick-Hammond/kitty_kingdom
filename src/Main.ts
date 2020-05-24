import GameComponent from "@breakspace/GameComponent";
import Camera from "breakspace/src/breakspace/display/Camera";
import HomePlayer from "./components/player/HomePlayer";
import HomeViking from "./components/viking/HomeViking";
import Map, {PlayerHomeLocation, VikingHomeLocation}  from "./components/map/Map";
import Player from "./components/player/Player";
import Viking from "./components/viking/Viking";
import Collisions from "./components/map/Collisions";
import Cats from "./components/cat/Cats";
import {Scenes, AssetPath, GameHeight, GameWidth, GameScale} from "./Constants";
import GamePlay from "./components/GamePlay";
import { TITLE_SCREEN_CLOSED, SOUND_SCREEN_CLOSED } from "./GameEvents";
import TileMapRenderer from "@breakspace/display/TileMapRenderer";
import Game from "@breakspace/Game";
import TitlePage from "./components/scenes/TitlePage";
import Summary from "./components/scenes/Summary";
import { LoadTileMap } from "@breakspace/loading/tilemap/TileMapLoader";
import TileMapModel from "@breakspace/loading/tilemap/TiledJson";
import { Rectangle } from "breakspace/src/_lib/math/Geometry";
import SoundSelect from "components/scenes/SoundSelect";
import Iceblocks from "components/items/Iceblocks";

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
    private iceblocks: Iceblocks;

    constructor(game: Game) {
        super();

        game.loader.add(AssetPath + "spritesheet.json");
        game.loader.add(AssetPath + "numbers-export.fnt");
        game.loader.add(AssetPath + "sounds/sounds.json");
        game.loader.load(() => {
            LoadTileMap('level2', AssetPath + 'level2.json')
                .then((map: TileMapModel) => {

                    this.mapModel = map;

                    game.sceneManager.AddScene(Scenes.SOUND, new SoundSelect());
                    game.sceneManager.AddScene(Scenes.TITLE, new TitlePage());
                    game.sceneManager.AddScene(Scenes.GAME, this);
                    game.sceneManager.AddScene(Scenes.SUMMARY, new Summary());

                    game.sceneManager.ShowScene(Scenes.SOUND);
                })
                .catch((error: Error) => {
                    throw(error);
                });
        });

        game.dispatcher.once(SOUND_SCREEN_CLOSED, this.ShowTitle, this);
    }

    protected OnInitialise(): void {

        const mapWidth = this.mapModel.width * this.mapModel.tilewidth;
        const mapHeight = this.mapModel.height * this.mapModel.tileheight;
        const bounds = mapHeight <= GameHeight && mapWidth <= GameWidth ? new Rectangle(0, 0, mapWidth, mapHeight) : null;
        this.camera = new Camera({x: GameWidth, y: GameHeight}, GameScale, bounds);

        this.map = new Map(this.mapModel);
        this.mapRenderer = new TileMapRenderer(this.mapModel, this.camera);

        this.player = new Player(this.map, this.camera);
        this.playerHome = new HomePlayer();

        this.viking = new Viking(this.map);
        this.vikingHome = new HomeViking();

        this.cats = new Cats(this.map);

        this.iceblocks = new Iceblocks(this.map);

        new Collisions(this.player, this.viking, this.cats, this.iceblocks);

        new GamePlay();

        const ambiance = this.game.sound.PlaySprite("sounds", "ambiance");
        ambiance.volume = 0.01;

        this.root.addChild(this.mapRenderer);
        this.mapRenderer.addChild(
            this.player.Springs.root, this.viking.Springs.root,
            this.cats.root, this.viking.root, this.player.root, this.iceblocks.root,
            this.playerHome.root, this.vikingHome.root
        );
    }

    private ShowTitle(): void {
        this.game.sceneManager.ShowScene(Scenes.TITLE);
        this.game.dispatcher.once(TITLE_SCREEN_CLOSED, this.Start, this);
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
}

new Main(new Game({width: GameWidth, height: GameHeight, fullscreen: true }));