# Pod CrashLoopBackOff Runbook

## Alert: PodCrashLooping
**Severity**: Critical

## Symptoms
- Pod status shows CrashLoopBackOff
- Container repeatedly starting and crashing
- Exponential backoff between restart attempts

## Root Causes

### 1. Application Startup Failure
- Missing environment variables or secrets
- Database connection failure
- Invalid configuration file

### 2. Health Check Failure
- Liveness probe misconfigured
- Application takes too long to start
- Readiness probe checking wrong endpoint

### 3. Resource Constraints
- Insufficient memory causing OOMKill
- CPU throttling preventing startup
- Disk space full

## Remediation Steps

### Immediate Investigation
1. **Check pod events**: `kubectl describe pod <pod-name>`
2. **Check logs**: `kubectl logs <pod-name> --previous`
3. **Check exit code**: Exit code 137 = OOMKilled, 1 = application error

### For Startup Failures
1. Verify all required environment variables exist
2. Check secret mounts: `kubectl get secret <name> -o yaml`
3. Test database connectivity from within the cluster
4. Validate ConfigMaps: `kubectl get configmap <name> -o yaml`

### For Health Check Issues
1. Increase `initialDelaySeconds` on liveness probe
2. Verify the health endpoint returns 200
3. Adjust `timeoutSeconds` and `periodSeconds`

### For Resource Issues
1. Check resource limits: `kubectl describe pod <pod-name> | grep -A5 Limits`
2. Increase memory limits if OOMKilled
3. Check node resources: `kubectl top nodes`

## Escalation
- If crash loop persists after investigation: Engage the application team
- If cluster-wide issue: Check node health and system pods
