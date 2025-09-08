// fetchFreeProxiesAuto.js
import fs from 'fs';
import fetch from 'node-fetch';
import yaml from 'js-yaml';

const GITHUB_API = 'https://api.github.com/search/code?q=clash+yaml+filename:clash.yaml+path:Proxies+in:path&per_page=50';

// 过滤端口为纯数字的节点
function filterProxies(proxies) {
  return proxies.filter(p => /^\d+$/.test(String(p.port)));
}

async function fetchYAML(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url} Status: ${res.status}`);
  return await res.text();
}

async function fetchGitHubYAMLLinks() {
  const res = await fetch(GITHUB_API);
  if (!res.ok) throw new Error('GitHub API fetch failed');
  const data = await res.json();
  // GitHub API 返回 items，每个 item 有 html_url 或 raw_url 可直接抓取
  const urls = data.items
    .map(item => item.html_url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/'));
  return urls;
}

async function main() {
  console.log('🔍 获取 GitHub 免费 Clash/YAML 链接...');
  let urls = [];
  try {
    urls = await fetchGitHubYAMLLinks();
  } catch (err) {
    console.error('❌ 获取 YAML 链接失败:', err.message);
  }

  if (urls.length === 0) {
    console.error('❌ 没有获取到订阅链接');
    process.exit(1);
  }

  const allProxies = [];
  for (const url of urls) {
    try {
      console.log(`Fetching ${url} ...`);
      const text = await fetchYAML(url);
      const data = yaml.load(text);
      if (!data || !data.proxies) continue;
      const validProxies = filterProxies(data.proxies);
      allProxies.push(...validProxies);
    } catch (err) {
      console.warn(`⚠️ ${url} 抓取失败:`, err.message);
    }
  }

  if (allProxies.length === 0) {
    console.error('❌ 没有可用节点');
    process.exit(1);
  }

  const output = yaml.dump({ proxies: allProxies }, { lineWidth: -1 });
  fs.mkdirSync('clashx', { recursive: true });
  fs.writeFileSync('clashx/config.yaml', output, 'utf8');
  console.log('✅ clashx/config.yaml 已生成，节点数量:', allProxies.length);
}

main().catch(err => {
  console.error('❌ 脚本执行失败:', err);
  process.exit(1);
});
