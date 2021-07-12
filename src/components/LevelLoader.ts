
import TileMapModel from "breakspace/src/breakspace/loading/tilemap/TiledJson";
import { LoadTileMap } from "breakspace/src/breakspace/loading/tilemap/TileMapLoader";

export function LoadLevel(name: string, cb: (map: TileMapModel) => void): void {
    LoadTileMap(name, name + '.json')
        .then((map: TileMapModel) => {
            cb(map);
        })
        .catch((error: Error) => {
            throw(error);
        });
}