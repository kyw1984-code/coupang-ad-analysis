const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// NativeWind v4 CSS 설정
config.resolver.sourceExts.push('css');

// xlsx 파일을 번들 에셋으로 인식 (샘플 리포트 체험 기능)
config.resolver.assetExts.push('xlsx');

module.exports = config;
