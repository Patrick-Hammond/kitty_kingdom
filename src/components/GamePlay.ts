import GameComponent from "@breakspace/GameComponent";
import { CAT_HOME_PLAYER, CAT_HOME_VIKING, NEXT_ROUND, ROUND_FINISHED } from "../GameEvents";
import Cat from "./cat/Cat";

export default class GamePlay extends GameComponent {

    // private roundNumber: number = 0;
    private catsHomePlayer: number;
    private catsHomeViking: number;
    private playerRoundsWon: number;
    private vikingRoundsWon: number;

    constructor() {
        super();

        this.playerRoundsWon = this.vikingRoundsWon = 0;
        this.catsHomePlayer  = this.catsHomeViking = 0;

        this.game.dispatcher.on(NEXT_ROUND, this.OnRoundStart, this);
        this.game.dispatcher.on(CAT_HOME_PLAYER, (tint, cat) => this.OnCatHome("player", cat));
        this.game.dispatcher.on(CAT_HOME_VIKING, (tint, cat) => this.OnCatHome("viking", cat));
    }

    private OnRoundStart(): void {
        this.catsHomePlayer  = this.catsHomeViking = 0;
    }

    private OnCatHome(home: "player" | "viking", cat: Cat) : void {

        home === "player" ? this.catsHomePlayer++ : this.catsHomeViking++;

        if(this.catsHomePlayer === 6 || this.catsHomeViking === 6) {

            const playerWon = this.catsHomePlayer > this.catsHomeViking;

            playerWon ? this.playerRoundsWon++ : this.vikingRoundsWon++;

            this.game.dispatcher.emit(ROUND_FINISHED, playerWon, this.playerRoundsWon.toString(), this.vikingRoundsWon.toString());
        }
    }
}