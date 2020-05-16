import {AdjustmentFilter} from "pixi-filters";
import {RenderTexture, Sprite} from "pixi.js";
import GameComponent from "@breakspace/GameComponent";
import {RGB} from "@lib/utils/Types";
import {CAT_HOME_PLAYER, NEXT_ROUND} from "../../GameEvents";
import { PlayerHomeLocation, TileToPixel } from "components/map/Map";

export default class HomePlayer extends GameComponent {

    private tint = new AdjustmentFilter();
    private cat: Sprite;
    private cats: Sprite[] = [];
    private catCount: number = 0;

    protected OnInitialise(): void {
        this.cat = this.assetFactory.CreateSprite("cat_sit");
        this.cat.filters = [this.tint];

        const {x, y} = TileToPixel(PlayerHomeLocation);
        this.root.position.set(x - 39, y - 104);

        for (let i = 0; i < 6; i++) {
            const cat = new Sprite();
            cat.texture = RenderTexture.create({width: this.cat.width, height: 23});
            cat.anchor.set(0.5);
            cat.x = [20, 59, 41, 68, 26, -3][i];
            cat.y = [40, 40, 18, -8, 67, 32][i];
            this.cats.push(cat);
        }

        this.game.dispatcher.on(CAT_HOME_PLAYER, this.OnCatHome, this);
        this.game.dispatcher.on(NEXT_ROUND, this.OnRoundStart, this);
    }

    private OnCatHome(tint: RGB): void {
        if(this.catCount < 6) {
            this.tint.red   = tint.r;
            this.tint.green = tint.g;
            this.tint.blue  = tint.b;

            const cat = this.cats[this.catCount];
            this.game.renderer.render(this.cat, cat.texture as RenderTexture);
            this.root.addChild(cat);

            this.catCount++;

            this.game.sound.PlaySprite("sounds", "home");
        }
    }

    private OnRoundStart(): void {
        this.root.removeChildren();
        this.catCount = 0;
    }
}
