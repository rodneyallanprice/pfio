# PFIO #

PFIO provides functions to read and write entire files in a synchronized way. Many readers can concurrently read a file until a write is requested. The write will block until all existing readers exit and all new readers block until the file write can be completed.

## Installation

```bash
npm i pfio
```

## Usage

```javascript
    import pfio from 'pfio';

    const queue = [];

    queue.push(pfio.readProtectedFile(Path));
    queue.push(pfio.writeProtectFile(Path, newContent));
    queue.push(pfio.readProtectedFile(Path));
    const results = Promise.all(queue);
```

result[0] will have the content before the write.
result[1] will have the new content.

## APIs

### readProtectedFile

Reads the entire file as soon as no writes are occurring.

#### Syntax

```
readProtectedFile(path: string)
readProtectedFile(path: string, encoding: string)

```

#### Parameters

    path (string) (required)
        The path (relative or absolute) to the file

    encoding (any)
        The expected encoding. 

#### Return value

    Promise<string | buffer>

### writeProtectedFile

Replaces file when exclusive access can be obtained.

#### Syntax

```
writeProtectedFile(path: string, content:  any)
writeProtectedFile(path: string, content:  any, encoding: string)

```

#### Parameters

    path (string) (required)
        The path (relative or absolute) to the file

    content (any) (required)
        The data to be written

    encoding (any)
        The encoding of content. 

#### Return value

    Promise<string | buffer>


## Tests

```
npm tests
```

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Acknowledgments
This npm is a thin application of reader/writter locks (written by [Micah Gorrell](https://github.com/minego)) on whole files.

