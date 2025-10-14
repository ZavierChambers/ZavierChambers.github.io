# Intro to Active Directory for Homelabs  
*A long, flowing introduction to planting a small forest of identity in your homelab, where the trees are domain controllers, the soil is DNS, and the quiet work of trust happens in the roots.*

---

## Opening thought

Active Directory is, at heart, a system for saying who you are and what you may do, and because identity is both practical and moral we will treat this exercise as both architecture and apprenticeship, which means we will build a small, safe forest in a private homelab so you can learn how large organizations arrange trust across countries and offices without touching anyone else’s production systems, and so we begin with a simple promise: this lab is for learning, for hardening, for appreciating complexity — not for attacking networks you do not own.

---

## What is Active Directory (in plain terms)

Active Directory (AD) is an identity and directory service created by Microsoft that stores information about users, computers, and other resources and answers the everyday question "who is allowed to do what" across a network, and rather than a single box it is a set of cooperating services — directory data (the database of objects), authentication (who are you? prove it), DNS integration (find the services), policy (what rules apply), and replication (make sure the rules and identities show up in many places) — together AD is the nervous system for Windows-centric networks and a very useful laboratory for learning about identity, delegation, and centralized security.

---

## Core concepts (short, clear, and essential)

- **Forest** — the top-level container that holds one or more domains; it establishes a shared schema and global catalog, it’s the largest boundary of trust in AD, and in many companies a single forest governs the entire global identity model.  
- **Domain** — a namespace and policy boundary inside a forest; users and computers are placed into a domain and authenticate to domain controllers for that domain.  
- **Domain Controller (DC)** — the server that runs Active Directory Domain Services (AD DS) and holds a writable copy of the directory (or sometimes a read-only copy); DCs answer logins, serve LDAP, Kerberos, and replicate with each other.  
- **Organizational Unit (OU)** — a container for grouping objects (users, computers) so you can delegate administration and apply policies in a structured way.  
- **Group Policy (GPO)** — a way to centrally define configuration and security settings for users and computers (password policy, desktop restrictions, software deployment).  
- **Global Catalog (GC)** — a partial read-only replica of every object in the forest that helps clients find objects quickly across domains.  
- **FSMO roles** — a small set of single-master responsibilities (like schema changes or domain naming) that must exist somewhere in the forest; in a homelab you’ll place them deliberately to learn what happens when they are offline.  
- **DNS** — AD depends on DNS to locate services; DNS is not optional and in a lab you will usually run AD-integrated DNS on your DCs.

---

## A realistic homelab forest topology (beginner-friendly)

For learning how companies run AD globally, you don’t need dozens of servers — you need a topology that demonstrates trust, replication, and failure modes:

- **Forest:** `corp.local` (a private lab TLD, do not use public domains you don't own)  
- **Domains:** Start with a single domain `corp.local` (most real-world companies use one forest with either one domain or a small set of domains; the forest boundary is expensive to change so it’s good to learn with a single forest)  
- **Domain Controllers:**  
  - `DC1.corp.local` — Primary writable DC, hosts FSMO roles initially, acts as DNS and Global Catalog.  
  - `DC2.corp.local` — Secondary writable DC in a different virtual network "site" to simulate remote office replication, also a Global Catalog and DNS.  
- **Member server:** `FILESERV.corp.local` (Windows Server or Linux with Samba, added to the domain to demonstrate service accounts and delegated permissions)  
- **Client:** `WIN10CLIENT` or `UbuntuClient` joined to the domain to demonstrate authentication and policy application.  
- **Optional extras:** A read-only domain controller (RODC) to simulate remote branch security, a child domain to demonstrate cross-domain trust, and an AD Certificate Services instance to see PKI in action.

---

## Lab setup — high-level steps (conceptual, not command-by-command)

1. **Isolate your lab network** — make an internal/host-only virtual network that has no route to your home or workplace production network, use snapshots and a firewall to keep lab traffic contained.  
2. **Provision VMs** — create VMs for DC1 and DC2 (Windows Server evaluation images work fine), a member server, and a client; give each machine a static IP on the lab network or use a small DHCP that you control.  
3. **Install AD DS on the first server** — add the Active Directory Domain Services role and promote the server to a domain controller for a new forest/domain (`corp.local`), configure DNS as part of the promotion so the DC also hosts DNS.  
4. **Create a second DC** — add AD DS on DC2 and join it as another domain controller in the same domain so replication begins; verify replication and that DC2 becomes a Global Catalog if you chose that option.  
5. **Create an OU structure and test accounts** — make OUs for `IT`, `Users`, `Servers`, `Workstations`, and create test user and computer accounts, then join the client to the domain.  
6. **Apply a basic Group Policy** — create a GPO for password policy and one for a simple desktop restriction and link them to the appropriate OU to see settings apply to computers and users.  
7. **Observe authentication flows** — from the client, log in with a domain account, note Kerberos tickets and how DNS and DC location behave, and from the DCs monitor Event Viewer for authentication logs and replication errors.  
8. **Practice backups and snapshots** — take VM snapshots before risky experiments and learn how to recover a DC from snapshot (note: recovering DCs improperly can lead to USN rollback; read the safe recovery methods before attempting restores — this is an important learning point).

> Note: I am purposely giving you concepts and the order of operations rather than exact commands because the goal is to learn the architecture safely and to avoid promoting dangerous shortcuts that might be misapplied outside your lab.

---

## Security-minded design choices (what professionals care about)

- **Use separate administrative accounts** (do not use your day-to-day user for domain admin tasks) to practice least privilege and to see how role separation affects incident response.  
- **Time sync & NTP** — Kerberos authentication is time-sensitive; make sure your lab has coherent time configuration or authentication will fail and you will learn why.  
- **Secure replication channels** — replication is encrypted by default for modern Windows Server versions, but observe the network traffic and understand the protections in place.  
- **Protect FSMO holders** — know which server holds which FSMO role and plan for how you would transfer or seize a role in a failure.  
- **Patch and snapshot discipline** — keep systems patched for safe learning, but always snapshot before major changes so you can step back and analyze mistakes.  
- **Limit access to lab resources** — run the lab on an internal-only network or behind strict firewall rules; label it clearly and never connect lab DCs to production networks.

---

## Troubleshooting & learning moments to intentionally provoke

Design experiments that teach failure modes:

- **Simulate DC failure:** Shut down DC1, authenticate a client and observe how DC2 handles requests and how login behavior changes.  
- **Force replication delay:** Change a password on DC1 and watch how long it takes to appear elsewhere, observe replication schedules and latency.  
- **Break DNS:** Misconfigure DNS records and watch how clients fail to find domain controllers, then fix DNS and watch recovery.  
- **FSMO unavailability:** Move a FSMO role temporarily (or simulate unavailability) and see which operations in the domain become impossible (schema updates, RID pool allocation, etc.).

Each experiment is a lesson: the forest behaves like an organism whose health depends on coordination, and your job is to learn to read its symptoms.

---

## Ethical and legal reminder (short and solemn)

Your homelab is for exploration and defense; do not apply what you learn to networks or services that you do not own or have explicit permission to test, because experimentation without consent can cause harm and legal trouble — the skills you gain should be used to protect, not to harm.

---

## Exercises

1. **Build the Minimal Forest (hands-on)**  
   Create the topology described above (one forest, one domain, two DCs, one member server, one client) using virtual machines on an isolated network, and document each decision: IP plan, hostname choices, and why you chose which server to hold FSMO roles on. Take screenshots or notes showing the client authenticating to the domain.

2. **OU & GPO Design Challenge (applied thinking)**  
   Design an OU structure for a small company with `Engineering`, `HR`, and `Sales`, and write two Group Policy ideas: one that enforces a secure password and lockout policy, and one that restricts software installation for non-admin users. Explain where you would link each GPO and why, and how you would delegate the ability to reset passwords without granting domain admin rights.

3. **Failure & Recovery Report (investigative)**  
   Intentionally shut down your primary DC, attempt to log in from the client, and then bring the primary DC back online, documenting what you observed about authentication, replication, and any event logs that recorded errors. Based on your notes, write a short recovery playbook describing the steps you would take if a DC in a real office went offline unexpectedly.

---

## Closing reflection

When you stand inside a homelab forest you are standing inside a carefully arranged fiction of trust, a small world where identity is declared and enforced, and the lesson is humble: systems succeed or fail not because of one setting but because of a thousand tiny agreements between machines and people, and as you learn to build and tend this forest you are learning a craft of attention, a practical theology of stewardship for the digital age.

---

*End of chapter*
