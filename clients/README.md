# Reference clients

These small, zero-dependency clients demonstrate the public HTTP contract. They are MIT-licensed examples, not required SDKs.

## JavaScript

```js
import { AccountingAgentsClient } from "./javascript/accounting-agents.mjs";

const client = new AccountingAgentsClient();
const results = await client.search("bank reconciliation", { type: ["workflow", "pack"] });
const pack = await client.pack("bank-reconciliation");
```

The client uses the global Fetch API available in modern browsers and Node.js 22 or newer.

## Python

```python
from accounting_agents import AccountingAgentsClient

client = AccountingAgentsClient()
results = client.search("revenue recognition", type=["workflow", "resource"])
pack = client.pack("revenue-contract-review")
```

The Python client uses only the standard library. Copy the single module into a governed project or vendor it with the source release.

Keep retrieved record IDs, release versions, review dates, source IDs, and rights fields in the consuming agent’s run record. A successful retrieval does not establish source applicability or action authority.
