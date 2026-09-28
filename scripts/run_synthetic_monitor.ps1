# Synthetic-monitor: runs the live-site Chrome-MCP E2E check for personal-bot on a schedule
# (Windows Task Scheduler daily trigger). Alerts (push notification) only on failure; a
# passing run stays silent.
#
# Hardening note (found 2026-09-21, same issue seen on the sibling Coach Debrief monitor):
# claude -p can occasionally exit early with STATUS_CONTROL_C_EXIT (3221225786) when launched
# under Task Scheduler — not a site or prompt problem, direct invocation of the identical
# command succeeds. Retrying once absorbs the flake. If it crashes twice in a row, that's a
# monitor-infrastructure failure, not a site failure — it gets its own native Windows
# notification (independent of claude/Node) so a broken monitor can't silently look like "all
# clear."

$ErrorActionPreference = "Stop"
$root = "C:\myAI\personal-bot"
Set-Location $root

$logDir = Join-Path $root "logs\synthetic_monitor"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$logFile = Join-Path $logDir ("run_{0}.log" -f (Get-Date -Format "yyyyMMdd_HHmmss"))

Start-Transcript -Path $logFile -Append | Out-Null

function Send-NativeAlert {
    param([string]$Message)
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $icon = New-Object System.Windows.Forms.NotifyIcon
        $icon.Icon = [System.Drawing.SystemIcons]::Warning
        $icon.Visible = $true
        $icon.ShowBalloonTip(15000, "Synthetic monitor infrastructure failure", $Message, [System.Windows.Forms.ToolTipIcon]::Error)
        Start-Sleep -Seconds 1
    }
    catch {
        Write-Host "NATIVE ALERT ALSO FAILED: $_"
    }
}

function Invoke-CheckWithRetry {
    param([string]$Name, [string]$PromptFile)

    for ($attempt = 1; $attempt -le 2; $attempt++) {
        Write-Host "`n--- $Name (attempt $attempt/2) ---"
        Get-Content -Raw $PromptFile | claude -p --permission-mode auto
        $code = $LASTEXITCODE
        Write-Host "(exit code: $code)"
        if ($code -eq 0) { return }
        Write-Host "Attempt $attempt for '$Name' crashed with exit code $code."
    }

    $msg = "'$Name' crashed twice in a row (exit code $code) - the monitor itself did not complete, this is not a site failure. Check logs\synthetic_monitor."
    Write-Host "MONITOR INFRASTRUCTURE FAILURE: $msg"
    Send-NativeAlert -Message $msg
}

Write-Host "=== personal-bot synthetic monitor run: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') local ==="

Invoke-CheckWithRetry -Name "personal-bot live check" -PromptFile (Join-Path $root "prompts\synthetic_monitor.md")

Write-Host "`n=== Run complete: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') local ==="

Stop-Transcript | Out-Null
