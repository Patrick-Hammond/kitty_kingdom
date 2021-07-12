import GameComponent from "@breakspace/GameComponent";
import Camera from "breakspace/src/breakspace/display/Camera";
import Map from "./components/map/Map";
import {Scenes, GameHeight, GameWidth, GameScale} from "./Constants";
import GamePlay from "./components/GamePlay";
import { SOUND_SCREEN_CLOSED, LEVEL_LOADED, LEVEL_START } from "./GameEvents";
import TileMapRenderer from "@breakspace/display/TileMapRenderer";
import Game from "@breakspace/Game";
import TitlePageScene from "./components/scenes/TitlePageScene";
import SummaryScene from "./components/scenes/SummaryScene";
import TileMapModel from "@breakspace/loading/tilemap/TiledJson";
import { Rectangle } from "breakspace/src/_lib/math/Geometry";
import SoundSelectScene from "components/scenes/SoundSelectScene";

import GameScene from "components/scenes/GameScene";

export default class Main extends GameComponent {

    private camera: Camera;
    private map: Map;
    private mapRenderer: TileMapRenderer;

    constructor(game: Game) {
        super();

        game.Load("assets/assets.json", () => {

            this.Create();

            game.sceneManager.ShowScene(Scenes.SOUND);
            game.dispatcher.once(SOUND_SCREEN_CLOSED, () => this.game.sceneManager.ShowScene(Scenes.TITLE));

            game.dispatcher.on(LEVEL_LOADED, this.OnLevelLoaded, this);

            new GamePlay();
        });
    }

    private Create(): void
    {
        this.camera = new Camera({x: GameWidth, y: GameHeight}, GameScale);

        this.map = new Map();
        this.mapRenderer = new TileMapRenderer(this.camera);

        this.game.sceneManager.AddScene(Scenes.TITLE, new TitlePageScene());
        this.game.sceneManager.AddScene(Scenes.GAME, new GameScene(this.map, this.mapRenderer, this.camera));
        this.game.sceneManager.AddScene(Scenes.SUMMARY, new SummaryScene());
        this.game.sceneManager.AddScene(Scenes.SOUND, new SoundSelectScene());
    }

    private OnLevelLoaded(mapModel: TileMapModel): void {

        const mapWidth = mapModel.width * mapModel.tilewidth;
        const mapHeight = mapModel.height * mapModel.tileheight;
        this.camera.limitBounds = mapHeight <= GameHeight && mapWidth <= GameWidth ? new Rectangle(0, 0, mapWidth, mapHeight) : null;

        this.map.SetMapModel(mapModel);
        this.mapRenderer.SetMapModel(mapModel);

        this.game.sceneManager.ShowScene(Scenes.GAME);

        this.game.dispatcher.emit(LEVEL_START);
    }
}

new Main(new Game({width: GameWidth, height: GameHeight, fullscreen: true, defaultAssetChunkName: "main" }));