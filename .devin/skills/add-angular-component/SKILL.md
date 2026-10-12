---
name: add-angular-component
description: Generates a new standalone Angular component.
argument-hint: "[component-name]"
allowed-tools:
  - exec
  - read
---

You are an expert Angular developer. Create a new standalone component with the name provided in the argument.

1.  Run the command `ng generate component <component-name> --standalone --change-detection=OnPush` in the `src/app` directory.
2.  Ensure the component uses SCSS for styling.
3.  Update the component's TypeScript file to use signals for inputs and outputs.