# Project memory

## Product intent & audience

- **Product:** Banao AI, an all-in-one AI content creation platform for video, image, text, voice, and chat.
- **Audience:** Content creators producing TikToks, YouTube videos, Reels, short-form content, scripts, and voiceovers.
- **Language:** Mixed Urdu + English UI with concise, action-oriented feature labels.
- **Goal:** Deliver a polished creator workspace while keeping media generation and authentication reliable.

## Brand personality & voice

- Creator-first, energetic, approachable, and encouraging.
- Professional without sounding corporate or technically intimidating.
- Keep bilingual feature names concise and action-oriented.

## Visual design & UX direction

- Maintain consistent Banao AI branding across navigation, page titles, supporting copy, and footer.
- Let visitors understand and explore the product before authentication interrupts them.
- Expose the five core tools clearly: video, image, text, voice, and chat.
- Prefer polished feature cards, animated creation previews, creator-focused CTAs, and purposeful motion over generic dashboard patterns.
- Use a clean, responsive authentication modal with Google sign-in, password visibility control, validation, loading states, and visible success/error feedback.
- Video creation should include selectable 30-second, 2-minute, and 10-minute durations.
- Keep layouts responsive, accessible, and production-oriented; optimize media loading and caching where useful.

## Decisions, constraints & rationale

- **Stack:** Vite + React with Tailwind and Lucide icons. Use the configured `@/` alias for project imports.
- **Authentication:** Supabase session handling with Google OAuth; provider setup and credentials remain an external configuration dependency.
- **Security:** AI provider credentials must stay in Supabase Edge Function secrets/server-side code and never be exposed in React, browser code, or committed files.
- **Gateway configuration:** Existing workflows use OpenAI for chat, text, image, and voice, and Replicate for video. Supported configuration includes OpenAI model/voice overrides and Replicate token/model settings.
- A prior secret inspection found only Supabase system secrets; requested provider values were not present.
- The supplied Replicate value was a placeholder rather than a usable API token. Do not store or deploy incomplete/fake credentials.
- The environment could inspect secrets but could not write new provider values, so valid secrets must be added through an authorized secrets-management path.
- The gateway was updated and redeployed to accept `REPLICATE_VIDEO_MODEL=wan-video/wan-2.1-t2v-720p` directly while retaining support for version-style model identifiers.
- Preserve existing video generation logic and provide explicit progress, timeout, and error states rather than leaving requests hanging.
- Provider configuration, credits, permissions, quotas, and model input compatibility must be verified before treating generation as production-ready.

## Open questions & assumptions

- Valid values for the requested OpenAI settings (`gpt-4o-mini`, `gpt-image-1`, `tts-1`, and `alloy`) still need to be securely configured and tested.
- A real Replicate API token is still required; the previously supplied value cannot be used.
- Confirm whether the selected `wan-video/wan-2.1-t2v-720p` model supports the gateway’s expected input schema and requested duration options.
- Confirm backend support for 2-minute and 10-minute video generation, including model limits and processing time.
- Supabase Google OAuth setup remains dependent on manual provider enablement and valid OAuth credentials.
- Token-budget usage tracking is not yet represented in the UI.
- Complete end-to-end verification of every gateway path is still required after provider secrets are configured.