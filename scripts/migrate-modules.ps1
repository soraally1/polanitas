$modules = @("ab-testing","ai-ethics","ai-orchestration","content-atomization","crisis-management","eye-tracking","influencer-dna","llm-copywriting","marketplace-whitespace","roi-attribution","trend-signal")

foreach ($mod in $modules) {
  $file = "src\app\(dashboard)\dashboard\learn\$mod\page.tsx"
  if (-not (Test-Path $file)) { Write-Host "NOT FOUND $mod"; continue }
  
  $content = Get-Content $file -Raw

  if ($content -match "useModuleProgress") {
    Write-Host "SKIP $mod (already migrated)"
    continue
  }

  # 1. Add imports
  $content = $content -replace '(import \{ AILab \} from "@/components/Chatbot";)', ('$1' + "`nimport { useAuth } from `"@/components/auth/AuthProvider`";`nimport { useModuleProgress } from `"@/hooks/use-module-progress`";")

  # 2. Add Trophy to lucide imports (after Clock, or Zap,)
  $content = $content -replace '(  Clock,\r?\n\} from "lucide-react")', ('  Clock,' + "`n  Trophy,`n} from `"lucide-react`"")
  $content = $content -replace '(  Zap,\r?\n\} from "lucide-react")', ('  Zap,' + "`n  Trophy,`n} from `"lucide-react`"")

  # 3. Fix useState import
  $content = $content -replace 'import \{ useState \}', 'import { useState, useEffect }'
  $content = $content -replace 'import \{ useState, useRef, useEffect \}', 'import { useState, useEffect }'
  $content = $content -replace 'import \{ useState, useRef \}', 'import { useState, useEffect }'

  # 4. Add hook calls after the page function opens
  # Find line: const [currentLesson, setCurrentLesson] = useState(0);
  # Insert hook declarations before it
  $hookLines = "  const { user }   = useAuth();`n  const { completedLessons, quizAnswers, isModuleComplete, isLoading, saveAnswer } =`n    useModuleProgress(`"$mod`", user?.uid, LESSONS.length);`n`n"
  $content = $content -replace '(  const \[currentLesson, setCurrentLesson\] = useState\(0\);)', ($hookLines + '$1')

  # 5. Remove the old 'completed' state line
  $content = $content -replace '  const \[completed, setCompleted\] = useState<Set<number>>\(new Set\(\)\);\r?\n', ''

  # 6. Replace handleQuizAnswer body
  $content = $content -replace '  function handleQuizAnswer\(i: number\) \{[^}]+\}', '  async function handleQuizAnswer(i: number) {
    if (quizAnswer) return;
    const correct = i === lesson.quiz.correct;
    setQuizAnswer({ questionIndex: currentLesson, selected: i, correct });
    await saveAnswer(currentLesson, i, correct);
  }'

  # 7. Fix references
  $content = $content -replace '\bcompleted\.size\b', 'completedLessons.size'
  $content = $content -replace '\bcompleted\.has\(', 'completedLessons.has('

  # 8. Remove setQuizAnswer(null) from goToLesson (will be restored by useEffect)
  $content = $content -replace '    setQuizAnswer\(null\);\r?\n', ''

  # 9. Add useEffect to restore quiz state - insert before 'const lesson = LESSONS'
  $restoreEffect = "  // Restore quiz answer for current lesson from Firestore`n  useEffect(() => {`n    const saved = quizAnswers[currentLesson];`n    if (saved) {`n      setQuizAnswer({ questionIndex: currentLesson, selected: saved.selected, correct: saved.correct });`n    } else {`n      setQuizAnswer(null);`n    }`n  }, [currentLesson, quizAnswers]);`n`n"
  $content = $content -replace '(  const lesson = LESSONS\[currentLesson\];)', ($restoreEffect + '$1')

  Set-Content $file $content -NoNewline -Encoding UTF8
  Write-Host "OK  $mod"
}
