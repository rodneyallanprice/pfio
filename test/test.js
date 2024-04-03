import fs, {promises}  from 'fs';
const readFile = promises.readFile;
import path from 'path';
import { describe, it, before } from "node:test";
import  assert from "node:assert";
import pfio from '../build/fio.js';
let prefix = "";

if(process.cwd().endsWith('pfio')) {
	prefix = "test/"
}

const createDirectory = (dirPath) => {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath);
	}
}

const copyFile = (source, dest) => {
	return new Promise((resolve, reject) => {
		fs.copyFile(source, dest, (err) => {
			if (err) reject(err);
			resolve();
		});
	})
}

describe("write a file and then read it", () => {

	it("should return the same contents", async () => {
		try {
			const filePath = prefix + "../tmp/test.txt";
			const contentToWrite = "File Contents.";
			await pfio.writeProtectedFile(filePath, contentToWrite);
			const contentRead = await pfio.readProtectedFile(filePath);
			assert.equal(contentToWrite, contentRead);
		} catch (err) {
			console.log('Test failed trying to write a file.');
		}
	});
});

describe("Start multiple readers before attempting to write", () => {
	const SOURCE_ORIGINAL_PATH = prefix + 'USCities.json';
	const SOURCE_UPDATED_PATH = prefix + 'UpdatedCities.json';
	const TEST_FILE_PATH = prefix + '../tmp/USCities.json';
	const TEST_DIR = prefix + '../tmp';
	let originalContent;
	let updatedContent;

	before(async () => {
		originalContent = await readFile(SOURCE_ORIGINAL_PATH);
		updatedContent = await readFile(SOURCE_UPDATED_PATH);
		createDirectory(TEST_DIR);
		await copyFile(SOURCE_ORIGINAL_PATH, TEST_FILE_PATH);
	});
	it("should block new readers until all existing readers are out, write the file, and then allow the blocked readers in", async () => {
		const fileUsers = [];

		for (let idx = 0; idx < 10; idx++) {
			fileUsers.push(pfio.readProtectedFile(TEST_FILE_PATH));
		}
		fileUsers.push(pfio.writeProtectedFile(TEST_FILE_PATH, updatedContent));
		fileUsers.push(pfio.readProtectedFile(TEST_FILE_PATH));
		fileUsers.push(pfio.readProtectedFile(TEST_FILE_PATH));
		const results = await Promise.all(fileUsers);
		for (let idx = 0; idx < 1; idx++) {
			assert(results[idx].equals(originalContent));
		}
		assert(results[11].equals(updatedContent));
		assert(results[12].equals(updatedContent));
	});
});

