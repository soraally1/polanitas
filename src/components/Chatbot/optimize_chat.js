const fs = require('fs');
const path = require('path');

const dir = 'src/app/(dashboard)/dashboard/learn';

const oldTypewriterRegex = /function Typewriter\(\{\s*text\s*\}\s*:\s*\{\s*text\s*:\s*string\s*\}\)\s*\{[\s\S]*?return\s*<>\s*\{\s*displayed\s*\}\s*<\/>;\s*\}/;

const newTypewriter = `function Typewriter({ text }: { text: string }) {
  const spanRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!spanRef.current) return;
    let i = 0;
    const el = spanRef.current;
    el.textContent = "";
    const t = setInterval(() => {
      i += 3;
      el.textContent = text.slice(0, i);
      if (i >= text.length) {
        el.textContent = text;
        clearInterval(t);
      }
    }, 25);
    return () => clearInterval(t);
  }, [text]);
  return <span ref={spanRef}></span>;
}`;

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file === 'page.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (oldTypewriterRegex.test(content)) {
        content = content.replace(oldTypewriterRegex, newTypewriter);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Optimized: ' + fullPath);
      }
    }
  }
}

processDirectory(dir);
console.log('Done optimization.');
