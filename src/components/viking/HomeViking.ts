import {AdjustmentFilter} from "pixi-filters";
import {RenderTexture, Sprite} from "pixi.js";
import GameComponent from "@breakspace/GameComponent";
import {RGB} from "@lib/utils/Types";
import {CAT_HOME_VIKING, LEVEL_START} from "../../GameEvents";
import { VikingHomeLocation, TileToPixel } from "components/map/Map";

export default class HomeViking extends GameComponent {

    private tint = new AdjustmentFilter();
    private cat: Sprite;
    private cats: Sprite[] = [];
    private catCount: number = 0;

    constructor() {
        super();
        this.game.dispatcher.on(CAT_HOME_VIKING, this.OnCatHome, this);
        this.game.dispatcher.on(LEVEL_START, this.OnLevelStart, this);
    }

    private OnLevelStart(): void {
        const {x, y} = TileToPixel(VikingHomeLocation);
        this.root.position.set(11 + x, y - 80);

        this.cat = this.assetFactory.CreateSprite("cat_sit");
        this.cat.filters = [this.tint];

        for (let i = 0; i < 6; i++) {
            const cat = new Sprite();
            cat.texture = RenderTexture.create({width: this.cat.width, height: this.cat.height});
            cat.anchor.set(0.5);
            cat.position.set((i % 2) * 20 - ((i > 1 && i < 4) ? 10 : 0), Math.floor(i / 2) * 12);
            this.cats.push(cat);
        }
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

            this.game.sound.PlaySprite("sounds", "lose");
        }
    }
}
