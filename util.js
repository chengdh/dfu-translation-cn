const chinesePunctuation = /[，。；！？【】（）“”‘’]/g;
const englishPunctuation = [',', '.', ';', '!', '?', '[', ']', '(', ')', '"', '"', "'", "'"];

export function replaceChinesePunctuation(text) {
  return text.replace(chinesePunctuation, (match) => {
    return englishPunctuation[chinesePunctuation.source.indexOf(match)];
  });
}

// 使用示例
// const originalText = '这是一段包含中文标点符号的文本，需要替换为英文标点符号。';
// const replacedText = replaceChinesePunctuation(originalText);

// console.log(replacedText);