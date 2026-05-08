const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EXT_DIR = './';          // 脚本放在扩展根目录运行
const OUTPUT = 'manifest.json';
const VERSION = '0.90.1';      // 版本号，每次更新请修改
const UPDATE_NOTE = '五条悟加强'; // 更新说明

// 递归获取所有文件相对路径
function walkDir(dir, baseDir, fileList = []) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name === OUTPUT ) continue;
		const fullPath = path.join(dir, entry.name);
		const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
		if (entry.isDirectory()) {
			walkDir(fullPath, baseDir, fileList);
		} else {
			fileList.push(relativePath);
		}
	}
	return fileList;
}

const baseDir = path.resolve(EXT_DIR);
const fileList = walkDir(baseDir, baseDir);

const files = {};
for (const relPath of fileList) {
	const buf = fs.readFileSync(path.join(baseDir, relPath));
	const hash = crypto.createHash('sha1').update(buf).digest('hex');
	files[relPath] = hash;
}

const manifest = {
	version: VERSION,
	update: UPDATE_NOTE,
	files: files
};

fs.writeFileSync(path.join(baseDir, OUTPUT), JSON.stringify(manifest, null, 2));
console.log(`✅ manifest.json 生成完毕，包含 ${fileList.length} 个文件。`);
