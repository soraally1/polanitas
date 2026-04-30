const fs = require('fs');
const path = require('path');

const dir = 'src/app/(dashboard)/dashboard/learn';

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file === 'page.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('function AILab() {')) {
        let modified = false;

        // Add Typewriter component if it doesn't exist
        if (!content.includes('function Typewriter(')) {
          const typewriterCode = `\nfunction Typewriter({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0; setDisplayed("");
    const t = setInterval(() => {
      setDisplayed(text.slice(0, i + 1)); i++;
      if (i >= text.length) clearInterval(t);
    }, 15);
    return () => clearInterval(t);
  }, [text]);
  return <>{displayed}</>;
}\n\n`;
          content = content.replace('function AILab() {', typewriterCode + 'function AILab() {');
          modified = true;
        }

        // Replace rendering logic
        const targetStr = '{msg.content.replace(/\\*\\*(.*?)\\*\\*/g,"$1")}';
        const replaceStr = '{msg.role === "ai" ? <Typewriter text={msg.content.replace(/\\*\\*(.*?)\\*\\*/g,"$1")} /> : msg.content.replace(/\\*\\*(.*?)\\*\\*/g,"$1")}';
        
        if (content.includes(targetStr) && !content.includes('<Typewriter text=')) {
          content = content.replace(targetStr, replaceStr);
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log('Updated: ' + fullPath);
        }
      }
    }
  }
}

processDirectory(dir);
console.log('Done.');
