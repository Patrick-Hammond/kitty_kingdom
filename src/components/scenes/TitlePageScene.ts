import GameComponent from "@breakspace/GameComponent";
import { Sprite } from "pixi.js";
import { TITLE_SCREEN_CLOSED } from "../../GameEvents";
import LabelButton from "@breakspace/display/ui/LabelButton";
import { CenterScreen, RemoveFromParent } from "@breakspace/display/Utils";

export default class TitlePageScene extends GameComponent {

    private background : Sprite;
    private startButton: LabelButton;

    constructor() {
        super();

        this.background = this.assetFactory.CreateSprite("title");
        CenterScreen(this.background);

        this.startButton = new LabelButton("button", "play_label");
        this.startButton.position.set(794, 592);
        this.startButton.Enabled = true;

        this.root.addChild(this.background, this.startButton);
    }

    protected OnShow(): void {
        this.game.gamePad.WaitForButton(0, 0, this.Hide, this);
        this.startButton.once("pointertap", this.Hide, this);
        this.game.sound.PlaySprite("sounds", "theme");
    }

    private Hide(): void {
        this.game.sound.StopSprite("sounds", "theme");
        RemoveFromParent(this.root);
        this.game.dispatcher.emit(TITLE_SCREEN_CLOSED);
    }
}