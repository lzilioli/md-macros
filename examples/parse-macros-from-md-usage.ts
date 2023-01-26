import { ParsedMacros, parseMacrosFromMd } from '@lzilioli/md-macros';

export async function parseMacrosFromMdUsageExample(): Promise<void> {
    const md: string = `
Hello #tag

[Link](/home)
Here is some inline code \`code\`

YouTube macro: [[youtube url="<youtube embed url>"]]

Image: ![alt text](www.example.com/example.png "Title Text")

[Reference style link][link1]

# Todo List

- [ ] What?
- [X] This is cool
    - [ ] This is a child task

# Multiple lists per note

- [ ] Nice!

[link1]: https://www.example.com
    `;

    const EXPECTED_PARSED_MACROS: ParsedMacros = parseMacrosFromMd(md);

    console.log(EXPECTED_PARSED_MACROS)
}
