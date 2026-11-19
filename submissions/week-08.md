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

```
Week: 08
Type: table
Component: Study Routine
Live: antu-lofistack-gallery.vercel.app/components/study-routine
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/study-routine.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 component called StudyRoutine with no dependencies: a weekly study routine maker for students.

Step 1, subjects: a text box with an Add button (Enter also adds). Each subject is listed with its own colour, a difficulty menu (Easy / Normal / Hard) and a remove button. Reject empty and duplicate names and stop at maxSubjects.
Step 2, study time: From and To time fields for the student's fixed daily study time (default 6:00 PM to 10:00 PM; the end may pass midnight), a session length menu (30 to 90 minutes) and a break menu (0 to 15 minutes). Show how many sessions fit in a day and when the last one ends.
Step 3, days: seven day buttons (week starts on Saturday by default) that switch between Study and Free. Friday is free by default.

Making the routine: export a pure function buildRoutine(options). Work out the sessions per day from the study time, session length and break. Give every subject at least one session, then share the remaining sessions by difficulty (weights 1 / 2 / 3). Spread each subject over different days, put the hardest subjects first each day, and avoid the same subject twice in a row. A seed changes the arrangement for a Shuffle button. Return problems in plain words: no subjects, no study days, study time shorter than one session, more than 12 hours, and list any subjects left out when there is not enough time.

Output: a real table (rows are session times, columns are the seven days) with coloured subject cells, a Free day column for free days, a sticky time column and sideways scrolling on phones. Under it, show sessions and hours per subject for the week. Add Shuffle, Copy as text and Download picture (draw the table on a canvas and save a PNG).

Props: title, defaultSubjects, defaultStart, defaultEnd, defaultSessionMinutes, defaultBreakMinutes, defaultStudyDays, weekStart, hardFirst, maxSubjects, onChange(routine), className. The routine updates live on every change. Use a container query for the layout, support light and dark mode, label every field, use table caption and scoped headers, aria-pressed day buttons, role=alert for problems and role=status for confirmations.
```

---

## Post 3 — Agent log

(Week 08 agent log still to write. Kinds used so far: coding, browser automation, ideation, QA testing, troubleshooting.)
