export function replaceChinesePunctuation(text) {
  var punctuationMap = {
    "，": ",",
    "。": ".",
    "！": "!",
    "？": "?",
    "“": "\"",
    "”": "\"",
    "‘": "'",
    "’": "'",
    "；": ";",
    "：": ":",
    "【": "[",
    "】": "]",
    "（": "(",
    "）": ")"
  };

  var regex = new RegExp(Object.keys(punctuationMap).join("|"), "g");
  return text.replace(regex, function(match) {
    return punctuationMap[match];
  });
}

// 示例用法
// var chineseText = "这是一段中文文本，包含中文标点符号。";
// var englishText = replaceChinesePunctuation(chineseText);
// console.log(englishText);