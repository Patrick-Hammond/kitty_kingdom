import GameComponent from "@breakspace/GameComponent";
import { TITLE_SCREEN_CLOSED } from "../GameEvents";

export default class Sound extends GameComponent {

    constructor() {
        super();

        this.game.dispatcher.once(TITLE_SCREEN_CLOSED, this.OnGameStart, this);
    }

    private OnGameStart(): void {
        const ambiance = this.game.sound.PlaySprite("sounds", "ambiance");
        ambiance.volume = 0.01;
    }
}