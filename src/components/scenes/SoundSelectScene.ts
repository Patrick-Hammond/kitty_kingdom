import GameComponent from "@breakspace/GameComponent";
import { SOUND_SCREEN_CLOSED } from "../../GameEvents";
import LabelButton from "@breakspace/display/ui/LabelButton";
import { CenterScreen, RemoveFromParent, HGroup } from "@breakspace/display/Utils";
import AssetFactory from "breakspace/src/breakspace/loading/AssetFactory";

export default class SoundSelectScene extends GameComponent {

    private soundOn:  LabelButton;
    private soundOff: LabelButton;

    constructor() {
        super();

        const bg = AssetFactory.inst.CreateSprite("bg");

        this.soundOff = new LabelButton("small_button", "sound_off_label");
        this.soundOff.Enabled = true;

        this.soundOn  = new LabelButton("small_button", "sound_on_label");
        this.soundOn.Enabled = true;

        const buttons = HGroup(50, this.soundOff, this.soundOn);
        CenterScreen(bg, buttons);

        this.root.addChild(bg, buttons);
    }

    protected OnShow(): void {
        this.soundOn.once("pointertap",  () => this.Hide(true));
        this.soundOff.once("pointertap", () => this.Hide(false));
    }

    private Hide(soundOn: boolean): void {

        if(!soundOn) {
            this.game.sound.Mute(true);
        }

        RemoveFromParent(this.root);
        this.game.dispatcher.emit(SOUND_SCREEN_CLOSED);
    }
}