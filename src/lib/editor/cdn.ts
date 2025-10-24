import { isCN } from "@/lib/env";

const version = "0.52.2";
// 使用jsdelivr CDN，它通常有更好的CORS支持
const cndHost = "cdn.jsdelivr.net";
export const vsURL = `https://${cndHost}/npm/monaco-editor@${version}/min/vs`;
export const loaderURL = `${vsURL}/loader.js`;
