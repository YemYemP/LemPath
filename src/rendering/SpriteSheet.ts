// ── Sprite sheet animation ────────────────────────────────────────────────────

import { AssetLoader } from '../engine/AssetLoader';

export interface SpriteAnimation {
  sheetId: string;        // AssetLoader image key
  frameWidth: number;
  frameHeight: number;
  row: number;            // row in the sprite sheet for this animation
  frameCount: number;
  frameDuration: number;  // ms per frame
  loop: boolean;
}

export interface SpriteSheet {
  imageId: string;
  frameWidth: number;
  frameHeight: number;
  animations: Record<string, SpriteAnimation>;
}

export class SpriteAnimator {
  private elapsed      = 0;
  private currentFrame = 0;
  private _done        = false;

  constructor(private anim: SpriteAnimation) {}

  get done(): boolean { return this._done; }

  setAnimation(anim: SpriteAnimation, reset = true): void {
    if (reset || this.anim.sheetId !== anim.sheetId || this.anim.row !== anim.row) {
      this.anim    = anim;
      this.elapsed = 0;
      this.currentFrame = 0;
      this._done   = false;
    }
  }

  update(dt: number): void {
    if (this._done) return;
    this.elapsed += dt;
    while (this.elapsed >= this.anim.frameDuration) {
      this.elapsed -= this.anim.frameDuration;
      this.currentFrame++;
      if (this.currentFrame >= this.anim.frameCount) {
        if (this.anim.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.anim.frameCount - 1;
          this._done = true;
        }
      }
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    flipX = false,
  ): void {
    const img = AssetLoader.getImage(this.anim.sheetId);
    const sx  = this.currentFrame * this.anim.frameWidth;
    const sy  = this.anim.row * this.anim.frameHeight;

    ctx.save();
    if (flipX) {
      ctx.translate(x + this.anim.frameWidth, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, this.anim.frameWidth, this.anim.frameHeight,
        0, 0, this.anim.frameWidth, this.anim.frameHeight);
    } else {
      ctx.drawImage(img, sx, sy, this.anim.frameWidth, this.anim.frameHeight,
        x, y, this.anim.frameWidth, this.anim.frameHeight);
    }
    ctx.restore();
  }

  /** Draw a single static frame (no animation) */
  static drawFrame(
    ctx: CanvasRenderingContext2D,
    imageId: string,
    frameX: number, frameY: number,
    frameWidth: number, frameHeight: number,
    destX: number, destY: number,
    flipX = false,
  ): void {
    const img = AssetLoader.getImage(imageId);
    ctx.save();
    if (flipX) {
      ctx.translate(destX + frameWidth, destY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, frameX, frameY, frameWidth, frameHeight,
        0, 0, frameWidth, frameHeight);
    } else {
      ctx.drawImage(img, frameX, frameY, frameWidth, frameHeight,
        destX, destY, frameWidth, frameHeight);
    }
    ctx.restore();
  }
}
