//使用google translate翻译时,为避免过多请求导致409错误,将文件按照2k进行分割
const fs = require('fs');
const path = require('path');

const inputFile = 'input.txt';
const outputDirectory = 'output';
const chunkSize = 2 * 1024; // 2KB

// 创建输出目录
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory);
}

// 读取文件并按照指定大小分割
fs.readFile(inputFile, (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  const totalChunks = Math.ceil(data.length / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    const chunkData = data.slice(start, end);

    const outputFileName = path.join(outputDirectory, `chunk_${i + 1}.txt`);

    fs.writeFile(outputFileName, chunkData, (err) => {
      if (err) {
        console.error(`Error writing file ${outputFileName}:`, err);
      } else {
        console.log(`Chunk ${i + 1} written successfully.`);
      }
    });
  }
});
