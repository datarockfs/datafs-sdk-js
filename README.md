# datafs-sdk

Browser and Node tracker for a self-hosted [DataFS](https://github.com/datarockfs/datafs) install. MIT.

The server repo is private. The HTTP contract this package calls is in `API.md`.

```js
import { Datafs } from "datafs-sdk";

const dfs = new Datafs({
  domain: "example.com",
  endpoint: "https://analytics.example.com",
});

await dfs.pageview();
await dfs.event("signup", { plan: "pro" });
```

In Node, pass `url` (and `referrer` when you have one). The package sets no cookies and does not retry a failed pageview.

```
npm test
```
