# Security policy

## Supported versions

Only the latest commit on `main` is supported. There are no maintained release branches.

## Reporting a vulnerability

Report vulnerabilities privately through GitHub security advisories:
https://github.com/patrickking67/cloudscribe/security/advisories/new

Do not open a public issue, and do not publish a working exploit, signing material, credentials or private infrastructure details.

Include the affected commit, a minimal `.csc` input when relevant, the command you ran, the observed impact and steps to reproduce.

## Scope

In scope:

- Generated-code injection: source that compiles to JavaScript doing something the source does not say
- Parser or analyzer denial of service from small inputs
- The CLI reading or writing files other than the ones named on the command line
- The playground escaping its worker or affecting the page outside the output panes
- Dependency compromise and release integrity

Out of scope: what a program does through its own `shell`, `readFile`, `writeFile` or `exit` calls. Those built-ins run with the permissions of the user who runs the program, by design.

## What to expect

This is a one-person project. I aim to acknowledge a report within 7 days and to share a fix or a plan within 30 days. I will credit you in the advisory unless you ask me not to.
