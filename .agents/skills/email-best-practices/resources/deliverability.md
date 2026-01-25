# Email Deliverability

Ensuring emails reach inboxes through proper authentication and sender reputation.

## Email Authentication

**Required by Gmail/Yahoo** - unauthenticated emails will be rejected or spam-filtered.

### SPF (Sender Policy Framework)

Specifies which servers can send email for your domain.

```
v=spf1 include:_spf.resend.com ~all
```

- Add TXT record to DNS
- Use `~all` (soft fail) for testing, `-all` (hard fail) for production
- Keep under 10 DNS lookups

### DKIM (DomainKeys Identified Mail)

Cryptographic signature proving email authenticity.

- Generate keys (provided by email service)
- Add public key as TXT record in DNS
- Use 2048-bit keys, rotate every 6-12 months

### DMARC

Policy for handling SPF/DKIM failures + reporting.

```
v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

**Rollout:** `p=none` (monitor) → `p=quarantine; pct=25` → `p=reject`

### BIMI (Optional)

Display brand logo in email clients. Requires DMARC `p=quarantine` or `p=reject`.

### Verify Your Setup

Check DNS records directly:

```bash
# SPF record
dig TXT yourdomain.com +short

# DKIM record (replace 'resend' with your selector)
dig TXT resend._domainkey.yourdomain.com +short

# DMARC record
dig TXT _dmarc.yourdomain.com +short
```

**Expected output:** Each command should return your configured record. No output = record missing.

## Sender Reputation

### IP Warming

New IP/domain? Gradually increase volume:

| Week | Daily Volume |
|------|-------------|
| 1 | 50-100 |
| 2 | 200-500 |
| 3 | 1,000-2,000 |
| 4 | 5,000-10,000 |

Start with engaged users. Send consistently. Don't rush.

### Maintaining Reputation

**Do:** Send to engaged users, keep bounce <2%, complaints <0.1%, remove inactive subscribers

**Don't:** Send to purchased lists, ignore bounces/complaints, send inconsistent volumes

## Bounce Handling

| Type | Cause | Action |
|------|-------|--------|
| Hard bounce | Invalid email, domain doesn't exist | Remove immediately |
| Soft bounce | Mailbox full, server down | Retry: 1h → 4h → 24h, remove after 3-5 failures |

**Targets:** <2% good, 2-5% acceptable, >5% concerning, >10% critical

## Complaint Handling

**Targets:** <0.05% excellent, 0.05-0.1% good, >0.2% critical

**Reduce complaints:**
- Only send to opted-in users
- Make unsubscribe easy and immediate
- Use clear sender names and "From" addresses

**Feedback loops:** Set up with Gmail (Postmaster Tools), Yahoo, Microsoft, AOL. Remove complainers immediately.

## Infrastructure

**Dedicated sending domain:** Use subdomain (e.g., `mail.yourdomain.com`) to protect main domain reputation.

**DNS TTL:** Low (300s) during setup, high (3600s+) after stable.

## Troubleshooting

**Emails going to spam?** Check in order:
1. Authentication (SPF, DKIM, DMARC)
2. Sender reputation (blacklists, complaint rates)
3. Content (spammy words, HTML issues)
4. Sending patterns (sudden volume spikes)

**Diagnostic tools:** [mail-tester.com](https://mail-tester.com), [mxtoolbox.com](https://mxtoolbox.com), [Google Postmaster Tools](https://postmaster.google.com)

## Related

- [List Management](./list-management.md) - Handle bounces and complaints to protect reputation
- [Sending Reliability](./sending-reliability.md) - Retry logic and error handling
