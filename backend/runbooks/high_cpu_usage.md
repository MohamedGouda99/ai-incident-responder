# High CPU Usage Runbook

## Alert: HighCPUUsage
**Severity**: Critical when >90%, Warning when >80%

## Symptoms
- Application response times increasing
- Load balancer health checks failing
- Prometheus node_exporter reports high CPU utilization

## Root Causes

### 1. Application Code Issues
- Infinite loops or computationally expensive operations
- Memory leaks causing excessive garbage collection
- Unoptimized database queries causing CPU-bound processing

### 2. External Traffic Spike
- DDoS attack or unexpected traffic surge
- Bot scraping or crawling
- Viral content causing organic traffic spike

### 3. Background Job Overload
- Cron jobs running concurrently
- Queue consumer processing backlog
- Batch processing jobs consuming resources

## Remediation Steps

### Immediate Actions
1. **Identify the process**: `top -c` or `htop` to find the process consuming CPU
2. **Check application logs**: Look for error patterns or unusual activity
3. **Scale horizontally**: If running in Kubernetes, increase replica count
   ```bash
   kubectl scale deployment <app> --replicas=<count>
   ```

### For Application Issues
1. Check recent deployments: `kubectl rollout history deployment/<app>`
2. If recent deploy, rollback: `kubectl rollout undo deployment/<app>`
3. Profile the application to identify hot paths
4. Review recent code changes for performance regressions

### For Traffic Spikes
1. Enable rate limiting at the load balancer level
2. Scale up the deployment
3. Check for DDoS patterns in access logs
4. Enable CDN caching if not already active

### For Background Jobs
1. Check cron job schedules for overlaps
2. Pause non-critical batch jobs
3. Implement job queuing with concurrency limits
4. Move heavy processing to dedicated worker nodes

## Escalation
- If CPU stays above 95% after scaling: Page the on-call SRE
- If identified as DDoS: Engage the security team
- If application bug: Create P1 ticket for the owning team
