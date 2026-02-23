# blow-49AD21CE-5672-40F7-A197-8AEEA85C5E8D

## Table of Contents

## Prerequisites

### Node

Ensure that your machine has Node (and npm) installed by checking with the following command:

```bash
node -v
npm -v
```

If one of them output an error, then install Node by either using [`nvm`](https://github.com/nvm-sh/nvm) or from the standalone binaries, both instructions can be found [here](https://nodejs.org/en/download).

### nx

If `nx` has not yet been installed, then run the following command:

```bash
npm install -g nx
```

## Known Issues

- Dashboard tests display a TypeScript error `Cannot find module '@angular/core/testing'` during execution, but tests run successfully. This is a known module resolution issue between Angular 21, NX 22, and jest-preset-angular v16 (see [NX issue #33777](https://github.com/nrwl/nx/issues/33777)). The error is cosmetic - all test functionality works correctly and assertions pass.