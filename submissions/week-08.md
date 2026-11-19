# Week 08 submissions

Live site: https://antu-lofistack-gallery.vercel.app

---

## Post 1 — Component

```
Week: 08
Type: input
Component: Mood Emoji
Live: antu-lofistack-gallery.vercel.app/components/mood-emoji
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/mood-emoji.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 component called MoodEmoji with no dependencies and no AI service. The person types how they feel in their own words (for example "tired but happy today") and a custom emoji is drawn for that mood as they type.

Reading the text: export a pure function readMood(text, extraWords?). Split the text into words (Unicode letters), remove common endings (stressed → stress, happily → happy) and look each word up in a built-in dictionary of 23 moods (happy, excited, calm, in love, proud, grateful, okay, silly, sad, heartbroken, lonely, tired, bored, stressed, anxious, angry, annoyed, scared, surprised, sick, confused, hungry, shy), each with synonyms, a valence, an energy value and an opposite. Look at the three words before each match: "not / never / n't" switches to the opposite mood, "very / so / really / super" makes it stronger, "a bit / slightly / kinda" makes it weaker, and two or more exclamation marks add strength. Stop looking back at "but / and" or at another feeling word. Return { text, moods, label, valence, energy, face }, where label is a readable name like "Tired but happy" ("but" when the feelings pull in opposite directions, otherwise "and"; "Very …" or "A bit …" for a single feeling).

The face: do not pick from a list of emojis. Describe the face with numbers (smile, mouth open, eye openness, happy curved eyes, eyebrow angle, head tilt, wavy mouth, face colour, and extras: tears, sweat, zzz, heart eyes, blush, sparkles, tongue). Each mood has its own values; blend them by weight so mixed moods get their own face, and take the maximum for extras. Draw it as an SVG with a gradient face, and glide from the old face to the new one with requestAnimationFrame (with a timer fallback for background tabs). Add gentle idle bobbing and blinking, all turned off for reduced motion.

UI: a large question as the label of a text box, chips showing the feeling words that were found (including "not okay → sad" and strong / a bit), one-tap example sentences, the emoji on a panel tinted with the face colour, its name, Mood and Energy bars with words, and Download PNG and Copy image buttons (serialize the SVG to a 512 px canvas). Show a friendly unsure face and a hint when no feeling word is found.

Props: title, question, placeholder, defaultText, examples, extraWords (extra vocabulary such as { khushi: "happy" }), showMeters, showActions, onChange(reading), className. Layout with a container query, light and dark mode, labelled input, role=img emoji with a text name, and a role=status result.
```

---

## Post 2 — Component

(Second Week 08 component still to build. `table` is the only unused type.)

---

## Post 3 — Agent log

(Week 08 agent log still to write. Kinds used so far: coding, browser automation, ideation, QA testing, troubleshooting.)
