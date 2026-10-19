<!-- If there's an issue, link it below. Delete the line if there isn't one. -->
Fixes #{{issue number}}

## Summary

{{One sentence: what this changes, and why.}}

## Detail

{{What a reviewer needs in order to read the diff: the approach, anything non-obvious, and any decision they might question. Bullets are fine. Don't narrate the diff.}}

## Screenshots

{{A before and after pair for anything a visitor or an editor can see. Take both at the same page, state and window width. Add a row for each view, such as the front end and the editor. Drop the Before column for something new. Delete this heading if nothing visible changes.}}

| Before | After |
|---|---|
| {{Screenshot from `main`}} | {{Screenshot from this branch}} |

## Notes

{{Optional: open questions, anything deliberately left out, follow-up work. Delete this heading if there's nothing.}}

## Testing instructions

{{Steps a reviewer can follow, starting from `npm run build` and `npm run playground:start`. Name the page to open and any content that has to exist first.}}

_I have:_
 - [ ] Run `composer lint` and `composer test`
 - [ ] Run `npm run lint:js`, `npm run lint:css` and `npm run test:unit`
 - [ ] Run `npm run test:e2e`, if this touches block behaviour
 - [ ] Added or updated tests where appropriate
 - [ ] Updated `CHANGELOG.md` under `[Unreleased]`
 - [ ] Written testing instructions that someone else can follow
 - [ ] Put before and after screenshots in this description for any visible change (see AGENTS.md)
