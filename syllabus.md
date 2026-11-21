# Syllabus: AI Evals in Practice

**Instructor:** Manjeet Singh · **Format:** 6 live sessions on ByteByteGo, plus office hours · **Full course:** https://live.bytebytego.com/courses/ai-evals

This is the syllabus for the full course. This repo is the free preview: it contains the syllabus, one complete hands-on lab, two browser tools, flashcards, and one live deck. The assignments, worked solutions, and datasets below belong to the full course.

## The 6 weeks

| Week | Theme | Key topics |
|------|-------|------------|
| 01 | Eval Foundations & Error Analysis | Quality dimensions, cost and latency metrics, traces vs logs, failure taxonomies, the eval flywheel |
| 02 | Designing Reliable LLM Judges | Evaluator types, binary rubrics, judge prompt anatomy, judge-human agreement, per-metric A/B |
| 03 | Safety & Adversarial Testing | Prompt injection, jailbreaks, red teaming with Promptfoo, guardrails, human-in-the-loop approval flows |
| 04 | RAG Evaluation | Golden sets, Braintrust scorers, groundedness, bootstrap confidence intervals, repeatable harnesses |
| 05 | Multi-Agent Evaluation | Tool-call scoring, trajectory evaluation, handoff evaluation, interaction failures |
| 06 | Production Eval Infrastructure | Eval gates in CI/CD, drift detection, canary evals, cost routing, ownership |

Each week has two assignments. One demo agent, Pronto (a grocery delivery support agent), is reused across all six weeks, so the evals compound instead of starting over.

## What each week asks you to do

- **Week 1:** Instrument and trace the Pronto agent, then build a failure taxonomy from real failures.
- **Week 2:** Write binary rubrics and measure your judge against human labels.
- **Week 3:** Red team the agent, then add the guardrails that hold.
- **Week 4:** Build a golden set and score RAG answers with confidence intervals.
- **Week 5:** Score tool calls, trajectories, and handoffs across agents.
- **Week 6:** Put eval gates in CI, detect drift, and run canary evals.

## Prerequisites

- Python 3.10+ (Mac, Windows, or Linux, 4 GB RAM)
- Basic familiarity with Git and GitHub
- An LLM API key, any provider (OpenAI, Anthropic, or Gemini); $5 is enough to start. Not needed for Week 1, which is fully keyless. Required from Week 2 onward.
- A free Braintrust key. Not required for Week 1. Required from Week 2 onward.

## What the preview covers

The `hands-on-practice/` lab in this repo is a complete Week 1 style exercise: write your first eval, trace your first failure, and make the ship or hold call. It runs in the browser with no setup and no keys. The `tools/` folder has the trace viewer and the judge calibration game from Weeks 1 and 2.
