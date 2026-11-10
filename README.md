# I Get Da Bag — frontend starter

Start with a working bag shop, then build its AWS backend live with **Kiro and Agent Toolkit for AWS**. This folder contains only the frontend and sample data. There is no package installation or build step.

## What is here?

| File | Purpose |
|---|---|
| `index.html` | The storefront’s page structure. |
| `styles.css` | The shop’s visual design. |
| `app.js` | Browsing, brand filtering, product details and the temporary cart. |
| `products.json` | The fictional product catalog, including the $59 Northstar Daypack (`bag-101`). |
| `images/` | Product photos served alongside the page. |

The product photos are synthetic images generated for this workshop; product information, review counts and review excerpts are fictional teaching data.

## Run the shop

From this folder, run:

```sh
python3 -m http.server 5173 --bind 127.0.0.1
```

Open **[http://localhost:5173](http://localhost:5173)**. Stop the preview with **Ctrl+C**. An editor’s static-preview extension also works; open the folder through its HTTP preview instead of double-clicking the HTML file.

This preview server only serves files. It is **not the shop’s business backend**. The browser reads `products.json` and keeps the cart in memory; refreshing clears the cart. It cannot save an order or write changes back to the catalog file.

Try browsing the bags, searching for **Northstar**, opening the Daypack, and adding it to the cart. Those customer actions will guide the backend we build.

## Build the backend with Kiro

Open this folder in Kiro. Use your **already configured Agent Toolkit for AWS connection** and intended learning account/project. Confirm the identity and Region before creating resources. Documentation lookup alone does not prove access to that account.

Use these prompts one stage at a time. Keep the storefront visible so each backend step connects to a customer action.

### 1. Understand the starter

> Read this frontend and explain how it loads products, filters by brand, opens a product and manages the cart. Trace Maya opening bag-101. Identify where we can replace file reads with API requests while keeping the current design and local images. Use the configured AWS tools to consult current documentation. Explain the smallest backend plan and proposed request/response shapes before changing files.

### 2. Build the catalog API

> Implement a small JavaScript backend using API Gateway HTTP API, Lambda and DynamoDB, with a concise infrastructure-as-code definition. Support GET /products, GET /products?brand=Northstar and GET /products/{id}. Initialize the database from products.json. Use key-based product lookup and an appropriate exact-brand listing pattern, with bounded list responses. Keep the files easy to explain. Add focused tests and clear setup, deployment and cleanup commands. Show the resources, permissions, target account/Region and cost drivers; deploy when I request it.

The brand query is an option on `GET /products`, not a separate method-and-path route. Start by getting one product request working, then add the list and brand behavior.

### 3. Record a demo order

> Add POST /orders. The browser sends only product IDs and quantities. Validate the input on the server, read current prices from DynamoDB, calculate integer-cent totals and store a demo order request. Reject invalid quantities and unknown products. Return a clear result that the frontend can display. This is synthetic workshop data: no personal information or actual payment. The response must not claim that stock was reserved or an order was fulfilled. Test the successful and invalid-input paths. Keep the AWS scope to the core API, functions, tables, required permissions and logs.

### 4. Connect and explain the result

> Replace the frontend’s catalog-file reads with calls to the deployed API and connect the cart’s demo-order action. Preserve the design and keep images local. Configure the browser origin for CORS and put no AWS credentials in browser code. Trace the actual requests and responses for browsing, Northstar, bag-101 and one demo order. Verify the result, inspect a function log, and show me how to remove the workshop resources afterward.

Keep the workshop scope to the catalog and synthetic order requests: no Cognito, login/authentication, real payments, queues, caching, idempotency or other advanced features.

For the presenter: the previous complete implementation is saved locally in the sibling `workshop-complete-reference` folder as an instructor fallback. It is not needed to run or share this frontend starter.
