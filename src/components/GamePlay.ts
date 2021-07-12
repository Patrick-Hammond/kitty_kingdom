import GameComponent from "@breakspace/GameComponent";
import { CAT_HOME_PLAYER, CAT_HOME_VIKING, LEVEL_FINISHED, TITLE_SCREEN_CLOSED, LEVEL_LOADED } from "../GameEvents";
import Cat from "./cat/Cat";
import { LoadLevel } from "./LevelLoader";

export default class GamePlay extends GameComponent {

    private levelNames: string[];
    // private roundNumber: number = 0;

    private levelNumber: number;

    private catsHomePlayer: number;
    private catsHomeViking: number;
    private playerRoundsWon: number;
    private vikingRoundsWon: number;

    constructor() {
        super();

        this.levelNames = this.assetFactory.GetConfig().data.levelNames;

        this.game.dispatcher.on(CAT_HOME_PLAYER, (tint, cat) => this.OnCatHome("player", cat));
        this.game.dispatcher.on(CAT_HOME_VIKING, (tint, cat) => this.OnCatHome("viking", cat));

        this.game.dispatcher.once(TITLE_SCREEN_CLOSED, this.OnGameStart, this);
    }

    private OnGameStart(): void {
        this.levelNumber = 0;
        this.playerRoundsWon = this.vikingRoundsWon = 0;

        this.StartNextLevel();
    }

    private StartNextLevel(): void {
        LoadLevel(this.levelNames[this.levelNumber], (map) => {
            this.catsHomePlayer  = this.catsHomeViking = 0;
            this.game.dispatcher.emit(LEVEL_LOADED, map);
        });
    }

    private OnCatHome(home: "player" | "viking", cat: Cat) : void {

        home === "player" ? this.catsHomePlayer++ : this.catsHomeViking++;

        if(this.catsHomePlayer === 6 || this.catsHomeViking === 6) {

            const playerWon = this.catsHomePlayer > this.catsHomeViking;

            playerWon ? this.playerRoundsWon++ : this.vikingRoundsWon++;

            this.game.dispatcher.emit(LEVEL_FINISHED, playerWon, this.playerRoundsWon.toString(), this.vikingRoundsWon.toString());
        }
    }
}