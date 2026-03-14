# High Memory Usage Runbook

## Alert: HighMemoryUsage
**Severity**: Critical when >90%, Warning when >80%

## Symptoms
- OOMKilled pods in Kubernetes
- Swap usage increasing on bare metal
- Application performance degradation

## Root Causes

### 1. Memory Leaks
- Objects not being garbage collected
- Connection pools growing unbounded
- Cache without eviction policy

### 2. Increased Data Volume
- Large dataset being loaded into memory
- Response payload sizes growing
- File uploads being buffered in memory

### 3. Configuration Issues
- JVM heap size too large/small
- Container memory limits misconfigured
- Missing resource requests in Kubernetes

## Remediation Steps

### Immediate Actions
1. **Check memory consumers**: `free -h` and `ps aux --sort=-%mem | head -20`
2. **Check for OOMKills**: `kubectl get events --field-selector reason=OOMKilling`
3. **Restart affected pods**: `kubectl rollout restart deployment/<app>`

### For Memory Leaks
1. Take a heap dump for analysis
2. Check connection pool metrics
3. Review recent code changes for object retention issues
4. Implement or adjust cache TTL and max size

### For Data Volume Issues
1. Implement pagination for large queries
2. Stream large responses instead of buffering
3. Add file size limits for uploads
4. Use disk-based temporary storage for large files

## Escalation
- If OOMKills persist after restart: Increase memory limits
- If memory grows linearly over time: Likely a memory leak — escalate to dev team
