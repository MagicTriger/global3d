// 简易 krpano 加载与嵌入封装
// 需要将 krpano 脚本放置于 public/krpano/krpano.js 或自行修改路径

declare global {
  interface Window {
    embedpano?: (opts: { target: string; xml?: string; html5?: 'prefer' | 'always' }) => void;
  }
}

export async function loadKrpano(src = '/krpano/krpano.js'): Promise<void> {
  if (window.embedpano) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('krpano 脚本加载失败'));
    document.head.appendChild(s);
  });
}

export async function embedKrpano({ target, xml }: { target: string; xml?: string }) {
  if (!window.embedpano) throw new Error('embedpano 未定义');
  window.embedpano!({ target, xml, html5: 'prefer' });
}