import fs from 'fs';
import fetch from 'node-fetch';
import yaml from 'js-yaml';

const SUBS_URLS = [
  'https://raw.githubusercontent.com/mfuu/v2ray/master/clash.yaml',
  'https://raw.githubusercontent.com/anaer/Sub/main/clash.yaml',
  'https://raw.githubusercontent.com/ermaozi/get_subscribe/main/subscribe/clash.yml',
  'https://cdn.jsdelivr.net/gh/vxiaov/free_proxies@main/clash/clash.provider.yaml',
  'https://freenode.openrunner.net/uploads/20240617-clash.yaml',
  'https://tt.vg/freeclash'
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
      try {
        const content = await fetchYAML(url);
        yamlContents.push(content);
      } catch (err) {
        console.error(`Failed to fetch ${url}:`, err.message);
      }
    }

    if (yamlContents.length === 0) throw new Error('No valid YAML content fetched');

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
