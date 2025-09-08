import fs from 'fs';
import fetch from 'node-fetch';
import yaml from 'js-yaml';

const SUBS_URLS = [
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Proxies/Free.yaml',
  'https://raw.githubusercontent.com/MetaCubeX/ClashNode/main/free.yaml'
  // 可以根据需要增加更多公开订阅 URL
];

const OUTPUT_PATH = 'clashx/config.yaml';

async function fetchYAML(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url} Status: ${res.status}`);
  return await res.text();
}

function mergeProxies(listOfYAMLs) {
  let allProxies = [];
  for (const y of listOfYAMLs) {
    const doc = yaml.load(y);
    if (doc && doc.proxies) {
      allProxies = allProxies.concat(doc.proxies);
    }
  }
  return allProxies;
}

function generateConfig(proxies) {
  return yaml.dump({
    proxies,
    'proxy-groups': [
      {
        name: 'Auto',
        type: 'select',
        proxies: proxies.map(p => p.name)
      }
    ],
    rules: ['MATCH,Auto']
  });
}

async function main() {
  try {
    const yamlContents = [];
    for (const url of SUBS_URLS) {
      console.log('Fetching', url);
      const content = await fetchYAML(url);
      yamlContents.push(content);
    }

    const allProxies = mergeProxies(yamlContents);
    if (allProxies.length === 0) throw new Error('No proxies found');

    const finalYAML = generateConfig(allProxies);

    fs.mkdirSync('clashx', { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, finalYAML, 'utf8');
    console.log('✅ config.yaml 已生成，节点数量:', allProxies.length);
  } catch (err) {
    console.error('❌ 生成失败:', err);
    process.exit(1);
  }
}

main();
