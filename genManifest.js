const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EXT_DIR = './';          // 脚本放在扩展根目录运行
const OUTPUT = 'manifest.json';
const VERSION = '0.97';      // 版本号，每次更新请修改
const UPDATE_NOTE = '0.97新增丹恒、马知康'; // 更新说明

// 递归获取所有文件相对路径
function walkDir(dir, baseDir, fileList = []) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name === OUTPUT) continue;
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
	const filePath = path.join(baseDir, relPath);
	let buf = fs.readFileSync(filePath);

	// 对 .css 和 .js 文件，将行尾格式统一为 LF，并写回磁盘
	if (/\.(css|js)$/i.test(relPath)) {
		let content = buf.toString('utf-8');
		// 将 CRLF 或 CR 替换为 LF
		const normalized = content.replace(/\r\n|\r/g, '\n');
		// 如果内容发生变化，则覆盖写入本地文件
		if (normalized !== content) {
			fs.writeFileSync(filePath, normalized, 'utf-8');
			console.log(`↻ 行尾已转换为 LF: ${relPath}`);
			// 用规范化后的内容重新创建 Buffer 用于哈希计算
			buf = Buffer.from(normalized, 'utf-8');
		} else {
			// 内容未变，但为了统一也直接使用 normalized 对应的 Buffer
			buf = Buffer.from(normalized, 'utf-8');
		}
	}

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
