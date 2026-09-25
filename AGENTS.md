---
trigger: always_on
---

# Repository conventions

- Read and apply this root `AGENTS.md` before inspecting, planning, or modifying code in every repository task, including new conversations. Re-check it whenever the working directory or task scope changes.

- Register every application service with dependency injection and expose every service through `IServiceManager` and `ServiceManager`. Controllers, background workers, and other consumers must access application services through `IServiceManager`.

- Register every FluentValidation validator with dependency injection and expose it through `IValidatorManager` and `ValidatorManager`. Do not introduce standalone/static validation paths outside the validator manager.

- Whenever caching is implemented in any function, service, or module, ensure cache invalidation and updates are handled consistently across all mutation paths (create, update, delete). Stale cached entries must be explicitly purged or updated immediately so that administrative views and subsequent requests always reflect the latest data.

- In Tailwind class strings, append `!` to every text-size utility (for example: `text-sm!`, `text-2xl!`, and `text-[11px]!`).

- Write production-quality code that is secure by default, scalable, performant, optimized, reliable, and smooth for users. Validate inputs, protect sensitive data, handle failures safely, avoid leaking implementation details, and prevent unnecessary blocking or repeated work.

- Prefer the simplest maintainable solution that fully meets the requirement. Avoid unnecessary abstractions, premature generalization, duplicated logic, and excessive complexity.

- Keep a clean, consistent folder and file structure. Place each feature, service, interface, validator, DTO, hook, component, and test in the existing matching project area; use focused files and clear, consistent names.

- Build UI with the established application theme, design tokens, colors, typography, spacing, and reusable components. Do not introduce visually inconsistent one-off styling.

- Make every UI change responsive and usable across mobile, tablet, and desktop, with accessible controls, readable layouts, appropriate loading/error/empty states, and smooth interactions.

- Ensure the store name is dynamic across all customer touchpoints. Avoid hardcoding 'Pramukhraj Foods' anywhere in the application. Fetch the store name directly from the database configuration/settings for all orders, transactional emails, OTP SMS/templates, PDF invoices, and user-facing UI components.

- The business operates without a GSTIN. Strictly omit GSTIN numbers, tax breakdowns, HSN/SAC codes, CGST/SGST/IGST line items, or tax collection fields across all workflows—including PDF/bill generation, order summaries, transactional emails, checkout pricing breakdowns, Shiprocket payload generation, and payment gateway (Razorpay) integrations. All customer prices must be presented as flat/total amounts without separate tax levies.
