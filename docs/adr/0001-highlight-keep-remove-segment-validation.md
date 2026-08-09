# Synchronous cross-service precondition and validation for keep/remove segments

**Status**: accepted

`inference_service` was a stateless HTTP-forwarding proxy to the Colab highlight worker with no DB access and no dependency on any other backend service. The Colab `/highlight-reel-link` endpoint was fully async: it returns `job_id` immediately and does all SRT fetching, parsing, and LLM work in a `BackgroundTasks` job, reporting failure later via the QStash `job_failed` webhook.

Adding Keep/Remove Segment selection requires two checks that can't be satisfied by that shape:

1. The precondition that the video already has `srt_raw_url` in the `videos` table — `inference_service` has no way to know this without asking another service.
2. Input validation (index conflicts between keep/remove ranges, indices outside the SRT's actual range, keep segments whose total duration exceeds `target_max`) — this requires the SRT to already be parsed into segments, which previously only happened deep inside the background job.

We chose to break both patterns rather than route around them:

- `inference_service` now makes a synchronous call to `media_service`'s existing `GET /videos/:id` to check `srt_raw_url` before ever calling Colab. This only fires when `keep_ranges`/`remove_ranges` are present in the request — the default (no keep/remove) path is unchanged. No internal auth header is added; this matches the existing precedent of unauthenticated internal HTTP calls elsewhere in the codebase (e.g. `media_service → course_service` in `webhook.service.ts`), relying on private network reachability rather than a shared secret.
- Colab's `_create_highlight_job` now fetches and parses the SRT (and runs all keep/remove/pipeline-compatibility validation) *before* creating the job and returning `job_id`, only for requests carrying `keep_ranges`/`remove_ranges`. A validation failure returns HTTP 400 immediately instead of surfacing later as a `job_failed` event.

Alternative considered: keep everything async and report validation failures via the existing `job_failed` webhook. Rejected because the user explicitly wants index-level errors (which index conflicted, which was out of range) returned immediately so they can be corrected before the job is even created — deferring that to an async event would be a materially worse UX for a case that's entirely about user-supplied input needing a fix, not a runtime failure.

## Consequences

- `inference_service` needs a new `MEDIA_SERVICE_URL` env var and an `HttpService` call — no longer a pure proxy.
- Requests that use `keep_ranges`/`remove_ranges` pay the latency of an extra service call (`inference_service → media_service`) plus SRT fetch+parse before getting a response, instead of an immediate `job_id`. Requests without keep/remove are unaffected.
- This precondition/validation flow is scoped to the OpenAI, single-output pipeline only (`isOpenAI=true`, `isMultiOutput=false`); other pipeline configurations reject the request rather than silently ignoring keep/remove input.
