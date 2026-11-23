# Hands-on practice lab

One page, three tabs, one story: you are the product manager for the Pronto
support agent. Built for a live class of product managers. Nothing to
install, no keys, no account.

**Live URL:**
`https://coachmanjeet.github.io/AI-Agent-Evals-Course-Preview/hands-on-practice/`

## What students do

| Tab | They practice | They leave with |
|-----|---------------|-----------------|
| 1. Write your first eval | Turning one rule (refunds over $50 need a human) into one boundary case and a pass or fail rule, then applying it to three agent replies | A pass rate, and their first eval in the suite |
| 2. Trace your first failure | Reading 4 traces step by step, marking pass or fail, naming each failure, counting them, and turning the most common one into a new eval (six more traces in More practice) | A failure count and a second eval |
| 3. Improve your AI every week | Three bars prefilled, choose the two that block release, then make the ship or hold call on weeks 3 and 4 (weeks 1 and 2 summarized) | Two decisions and a two-sentence note to leadership |

Every step has a reference answer behind a button, so 100 students can check
themselves. Each tab ends with an "after class" box for the student's own
product.

## Run it

- **In class:** share the live URL.
- **Locally or offline:** download this folder and double-click `index.html`.
  No server is needed.

## Teaching it live in 30 minutes

| Minutes | Tab | The line to land |
|---------|-----|------------------|
| 8 | 1 | "Two of three pass. The one failure gave away $85." |
| 12 | 2 | "The reply looked fine. The trace shows what the agent did." Demo trace 4, then let the room do 5, 6, and 8. |
| 10 | 3 | "The overall pass rate rose every week. The decision did not follow it." |

Week 3 in tab 3 is the regression: a fix for one eval breaks another. Ask
the room who shipped it.

For the debrief, put trace 8 on screen: the agent refunds $18 for spoiled
chicken, and the customer also said they felt sick. Ask the room: does this
pass the refund eval? Does it pass the hand-off eval? What would your
dashboard show if you only measured refunds?

## Where answers go

Answers are saved in the student's own browser and nowhere else. **Copy my
worksheet** and **Download as a text file** produce a plain-text summary of
all three tabs to paste into Slack or a doc. **Start over** erases it.

## Change the content

Everything Pronto-specific is in `lab-data.js`: the rules, the three replies,
the ten traces (four live, six in More practice), the evals, and the weekly scores. Edit that file only.

- A trace needs `ref` (`pass` or `fail`), a `why`, and for failures a `label`.
- Weekly `scores` are counts out of `casesPerEval` (20).
- The reference notes quote some numbers (for example "from 94% to 95%").
  If you change scores, reread the notes.

## Files

| File | What it is |
|------|------------|
| `index.html` | The page: layout, styles, and the instructions for each step |
| `lab.js` | The logic: tabs, checking, counting, the ship or hold call, export |
| `lab-data.js` | The Pronto content and every reference answer |

System fonts only and no network requests, so it works behind any firewall.
