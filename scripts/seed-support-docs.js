/**
 * seed-support-docs.js
 *
 * Seeds the Staff Guide → Support Processes hierarchy and articles into the
 * custom wiki database using Prisma directly.
 *
 * Usage (inside custom-wiki container or with local DATABASE_URL):
 *   node scripts/seed-support-docs.js
 *   node scripts/seed-support-docs.js --dry-run
 */

require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const DRY_RUN = process.argv.includes("--dry-run");
const prisma = new PrismaClient();

// ── Helpers ────────────────────────────────────────────────────────────────

function mdToHtml(md) {
  // Minimal converter for headers, bold, code blocks, lists and paragraphs
  let html = md
    .replace(/^#{3}\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^#{2}\s+(.+)$/gm, "<h2>$1</h2>")
    .replace(/^#{1}\s+(.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^```[a-z]*\n([\s\S]*?)^```/gm, "<pre><code>$1</code></pre>")
    .replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\.\s+(.+)$/gm, "<li>$2</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`)
    .replace(/^---$/gm, "<hr>")
    .replace(/\n\n([^<])/g, "\n\n<p>$1")
    .replace(/([^>])\n\n/g, "$1</p>\n\n");
  return html;
}

async function upsertShelf(data) {
  if (DRY_RUN) {
    console.log(`[DRY-RUN] Upsert shelf: ${data.title}`);
    return { id: "dry-shelf" };
  }
  return prisma.shelf.upsert({
    where: { slug: data.slug },
    update: { title: data.title, description: data.description },
    create: data,
  });
}

async function upsertBook(shelfId, data) {
  if (DRY_RUN) {
    console.log(`[DRY-RUN]   Upsert book: ${data.title}`);
    return { id: "dry-book" };
  }
  return prisma.book.upsert({
    where: { shelfId_slug: { shelfId, slug: data.slug } },
    update: { title: data.title, description: data.description },
    create: { ...data, shelfId },
  });
}

async function upsertPage(bookId, data) {
  if (DRY_RUN) {
    console.log(`[DRY-RUN]     Upsert page: ${data.title}`);
    return { id: "dry-page" };
  }

  const html = mdToHtml(data.markdown);

  const page = await prisma.page.upsert({
    where: { bookId_slug: { bookId, slug: data.slug } },
    update: {
      title: data.title,
      markdown: data.markdown,
      html,
      summary: data.summary,
      reviewStatus: "APPROVED",
      kbId: data.kbId,
      category: data.category,
      subcategory: data.subcategory,
    },
    create: {
      bookId,
      title: data.title,
      slug: data.slug,
      markdown: data.markdown,
      html,
      summary: data.summary,
      reviewStatus: "APPROVED",
      kbId: data.kbId,
      category: data.category,
      subcategory: data.subcategory,
    },
  });

  const latest = await prisma.pageRevision.findFirst({
    where: { pageId: page.id },
    orderBy: { version: "desc" },
  });

  await prisma.pageRevision.create({
    data: {
      pageId: page.id,
      version: (latest?.version ?? 0) + 1,
      title: page.title,
      markdown: page.markdown,
      html: page.html,
    },
  });

  return page;
}

// ── Content definitions ────────────────────────────────────────────────────

const SHELF = {
  title: "Staff Guide",
  slug: "staff-guide",
  description: "Internal documentation for Kecktech staff covering support processes, procedures, and workflows.",
};

const BOOK = {
  title: "Support Processes",
  slug: "support-processes",
  description: "Step-by-step procedures for the Kecktech support team: ticket handling, onboarding, remote access, and escalation.",
};

const PAGES = [
  {
    title: "Support Ticket Workflow",
    slug: "support-ticket-workflow",
    kbId: "INT-001",
    category: "Staff Guide",
    subcategory: "Support Processes",
    summary: "How to handle inbound support tickets in Zammad from creation to resolution.",
    markdown: `# Support Ticket Workflow

All customer support requests are managed in Zammad at https://tickets.kecktech.net.

## Ticket Groups

| Group | Use |
|---|---|
| MSP Support | Managed IT service requests |
| HaaS | Hardware lease issues and returns |
| Senior Care | Senior client assistance |
| Internal | Staff / infrastructure issues |

## Inbound Channels

- **Email:** messages to support@kecktech.net auto-create tickets
- **Live Chat:** Zammad chat widget on help.kecktech.net
- **Portal:** customers submit via portal.kecktech.net
- **Phone/Walk-in:** staff creates ticket manually

## Ticket Lifecycle

1. **New** — ticket created, unassigned
2. **Open** — assigned to agent, work in progress
3. **Pending Reminder** — waiting on customer reply (auto-escalates after 48h)
4. **Pending Close** — resolved, awaiting customer confirmation (auto-closes after 72h)
5. **Closed** — resolved and confirmed

## SLA Targets

| Priority | First Response | Resolution |
|---|---|---|
| Critical | 30 min | 4 hours |
| High | 2 hours | 8 hours |
| Normal | 4 hours | 24 hours |
| Low | 8 hours | 72 hours |

## High-Priority Alert Flow

When a ticket reaches **Critical** or **High** priority, n8n automatically sends an SMS via Twilio to the on-call technician.

- n8n workflow: Zammad webhook → n8n → Twilio SMS
- On-call schedule is managed via the internal calendar

## Closing a Ticket

1. Set state to **Pending Close** and add resolution notes
2. Send a closing summary to the customer via the ticket
3. Record time spent under the ticket's Time Accounting tab
4. Tag with relevant service code (SVC-MSP, SVC-HAAS, etc.)
`,
  },
  {
    title: "Customer Onboarding Process",
    slug: "customer-onboarding",
    kbId: "INT-002",
    category: "Staff Guide",
    subcategory: "Support Processes",
    summary: "Provisioning a new customer account across LLDAP, Vaultwarden, Zammad, and ERPNext.",
    markdown: `# Customer Account Onboarding — Kecktech IT Solutions

This document describes the process for provisioning a new customer user account across the Kecktech stack, granting access to the Customer Portal, password vault, and relevant customer-facing data.

> **Tip:** Use the automated Onboarding Wizard at https://dashboard.kecktech.net/ops/onboarding to complete Steps 1–4 automatically.

---

## Overview

Customer accounts use **LLDAP** for authentication (via Authelia SSO). A customer in the \`kecktech_customers\` group gets:

- **One-factor auth** access to portal.kecktech.net
- Access to their Vaultwarden collection (shared by staff)
- Linked records in Zammad and ERPNext for personalized portal data

---

## Step 1 — Create Customer Account in LLDAP

**Access:** https://lldap.kecktech.net (Tailscale required) — log in as keckadmin

1. Go to **Users → Create User**
2. Fill in:
   - **Username:** firstname.lastname (lowercase, no spaces)
   - **Email:** customer's email address
   - **Display Name:** Full name
   - **Password:** Generate a strong password (store in Step 3)
3. Save the user.
4. Go to the user's detail page → **Add to Group → kecktech_customers**

> **Note:** Do NOT add customers to kecktech_admins or kecktech_ops.

---

## Step 2 — Add Credentials to Vaultwarden

**Access:** https://vault.kecktech.net — log in as staff admin

1. Navigate to the appropriate **Customer Collection** (named after the client company).
2. Create a new **Login** item:
   - **Name:** Customer Portal — {Customer Name}
   - **Username:** LLDAP username from Step 1
   - **Password:** Password generated in Step 1
   - **URL:** https://portal.kecktech.net
3. Save. Optionally share the collection with the customer if they have a Vaultwarden account.

---

## Step 3 — Verify Zammad Account

**Access:** https://tickets.kecktech.net — log in as admin

1. Go to **Admin → Users → Search** for the customer's email.
2. If no Zammad account exists, create one:
   - **Email:** same as LLDAP email
   - **Name:** Full name
   - **Role:** Customer
3. Assign to the correct **Organization** in Zammad (matches company name).

---

## Step 4 — Verify ERPNext Customer Record

**Access:** https://ops.kecktech.net — log in as ERPNext admin

1. Go to **CRM → Customers → Search** for the customer's company name.
2. Ensure a **Customer** record exists with the correct name.
3. Verify at least one **Sales Invoice** is linked to this customer.

---

## Step 5 — Test Access

1. Open a private/incognito browser window.
2. Navigate to https://portal.kecktech.net.
3. Authelia will redirect to the login page — log in with the customer's LLDAP credentials.
4. Verify:
   - Welcome banner shows the correct name.
   - Support tickets appear (if any exist in Zammad).
   - Invoices appear (if any exist in ERPNext).

---

## Off-boarding a Customer

1. **LLDAP:** Remove user from kecktech_customers group or disable/delete the account.
2. **Vaultwarden:** Revoke collection share or delete customer credentials.
3. **Zammad:** Set customer user to inactive.
4. **ERPNext:** No action required (historical invoices remain).
`,
  },
  {
    title: "Remote Support Procedures",
    slug: "remote-support-procedures",
    kbId: "INT-003",
    category: "Staff Guide",
    subcategory: "Support Processes",
    summary: "How to connect to client machines using RustDesk and Tactical RMM for remote support sessions.",
    markdown: `# Remote Support Procedures

Kecktech uses **RustDesk** for screen-sharing and remote control sessions with clients. **Tactical RMM** provides background agent-based access for MSP clients.

---

## Tools

| Tool | Use Case | Access |
|---|---|---|
| RustDesk | Screen sharing, guided support | Client installs RustDesk app |
| Tactical RMM | MSP remote shell, unattended access | Agent pre-installed on managed devices |

---

## RustDesk — Initiating a Session

### Prerequisites

- Client must have RustDesk installed: https://rustdesk.com/download
- Client's **RustDesk ID** must be saved in their Vaultwarden collection

### Steps

1. Open RustDesk on your workstation (connected to Tailscale)
2. Enter the client's **RustDesk ID** in the Connect field
3. Request the client provide their **one-time password** (shown on their screen)
4. Click **Connect** — session begins once client approves
5. After session, log time in Zammad under the client's ticket

### Finding the Client's RustDesk ID

- Open Vaultwarden at https://vault.kecktech.net
- Navigate to the client's collection
- Look for the item named "RustDesk ID — {Client Name}"

---

## Tactical RMM — MSP Remote Access

### Prerequisites

- Client device must have the Tactical RMM agent installed
- You must be on Tailscale or accessing https://rmm.kecktech.net

### Steps

1. Log in to https://rmm.kecktech.net
2. Navigate to **Clients → {Client Name} → Agents**
3. Select the target device
4. Choose **Remote Background → Remote Shell** for command-line access
5. Or click **Take Control** for full desktop control (Windows only)

### Running Scripts Remotely

1. In Tactical RMM, select the agent
2. Click **Run Script**
3. Choose from saved scripts or paste a new one
4. Set timeout and run as (System / logged-in user)
5. Review output in the script results panel

---

## Billing Remote Support Time

- Use ticket code **SVC-REMOTE** ($45/hr) for standard remote sessions
- Use **SVC-HOME** ($85/hr) only for physically on-site visits
- Log all time under the client's Zammad ticket using Time Accounting

---

## Ending a Session

1. Notify the client the session is ending
2. Disconnect from RustDesk or close the RMM connection
3. Update the ticket state and add a resolution note
4. Send session summary to client via the ticket
`,
  },
  {
    title: "Escalation Policy",
    slug: "escalation-policy",
    kbId: "INT-004",
    category: "Staff Guide",
    subcategory: "Support Processes",
    summary: "How to escalate tickets by severity, who gets notified, and resolution expectations.",
    markdown: `# Escalation Policy

This document defines how Kecktech handles ticket escalation when issues exceed normal response times or require senior technical involvement.

---

## Severity Levels

| Level | Description | Examples |
|---|---|---|
| **P1 — Critical** | Service down, data loss risk, security breach | Server offline, ransomware, billing system down |
| **P2 — High** | Major functionality impaired | Email down, RMM agent offline on all devices |
| **P3 — Normal** | Degraded functionality, workaround available | Slow performance, one device issue |
| **P4 — Low** | Minor issue, no business impact | UI glitch, informational request |

---

## Escalation Path

### P1 — Critical (Response: 30 min)

1. **Immediate:** Assign to senior tech
2. **At 15 min:** n8n → Twilio SMS to on-call tech
3. **At 30 min:** Call owner (Jon Keck) directly
4. **Resolution target:** 4 hours
5. **Communication:** Update ticket every 30 minutes

### P2 — High (Response: 2 hours)

1. **Immediate:** Assign to available tech
2. **At 1 hour:** Notify team lead via Zammad internal note
3. **Resolution target:** 8 hours
4. **Communication:** Update ticket every 2 hours

### P3 — Normal (Response: 4 hours)

1. Assign within 4 hours of creation
2. Resolution target: 24 hours
3. No automatic escalation

### P4 — Low (Response: 8 hours)

1. Assign within business day
2. Resolution target: 72 hours (3 business days)
3. No automatic escalation

---

## After-Hours Escalation

- **P1/P2 only** trigger after-hours response
- On-call tech receives SMS from n8n/Twilio
- Non-emergency issues (P3/P4) are queued for next business day

---

## Escalation to Vendors

When an issue requires vendor support:

1. Document the issue thoroughly in the ticket
2. Collect relevant logs and error messages
3. Open a support case with the vendor
4. Paste the vendor ticket/case number into the Zammad ticket
5. Set ticket state to **Pending Reminder** with a follow-up date

---

## Post-Incident Review

For any P1 incident:

1. Schedule a 30-min review within 48 hours of resolution
2. Document root cause and remediation steps in the ticket
3. Create a preventive action item if applicable
4. Update runbooks/SOPs as needed (this wiki)
`,
  },
  {
    title: "New Client Hardware Setup (HaaS)",
    slug: "haas-hardware-setup",
    kbId: "INT-005",
    category: "Staff Guide",
    subcategory: "Support Processes",
    summary: "Steps for provisioning and deploying a new HaaS device to a client under the Hardware-as-a-Service program.",
    markdown: `# New Client Hardware Setup — HaaS Program

This guide covers the end-to-end process for provisioning a new device under Kecktech's **Hardware-as-a-Service (HaaS)** subscription at $149/mo/device.

---

## Overview

HaaS devices are owned by Kecktech and leased to clients. All devices must be:

- Enrolled in **Tactical RMM** (monitoring and patching)
- Recorded in **ERPNext** as a leased asset
- Tracked in **Vaultwarden** with device credentials and RustDesk ID

---

## Step 1 — Prepare the Device

1. Perform a clean OS installation (Windows 11 Pro recommended for business clients)
2. Apply all Windows updates
3. Install required software:
   - Tactical RMM agent (deploy from rmm.kecktech.net)
   - RustDesk (for remote support)
   - Kecktech endpoint baseline (antivirus, backup client, browser policy)
4. Set a unique local admin password — store in Vaultwarden

---

## Step 2 — Enroll in Tactical RMM

1. Log in to https://rmm.kecktech.net
2. Navigate to **Clients → {Client Name}**
3. Click **Add Agent** → Download the installer
4. Run the installer on the new device
5. Verify the agent appears online in the Tactical RMM dashboard
6. Assign the device to the correct **Site** within the client

---

## Step 3 — Record in ERPNext

1. Log in to https://ops.kecktech.net
2. Navigate to **Assets → Asset → New**
3. Fill in:
   - **Asset Name:** {Device type} — {Serial} (e.g., "Dell Latitude 5540 — SN12345")
   - **Asset Category:** Leased Hardware
   - **Item Code:** HAAS-L1, HAAS-L2, or HAAS-L3 (based on tier)
   - **Customer:** client's ERPNext Customer record
   - **Serial Number**
   - **Purchase Date** and **Purchase Amount**
4. Save and submit

---

## Step 4 — Add to Vaultwarden

1. Open https://vault.kecktech.net
2. Navigate to the client's collection
3. Create a new Login item:
   - **Name:** HaaS Device — {device name}
   - **Username:** local admin username
   - **Password:** local admin password
   - **Notes:** Serial number, Tactical RMM agent ID, RustDesk ID

---

## Step 5 — Deploy to Client

1. Confirm all software and updates are installed
2. Configure user account(s) for the client
3. Run a final check in Tactical RMM — verify agent is online
4. Deliver device with a handoff checklist
5. Create a Zammad ticket (group: HaaS) documenting the deployment
6. Create the recurring subscription invoice in ERPNext:
   - Item: **HaaS Device Subscription (SVC-HAAS)**
   - Frequency: Monthly
   - Rate: $149/mo

---

## Monthly Maintenance Checklist

- [ ] Patch status reviewed in Tactical RMM
- [ ] Backup client log reviewed
- [ ] Antivirus scan results reviewed
- [ ] Device health metrics within normal range
- [ ] Subscription invoice sent and paid
`,
  },
];

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding support docs${DRY_RUN ? " (DRY RUN)" : ""}...`);

  const shelf = await upsertShelf(SHELF);
  console.log(`Shelf: ${SHELF.title} (id: ${shelf.id})`);

  const book = await upsertBook(shelf.id, BOOK);
  console.log(`Book: ${BOOK.title} (id: ${book.id})`);

  for (const pageData of PAGES) {
    const page = await upsertPage(book.id, pageData);
    console.log(`  Page: ${pageData.title} (id: ${page.id})`);
  }

  console.log(`\nDone. ${PAGES.length} pages seeded into Staff Guide → Support Processes.`);
  console.log(`Access at: https://help.kecktech.net/books/support-processes`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
