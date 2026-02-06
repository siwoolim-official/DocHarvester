$baseUrl = "http://localhost:8080/api/extract"
$body = @{
    urls = @("https://example.com")
    type = "HTML_NO_CSS"
} | ConvertTo-Json

# 1. Start Task
Write-Host "Requesting extraction..."
$response = Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType "application/json" -Body $body
$taskId = $response.taskId
Write-Host "Task ID: $taskId"

# 2. Poll Status
$status = "PENDING"
while ($status -ne "COMPLETED" -and $status -ne "FAILED") {
    Start-Sleep -Seconds 2
    $taskInfo = Invoke-RestMethod -Uri "$baseUrl/status/$taskId" -Method Get
    $status = $taskInfo.status
    $progress = $taskInfo.progress
    Write-Host "Status: $status (Progress: $progress%)"
}

if ($status -eq "FAILED") {
    Write-Error "Task failed!"
    exit 1
}

# 3. Download
Write-Host "Downloading ZIP..."
$zipPath = "test_async_result.zip"
Invoke-RestMethod -Uri "$baseUrl/download/$taskId" -Method Get -OutFile $zipPath
Write-Host "Downloaded to $zipPath"

if (Test-Path $zipPath) {
    Write-Host "SUCCESS: ZIP file created."
} else {
    Write-Error "FAILURE: ZIP file not found."
}
