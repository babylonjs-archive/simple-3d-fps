import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture.js";
import { Button } from "@babylonjs/gui/2D/controls/button.js";
import { Control } from "@babylonjs/gui/2D/controls/control.js";
import { Image } from "@babylonjs/gui/2D/controls/image.js";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock.js";
import { Vector2WithInfo } from "@babylonjs/gui/2D/math2D.js";

export interface Options {
    alpha?: number;
    width?: number;
    height?: number;
    color?: string;
    fontSize?: number | string;
    outlineWidth?: any;
    outlineColor?: string;
    background?: string;
    left?: string;
    top?: string;
    horizontalAlignment?: number;
    verticalAlignment?: number;
    lineSpacing?: string;
    wrapping?: boolean;
    onClick?: (evt: Vector2WithInfo) => void;
}

export class UI {
    controls: Set<Control> = new Set();
    menuTexture: AdvancedDynamicTexture;

    constructor(name: string) {
        this.menuTexture = AdvancedDynamicTexture.CreateFullscreenUI(name);
    }

    addButton(name: string, text: string, options: Options = {}) {
        const button = Button.CreateSimpleButton(name, text);

        button.width = options.width || 0.5;
        button.height = options.height || "60px";
        button.color = options.color || "black";
        // button.outlineWidth = options.outlineWidth || 0;
        // button.outlineColor = options.outlineColor || button.color;
        button.alpha = typeof options.alpha !== "undefined" ? button.alpha : 1;
        button.background = options.background || "white";
        button.left = options.left || "0px";
        button.top = options.top || "0px";
        button.horizontalAlignment =
            typeof options.horizontalAlignment !== "undefined"
                ? options.horizontalAlignment
                : Control.HORIZONTAL_ALIGNMENT_CENTER;
        button.verticalAlignment =
            typeof options.verticalAlignment !== "undefined"
                ? options.verticalAlignment
                : Control.VERTICAL_ALIGNMENT_CENTER;

        if (options.onClick) {
            button.onPointerUpObservable.add(options.onClick);
        }

        this.menuTexture.addControl(button);
        this.add(button);

        return button;
    }

    addText(text: string, options: Options = {}) {
        const textControl = new TextBlock();
        textControl.text = text;
        textControl.color = options.color || "white";
        textControl.fontSize = options.fontSize || 28;
        textControl.outlineWidth = options.outlineWidth || 0;
        textControl.outlineColor = options.outlineColor || "black";
        textControl.lineSpacing = options.lineSpacing || "5px";
        textControl.left = options.left || "0px";
        textControl.top = options.top || "0px";
        textControl.textHorizontalAlignment =
            typeof options.horizontalAlignment !== "undefined"
                ? options.horizontalAlignment
                : Control.HORIZONTAL_ALIGNMENT_CENTER;
        textControl.textVerticalAlignment =
            typeof options.verticalAlignment !== "undefined"
                ? options.verticalAlignment
                : Control.VERTICAL_ALIGNMENT_TOP;
        textControl.textWrapping = options.wrapping || true;

        this.menuTexture.addControl(textControl);
        this.add(textControl);

        return textControl;
    }

    addImage(name: string, file: string, options: Options) {
        let image = new Image(name, file);

        image.stretch = Image.STRETCH_UNIFORM;
        image.width = options.width!;
        image.height = options.height!;
        image.left = options.left || "0px";
        image.top = options.top || "0px";
        image.horizontalAlignment =
            typeof options.horizontalAlignment !== "undefined"
                ? options.horizontalAlignment
                : Control.HORIZONTAL_ALIGNMENT_CENTER;
        image.verticalAlignment =
            typeof options.verticalAlignment !== "undefined"
                ? options.verticalAlignment
                : Control.VERTICAL_ALIGNMENT_TOP;

        this.menuTexture.addControl(image);
        this.add(image);

        return image;
    }

    add(control: Control) {
        this.controls.add(control);
    }

    remove(control: Control) {
        control.isVisible = false;
        this.controls.delete(control);
    }

    show() {
        for (const control of this.controls) {
            control.isVisible = true;
        }
    }

    hide() {
        for (const control of this.controls) {
            control.isVisible = false;
        }
    }
}
