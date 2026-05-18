---
type: input
---

# Brand Guidelines

## Brand Identity

ToDoアプリは、おしゃれな若者向けのタスク管理ツールです。単なる機能的なTo-Do リストではなく、毎日のタスク管理を通じてライフスタイルを彩るデジタル体験を提供します。

**Core Brand Promise**: おしゃれにToDo管理したい若者のために、かわいいデザインと直感的な操作性を兼ね備えたタスク管理アプリ

**Brand Personality**: 
- 親しみやすく、親近感のある存在
- トレンド感度が高く、今どきのデザインを反映
- 楽しさと実用性のバランスが取れている
- ユーザーの個性表現をサポートする姿勢

**Key Values**:
- かわいさ（Cuteness）：全ての要素にかわいらしさを組み込む
- シンプル性（Simplicity）：わかりやすく、使いやすい設計
- 親密性（Intimacy）：ユーザーの日常に寄り添う存在

## Color Palette

### Core Colors

| Color Name | Hex Code | Usage | RGB |
|---|---|---|---|
| Sweet Pink | #FF6B9D | Primary actions, CTAs, emphasis elements | rgb(255, 107, 157) |
| Lavender Purple | #D8A5E8 | Secondary actions, complementary highlights | rgb(216, 165, 232) |
| Mint Green | #A8E6CF | Success states, positive feedback, completed tasks | rgb(168, 230, 207) |

### Neutral Colors

| Color Name | Hex Code | Usage | RGB |
|---|---|---|---|
| Off White | #FAFAFA | Primary background | rgb(250, 250, 250) |
| Light Gray | #F0F0F0 | Secondary background, card surfaces | rgb(240, 240, 240) |
| Medium Gray | #9B9B9B | Secondary text, disabled states | rgb(155, 155, 155) |
| Dark Charcoal | #2D2D2D | Primary text, headings | rgb(45, 45, 45) |
| Black | #000000 | Maximum contrast, critical information | rgb(0, 0, 0) |

### Accent Colors

| Color Name | Hex Code | Usage | RGB |
|---|---|---|---|
| Coral Orange | #FF8C6F | Warning states, pending items | rgb(255, 140, 111) |
| Sky Blue | #87CEEB | Information, neutral secondary actions | rgb(135, 206, 235) |
| Soft Peach | #FFDCC7 | Hover states, subtle highlights | rgb(255, 220, 199) |

## Typography

### Font Selection

**Primary Font - Heading & Display Text**:
- Font Family: `'Poppins', sans-serif`
- License: Open source (Google Fonts)
- Characteristics: Modern, rounded, friendly, contemporary appeal
- Best for: Page titles, section headings, primary CTAs

**Secondary Font - Body & UI Text**:
- Font Family: `'Inter', sans-serif`
- License: Open source (Rsesala Foundation)
- Characteristics: Clean, geometric, excellent readability, professional neutrality
- Best for: Body text, task descriptions, labels, form inputs

**Accent Font - Special Emphasis**:
- Font Family: `'Quicksand', sans-serif`
- License: Open source (Google Fonts)
- Characteristics: Rounded, playful, adds personality to key moments
- Best for: Achievement messages, celebratory elements, microinteractions

### CSS Implementation

```css
/* Heading Styles */
h1 {
  font-family: 'Poppins', sans-serif;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  color: #2D2D2D;
  letter-spacing: -0.5px;
}

h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  color: #2D2D2D;
  letter-spacing: -0.3px;
}

h3 {
  font-family: 'Poppins', sans-serif;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: #2D2D2D;
}

/* Body Text Styles */
body {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  color: #2D2D2D;
  letter-spacing: 0px;
}

p {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  color: #2D2D2D;
}

/* Label & Small Text */
label, .label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #9B9B9B;
  text-transform: capitalize;
  letter-spacing: 0.3px;
}

/* Button Text */
button, .btn {
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.2px;
}

/* Accent/Celebration Text */
.accent-text, .achievement {
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  color: #FF6B9D;
}

/* Task Item Text */
.task-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #2D2D2D;
  line-height: 1.5;
}

.task-description {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #9B9B9B;
  line-height: 1.5;
}

/* Input Fields */
input, textarea {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #2D2D2D;
  line-height: 1.6;
}

input::placeholder, textarea::placeholder {
  color: #9B9B9B;
  font-weight: 400;
}
```

## Voice & Tone

### Brand Voice Traits

**Friendly & Approachable**: 
- Conversational tone without being too casual
- Uses inclusive language that makes users feel welcomed
- Avoids technical jargon that might intimidate

**Encouraging & Positive**:
- Celebrates user progress and achievements
- Uses motivational language when appropriate
- Frames challenges as opportunities

**Contemporary & Relatable**:
- Reflects current youth culture and language patterns
- References relevant trends without being outdated
- Connects with the lifestyle aspirations of the target audience

**Playful & Fun**:
- Incorporates light humor in copywriting
- Uses emojis strategically to enhance personality
- Creates delightful microinteractions through language

**Clear & Direct**:
- Gets to the point quickly
- Uses simple, concise language
- Avoids unnecessary verbosity

### Tone by Context

**Onboarding & Welcome Messages**:
- Warm, exciting, inviting
- Example: "おしゃれなTo-Doライフへようこそ！さあ、始めましょう。"
- Tone: Enthusiastic, welcoming, slightly energetic

**Task Completion & Success States**:
- Celebratory, encouraging, rewarding
- Example: "素晴らしい！もう1つタスク完了😎"
- Tone: Cheerful, congratulatory, with appropriate emoji usage

**Error States & Guidance**:
- Helpful, non-judgmental, solution-focused
- Example: "タスクタイトルを入力して、素敵なリストを作成しましょう"
- Tone: Supportive, instructive, never scolding

**Empty States & Motivation**:
- Inspiring, gentle push to action
- Example: "今日はまだタスクがありません。新しいタスクを追加して、今日を特別にしましょう！"
- Tone: Motivational, friendly nudge, positive framing

**Prompts & Calls to Action**:
- Action-oriented, clear intention
- Example: "新しいタスクを追加", "完了マークをつける", "削除する"
- Tone: Direct, straightforward, empowering

**Notifications & Reminders**:
- Gentle, non-intrusive, helpful
- Example: "今日のタスクが3つ残っています。あなたならできる！"
- Tone: Soft encouragement, practical reminder

**Confirmation Dialogs**:
- Respectful, clear, helpful
- Example: "このタスクを削除しますか？（この操作は戻せません）"
- Tone: Neutral, informative, with clear consequences

