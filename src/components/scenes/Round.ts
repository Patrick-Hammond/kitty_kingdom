import GameComponent from "@breakspace/GameComponent";
import { Sprite, Texture } from "pixi.js";
import { CenterScreen, RemoveFromParent, Group, HGroup } from "@breakspace/display/Utils";
import { Wait } from "breakspace/src/_lib/utils/Timing";
import { ROUND_SCREEN_CLOSED } from "GameEvents";

export default class Round extends GameComponent {

    private middle: Sprite;
    private levelNum : Sprite;
    private levelNums : Texture[] = [];
    private bannerGruop: Group;
    private labelGroup: Group;

    constructor() {
        super();

        const left   = this.assetFactory.CreateSprite("banner_left");
        this.middle = this.assetFactory.CreateSprite("banner_left");
        const right  = this.assetFactory.CreateSprite("banner_left");
        const level  = this.assetFactory.CreateSprite("Level_text");

        ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"].map(name =>
            this.assetFactory.CreateTexture(name + "_text.png")
        );

        this.bannerGruop = HGroup(0, left, this.middle, right);
        this.labelGroup  = HGroup(20, level, this.levelNum);
    }

    protected Show(levelNum: number): void {
        this.levelNum.texture = this.levelNums[levelNum - 1];
        this.root.addChild(this.bannerGruop, this.labelGroup);

        this.middle.width = this.levelNum.width;
        CenterScreen(this.bannerGruop.Update());
        CenterScreen(this.labelGroup.Update());

        Wait(2000, this.Hide, this);
    }

    private Hide(): void {
        RemoveFromParent(this.root);
        this.game.dispatcher.emit(ROUND_SCREEN_CLOSED);
    }
}