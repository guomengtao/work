// fetchFreeProxies.js
import fs from 'fs';
import fetch from 'node-fetch';
import yaml from 'js-yaml';

// 免费 Clash 节点订阅 URL（示例）
const PROXY_LIST_URLS = [
  'https://raw.githubusercontent.com/anaer/Sub/main/clash.yaml',
  'https://raw.githubusercontent.com/ermaozi/get_subscribe/main/subscribe/clash.yml'
];

// 主函数
async function fetchProxies() {
  const proxies = [];

  for (const url of PROXY_LIST_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`⚠️ 无法访问 ${url}`);
        continue;
      }
      const yamlText = await res.text();
      const data = yaml.load(yamlText);

      // 判断是否有 proxies 字段
      if (data?.proxies && Array.isArray(data.proxies)) {
        proxies.push(...data.proxies);
      }
    } catch (err) {
      console.error(`❌ 获取 ${url} 出错:`, err);
    }
  }

  if (proxies.length === 0) {
    console.error('❌ 没有获取到可用节点');
    process.exit(1);
  }

  // 生成 ClashX YAML 配置
  const yamlContent = generateClashConfig(proxies);
  fs.mkdirSync('clashx', { recursive: true });
  fs.writeFileSync('clashx/config.yaml', yamlContent, 'utf8');
  console.log('✅ clashx/config.yaml 已生成');
}

// 生成 ClashX YAML 内容，只保留必要字段
function generateClashConfig(proxies) {
  const filtered = proxies.map(p => ({
    name: p.name,
    type: p.type,
    server: p.server,
    port: p.port
  }));

  return yaml.dump({ proxies: filtered }, { lineWidth: -1 });
}

// 执行
fetchProxies().catch(err => {
  console.error('❌ 更新失败:', err);
  process.exit(1);
});
