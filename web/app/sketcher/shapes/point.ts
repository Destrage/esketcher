import { SketchObject, SketchObjectSerializationData } from "./sketch-object";
import { DrawPoint } from "./draw-utils";
import Vector from "math/vector";
import { Param } from "./param";
import { ConstraintDefinitions } from "../constr/ANConstraints";
import { dfs } from "gems/traverse";
import { SketchSegmentSerializationData } from "./segment";

let edgeCounter = 1;
let coincidentCounter = 1;

export class EndPoint extends SketchObject {
  params: {
    isCorner: boolean;
    x: Param;
    y: Param;
  };

  id: any;

  constructor(x, y, id?) {
    super(id);
    this.id = id;
    this.params = {
      isCorner: false,
      x: new Param(x, "X"),
      y: new Param(y, "Y"),
    };
  }

  get x() {
    return this.params.x.get();
  }

  set x(val) {
    this.params.x.set(val);
  }

  get y() {
    return this.params.y.get();
  }

  set y(val) {
    this.params.y.set(val);
  }

  visitParams(callback) {
    callback(this.params.x);
    callback(this.params.y);
  }

  normalDistance(aim) {
    return aim.minus(new Vector(this.x, this.y)).length();
  }

  getReferencePoint() {
    return this;
  }

  translateImpl(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  visitLinked(cb) {
    dfs(
      this,
      (obj, chCb) =>
        obj.constraints.forEach((c) => {
          if (c.schema.id === ConstraintDefinitions.PCoincident.id) {
            c.objects.forEach(chCb);
          }
        }),
      cb
    );
  }

  drawImpl(ctx, scale) {
    let color = "#FDB825";
    let isCoincident = false;
    let id = parseInt(this.id);
    this.visitLinked((linkedPoint) => {
      if (linkedPoint !== this) {
        isCoincident = true;
      }
    });
    let label = "";
    if (isCoincident) {
      label = `C${id}`;
    } else {
      label = `E${id}`;
    }
    ctx.fillStyle = color;
    DrawPoint(ctx, this.x, this.y, 3, scale);

    // Draw and fill an arc around the point
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5 * scale, 0, 2 * Math.PI); // Adjust the radius as needed
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();

    // Draw the label near the point
    ctx.fillStyle = "black";
    ctx.font = `${12 * scale}px Arial`;
    ctx.fillText(label, this.x + 5 * scale, this.y - 5 * scale);
  }

  setXY(x, y) {
    this.x = x;
    this.y = y;
  }

  setFromPoint(p) {
    this.setXY(p.x, p.y);
  }

  setFromArray(arr) {
    this.setXY(arr[0], arr[1]);
  }

  toVectorArray() {
    return [this.x, this.y];
  }

  toVector() {
    return new Vector(this.x, this.y);
  }

  get labelCenter() {
    return this.toVector();
  }

  copy() {
    return new EndPoint(this.x, this.y);
  }

  mirror(dest, mirroringFunc) {
    const { x, y } = mirroringFunc(this.x, this.y);
    dest.x = x;
    dest.y = y;
  }

  write(): SketchPointSerializationData {
    return {
      x: this.x,
      y: this.y,
    };
  }

  static read(id: string, data: SketchPointSerializationData): EndPoint {
    return new EndPoint(data.x, data.y, id);
  }
}

export interface SketchPointSerializationData extends SketchObjectSerializationData {
  x: number;
  y: number;
}

EndPoint.prototype._class = "TCAD.TWO.EndPoint";
EndPoint.prototype.TYPE = "Point";
