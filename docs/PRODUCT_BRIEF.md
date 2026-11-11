# EXHIBIT product brief

**Proof beats promises.** Two inputs become an inspectable technical evidence board: a public repository and a job description.

## The problem and the user

A developer can build useful software and still struggle to explain its relevance to a specific role. A reviewer has little time to explore an unfamiliar repository. A polished paragraph does not make the underlying implementation easier to inspect.

EXHIBIT serves developers with public projects who want a compact, source-linked artifact for a job application. Its hypothesis is that connecting a concrete requirement to inspectable implementation reduces the work needed to assess that claim. This hypothesis has not yet been validated with applicants or hiring managers.

## The decisive interaction

Select an observation and the exact code opens beside it, with original line numbers and a GitHub link pinned to the analyzed commit. Partial evidence and requirements not observed remain visible. The inspection manifest shows what the system actually read.

The model proposes interpretations. A separate server verifier checks the file, line interval, and quoted source before a positive observation can be saved. A citation mismatch removes the proposed positive explanation. Source correspondence is inspectable; semantic correctness and authorship remain explicit limits.

## Scope judgment

The MVP completes one loop: paste → inspect → share. It includes a responsive landing page, real analysis stages, a source inspector, read-only sharing, a genuine reference example, and clear error recovery.

Accounts, private repositories, CV generation, candidate scores, and recruiter workflows are excluded. Bounded source selection keeps the request manageable but sacrifices coverage. “Not observed” describes that bounded inspection, not the developer's ability or the entire repository.

Public reports expire after 30 days. Complete source files and raw job descriptions are not stored in report rows. Repository code is never executed. Selected public source and job text are processed by Google's model, with the free-tier data-use disclosure shown before analysis.

## What has been demonstrated

- Real GitHub and Gemini responses generated persisted reports for two public repositories.
- A fresh Vercel production analysis completed in 18.727 seconds and its saved result was retrieved successfully.
- The featured reference has six independently rechecked citations. All five interpretations were reviewed against the source; authentication remains partial and tests remain unobserved in the selected files.
- The build, 47 unit tests, and 10 browser scenarios passed. The public deployment was checked at 1440px and 375px, including source inspection and opening copied links in fresh browser contexts.

These observations establish the tested implementation path. They do not establish hiring outcomes, broad model accuracy, first-visit comprehension, or a latency or availability guarantee. Google returned intermittent capacity errors during testing. The app preserves inputs and has no paid fallback.

## The next product experiment

Ask five developers to create an Exhibit for a real application, then ask five reviewers to assess one implementation claim using the shared report. Observe whether each reviewer opens the cited code, whether they can explain the inspection limits, and where they still need context. Record comprehension and time to inspect a claim before expanding scope.

Commit-level retrieval caching and a broader human-reviewed evaluation set are the next engineering improvements. Neither is represented as completed user validation.

Live product: https://exhibit-orcin.vercel.app · [Reference](https://exhibit-orcin.vercel.app/example) · [Source](https://github.com/stavrespasov/exhibit) · [Measured verification](../TEST_REPORT.md)
