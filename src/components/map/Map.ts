import {ISearchGraph, SearchNode} from "@lib/algorithms/PathSearch";
import GameComponent from "@breakspace/GameComponent";
import {Vec2Like, Vec2} from "@lib/math/Geometry";
import {Direction} from "@lib/utils/Types";
import {PathTileType} from "../../Constants";
import TileMapModel, { Tile as ITile, Layer as ILayer } from "@breakspace/loading/tilemap/TiledJson";
import { Texture } from "pixi.js";

// tslint:disable: variable-name
export let TileWidth: number;
export let TileHeight: number;
export let LevelWidth: number;
export let LevelHeight: number;
export let PlayerHomeLocation: Vec2Like;
export let VikingHomeLocation: Vec2Like;
export let VikingWayPoints: Vec2Like[] = [];

export function TileToPixel(tileXY: Vec2Like): Vec2Like {
    return {x: tileXY.x * TileWidth, y: tileXY.y * TileWidth};
}

export default class Map extends GameComponent implements ISearchGraph<Tile> {

    private _data: Tile[][] = [];
    get data(): Tile[][] {
        return this._data;
    }

    private randomPositions: Vec2Like[] = [];
    private blockedTile = new Tile(new Vec2(), "-1", null);
    private model: TileMapModel;

    SetMapModel(model: TileMapModel) {

        this.model = model;

        model.layers.forEach(layer => {

            if(layer.name === "collision") {
                TileWidth = model.tilewidth;
                TileHeight = model.tileheight;
                LevelWidth = layer.width;
                LevelHeight = layer.height;

                this.IterateTiles(layer, (x, y, tile) => {
                    if(!this._data[y]) {
                        this._data[y] = [];
                    }
                    this._data[y][x] = Tile.FromITile(x, y, tile);
                });
            } else if (layer.name === "data") {
                this.IterateTiles(layer, (x, y, tile) => {
                    switch(tile.type) {
                        case "Player_Home":
                            PlayerHomeLocation = {x, y};
                            break;
                        case "Viking_Home":
                            VikingHomeLocation = {x, y};
                            break;
                        case "WayPoint":
                            VikingWayPoints.push({x, y});
                            break;
                    }
                });
            }
        });

        this.CreateRandomPositions();
    }

    GetTile(position: Vec2Like, direction: Direction): Tile {

        let {x, y} = position;
        switch(direction) {
            case "left":
                if(x === 0) {
                    return this.blockedTile;
                }
                x -= 1;
                break;
            case "right":
                if(x === this.model.width - 1) {
                    return this.blockedTile;
                }
                x += 1;
                break;
            case "up":
                if(y === 0) {
                    return this.blockedTile;
                }
                y -= 1;
                break;
            case "down":
                if(y === this.model.height - 1) {
                    return this.blockedTile;
                }
                y += 1;
                break;
            }

        return this.data[y][x];
    }

    SetTile(x: number, y: number, type: string): void {
        this.data[y][x].type = type;
    }

    GetRandomPosition(): Vec2Like {
        return this.randomPositions[(Math.random() * this.randomPositions.length) | 0];
    }

    GetAdjacent(node: Tile): Tile[] {
        return ["up", "down", "left", "right"].map(direction => this.GetTile(node.position, direction as Direction));
    }

    private CreateRandomPositions(): void {
        for (let x = 3, w = this.model.width - 3; x < w; x ++) {
           for (let y = 3, h = this.model.height - 3; y < h; y++) {
                if(this.data[y][x].type === PathTileType.toString()) {
                    this.randomPositions.push({x, y});
                }
           }
        }
    }

    private IterateTiles(layer: ILayer, func: (x: number, y: number, tile: ITile) => void): void {
        for (let i = 0, len = layer.tiles.length; i < len; i ++) {
            const x = i % LevelWidth;
            const y = Math.floor(i / LevelWidth);
            const tile = layer.tiles[i];
            func(x, y, tile);
        }
    }
}

class Tile extends SearchNode implements ITile {

    constructor(position: Vec2Like, public type: string, public texture: Texture, public gid: number = -1) {
        super();
        this.position = {x: position.x, y: position.y};
    }

    CheckValid(): boolean {
        return this.type === PathTileType.toString();
    };

    static FromITile(x: number, y: number, tile: ITile): Tile {
        return new Tile({x, y}, tile.gid.toString(), tile.texture);
    }
}