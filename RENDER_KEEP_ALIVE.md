# Render Keep-Alive Configuration

## Problem
Render puts free-tier services to sleep after 15 minutes of inactivity. Your server will be paused and requests will take 30+ seconds to wake up.

## Solution
Use the `/heartbeat` endpoint with an external monitoring service to keep your server awake.

---

## 1. Heartbeat Endpoint

Your server now has a `/heartbeat` endpoint available at:

```
GET https://four3-96-aasg.onrender.com/heartbeat
```

**Response:**
```json
{
  "status": "alive",
  "timestamp": "2026-02-06T15:30:45.123Z",
  "uptime": 3600
}
```

---

## 2. Keep-Alive Options

### Option A: UptimeRobot (Recommended & Free)

**Steps:**

1. Visit https://uptimerobot.com
2. Sign up for a free account
3. Click **"Add New Monitor"**
4. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** `Render Keep-Alive`
   - **URL:** `https://four3-96-aasg.onrender.com/heartbeat`
   - **Monitoring Interval:** `5 minutes`
   - **Notifications:** Email (optional)
5. Click **"Create Monitor"**

**Cost:** FREE (includes 50 monitors)

---

### Option B: Freshping (Free)

**Steps:**

1. Visit https://www.freshping.io
2. Create a free account
3. Add a new uptime monitor
4. Enter URL: `https://four3-96-aasg.onrender.com/heartbeat`
5. Set check interval to 5 minutes
6. Save

**Cost:** FREE

---

### Option C: Monitoring.express (Free)

**Steps:**

1. Visit https://monitoring.express
2. Create your monitoring site
3. Add endpoint: `https://four3-96-aasg.onrender.com/heartbeat`
4. Set interval to 5 minutes

**Cost:** FREE

---

### Option D: GitHub Actions (Free, Self-Hosted)

Create a `.github/workflows/keep-alive.yml` file in your repository:

```yaml
name: Keep Render Alive

on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Render Server
        run: |
          curl -i https://four3-96-aasg.onrender.com/heartbeat
```

**Cost:** FREE (GitHub Actions has free minutes for public repos)

---

## 3. Testing the Heartbeat

Test locally:
```bash
curl http://localhost:8002/heartbeat
```

Test on production:
```bash
curl https://four3-96-aasg.onrender.com/heartbeat
```

Expected response:
```json
{
  "status": "alive",
  "timestamp": "2026-02-06T15:30:45.123Z",
  "uptime": 3600
}
```

---

## 4. Recommended Setup

**For Best Results:**
- Use **UptimeRobot** (most reliable, free tier is generous)
- Set check interval to **5-8 minutes** (keep it below the 15-minute sleep threshold)
- Enable email notifications for downtime alerts

This will ensure your server stays awake 24/7 at no cost.

---

## 5. Monitoring Dashboard

Once set up, UptimeRobot provides:
- ✅ Real-time uptime monitoring
- 📊 Historical uptime statistics
- 🔔 Instant email/SMS alerts
- 📱 Mobile app for monitoring
- 🌍 Checks from multiple locations worldwide

---

## 6. Additional Notes

- The `/heartbeat` endpoint is lightweight and doesn't impact performance
- Multiple monitoring services can ping the same endpoint
- Response time from heartbeat should be <100ms
- No authentication required for the heartbeat endpoint (kept simple for external services)

---

## Implementation Details

The heartbeat endpoint is configured in [app.js](app.js):

```javascript
app.get('/heartbeat', (req, res) => {
  res.status(200).json({ 
    status: 'alive', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

This endpoint:
- Responds immediately (no database queries)
- Returns the current timestamp for debugging
- Shows server uptime in seconds
- Uses minimal CPU/memory

---

## Troubleshooting

**If server still sleeps:**
- Verify monitoring service is actively pinging (check UptimeRobot logs)
- Check monitoring service isn't blocked by Render
- Increase ping frequency to every 5 minutes
- Consider upgrading to Render's paid tier for guaranteed uptime

**If getting 502 errors:**
- Check if Render deployment is healthy
- Verify no recent code changes broke the heartbeat endpoint
- Check application logs on Render dashboard

---

## Cost Comparison

| Service | Cost | Monitors | Interval | Features |
|---------|------|----------|----------|----------|
| UptimeRobot | FREE | 50+ | 5-60 min | Excellent |
| Freshping | FREE | Limited | 5-60 min | Good |
| Monitoring.express | FREE | Limited | 5-60 min | Basic |
| GitHub Actions | FREE | Unlimited | Custom | DIY |
| Render Pro | $12/month | Unlimited | N/A | Built-in |

---

**Recommended:** Use **UptimeRobot** for the best free solution!
