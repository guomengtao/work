// fetchFreeProxies.js
import fs from 'fs';
import fetch from 'node-fetch';
import yaml from 'js-yaml';

// 多个公开免费订阅源（你可以按需增加）
const SUBS_URLS = [
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Proxies/Proxy.yaml',
  'https://raw.githubusercontent.com/MetaCubeX/Free-Proxy/main/free.yaml',
];

async function fetchYAML(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url} Status: ${res.status}`);
  return await res.text();
}

function mergeProxies(yamlContents) {
  let allProxies = [];
  for (const y of yamlContents) {
    try {
      const doc = yaml.load(y);
      if (doc && doc.proxies) {
        // 只保留端口为纯数字的节点
        const filtered = doc.proxies.filter(p => /^\d+$/.test(String(p.port)));
        allProxies = allProxies.concat(filtered);
      }
    } catch (e) {
      console.warn('⚠️ YAML parse error, skip this source', e);
    }
  }
  return allProxies;
}

async function main() {
  try {
    const yamls = [];
    for (const url of SUBS_URLS) {
      console.log(`Fetching ${url}`);
      const y = await fetchYAML(url);
      yamls.push(y);
    }

    const proxies = mergeProxies(yamls);
    if (proxies.length === 0) {
      throw new Error('No valid proxies found!');
    }

    const finalYAML = yaml.dump({ proxies });
    fs.mkdirSync('clashx', { recursive: true });
    fs.writeFileSync('clashx/config.yaml', finalYAML, 'utf8');
    console.log(`✅ config.yaml updated, ${proxies.length} proxies`);
  } catch (err) {
    console.error('❌ 生成失败:', err);
    process.exit(1);
  }
}

main();
