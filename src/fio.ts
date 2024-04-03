import fs from 'fs-extra';
import util from 'util';
import buf from 'buffer';
import RW from "rw-resource";
const RWRes = RW.default;
const Buffer = buf.Buffer;
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const mkDirAsync = util.promisify(fs.mkdir);

let GlobalLock = new RWRes({});

type UnlockFunction = () => void;

type RWLock = {
     lock: (writable: boolean) => Promise<UnlockFunction>;
}

const Locks: {[id:string]: RWLock} = {};

function getRWLock(resourceID: string): RWLock {
    let uid = Buffer.from(resourceID).toString('base64');
    if (!Locks[uid]) {
        Locks[uid] = new RWRes({});
    }
    return Locks[uid];
}
/*
  The lock() function of this class returns a promise that will resolve when a
  global read lock can be obtained and a read or write lock specific to the
  resource identifier can be obtained.
*/
class ResourceLock {
    unlockResource: UnlockFunction = () => {};
    unlockGlobal: UnlockFunction = () => {};
    constructor() {}
    lock(resourceID: string, write: boolean) {
        let lock: ResourceLock | null = this;
        return GlobalLock.lock(false)
            .then((cb: () => void) => {
            this.unlockGlobal = cb;
            return getRWLock(resourceID).lock(write);
        })
            .then((cb: UnlockFunction) => {
            this.unlockResource = cb;
            return (() => {
                if (lock) {
                    /* Only the first caller gets to act on the lock */
                    let l = lock;
                    lock = null;
                    l.unlockResource();
                    l.unlockGlobal();
                }
            });
        });
    }
}
function readProtectedFile(path: string, encodingStr: string | null): any  {
    let unlock: UnlockFunction;
    return new ResourceLock().lock(path, false)
        .then((cb: UnlockFunction) => {
        unlock = cb;
        if (encodingStr) {
            return readFileAsync(path, { encoding: encodingStr });
        }
        else {
            return readFileAsync(path);
        }
    })
        .then((data: any) => {
        unlock();
        return data;
    })
        .catch((err:any) => {
        unlock();
        throw err;
    });
}

function writeProtectedFile(path: string, data:any, encodingStr: string | null) {
    let unlock: UnlockFunction;
    return new ResourceLock().lock(path, true)
        .then((cb: UnlockFunction) => {
        unlock = cb;
        if (encodingStr) {
            return writeFileAsync(path, data, { encoding: encodingStr });
        }
        else {
            return writeFileAsync(path, data);
        }
    })
        .then(() => {
        unlock();
        return;
    })
        .catch((err: any) => {
        unlock();
        throw err;
    });
}

function guaranteePath(path: string): Promise<null> {
    let dirpath = path.substring(0, path.lastIndexOf("/"));
    return new Promise((resolve, reject) => {
        mkDirAsync(dirpath)
            .catch((err: any) => {
            if (err) {
                switch (err.code) {
                    case 'ENOENT':
                        return guaranteePath(dirpath)
                            .then(() => {
                            return guaranteePath(path);
                        })
                            .catch((err) => {
                            throw err;
                        });
                    case 'EEXIST':
                        resolve(null);
                        return;
                    default:
                        console.log("failed to create '" + dirpath + "' because '" + err + "'");
                        reject();
                        return;
                }
            }
        })
            .then(() => {
            resolve(null);
            return;
        });
    });
}

export default {
    readProtectedFile,
    writeProtectedFile,
    guaranteePath
}
//# sourceMappingURL=fio.js.map