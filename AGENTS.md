# AGENTS.md

What the plugin does, how to build it and which commands lint and test it are in [README.md](README.md).

## Pull requests

- Every PR body must use `.github/pull_request_template.md`. The checklist and the testing instructions are not optional, including for PRs opened or edited by an agent.
- Fill in every heading the template gives you, and delete one only where it says you can. Summary is one sentence, so a reviewer can stop there and know what the PR does. Detail is what someone needs in order to read the diff, not a retelling of it.
- Write testing instructions as steps someone outside the project can follow. Say which page to open and what content has to exist. If they have to create it, give the steps.
- Testing instructions and screenshots go in the PR description, not a comment, so a reviewer finds everything in one place. Anything added after review starts goes in a comment. Edit the description if review showed a step was wrong.

## Screenshots

- Any change a visitor or an editor can see needs screenshots in the description, not only a written description. That covers front end markup and styles, and the block's appearance and sidebar in the editor.
- A change to something that already exists needs a before and after pair, side by side in the template's table. Take the before on `main` and the after on your branch. Run `npm run build` after switching branches, because the plugin registers its blocks from `build/`.
- Take both screenshots at the same page, state and window width, so the change is the only difference between them. Crop to the part that changed.
- Add a table row for each view the change affects, such as the front end and the editor, or buttons and a dropdown.
- Something new has no before. Drop the Before column and show the new thing.
- Save screenshots in `artifacts/`, which is ignored by git. Never commit an image to the repo for a PR, and never link an external image host.
- Upload screenshots as GitHub attachments. Write the references in the table cells, such as `| ![Buttons before](./artifacts/before.png) | ![Buttons after](./artifacts/after.png) |`. Then pass the same files to `gh pr create --attach ./artifacts/before.png --attach ./artifacts/after.png`, or to `gh pr edit <number> --attach ...` on an open PR. `gh` rewrites each reference to point at the uploaded file. If `gh` does not recognise `--attach`, upgrade it.
- In the GitHub web editor, drag each image into its table cell instead.
