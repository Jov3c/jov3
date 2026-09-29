const CJK_CHARACTER = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;
const LATIN_WORD = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;

export function countMarkdownWords(markdown: string) {
  const visibleText = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[>#*_`~|-]/g, ' ');

  const cjkCount = visibleText.match(CJK_CHARACTER)?.length ?? 0;
  const latinCount = visibleText.replace(CJK_CHARACTER, ' ').match(LATIN_WORD)?.length ?? 0;
  return cjkCount + latinCount;
}
