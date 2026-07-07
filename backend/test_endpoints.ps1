$body = '{"username":"admin","password":"admin123"}'
$r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/auth/login/' -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing
Write-Host "LOGIN: $($r.Content)"
$tokenData = $r.Content | ConvertFrom-Json
$token = $tokenData.data.access
Write-Host "TOKEN: $token"

$headers = @{ Authorization = "Bearer $token" }
$r2 = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/admin/dashboard/trend/?days=7' -UseBasicParsing -Headers $headers
Write-Host "TREND: $($r2.Content)"
$r3 = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/admin/dashboard/category-distribution/' -UseBasicParsing -Headers $headers
Write-Host "CAT: $($r3.Content)"
$r4 = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/admin/ai/config/' -UseBasicParsing -Headers $headers
Write-Host "AI: $($r4.Content)"
$r5 = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/categories/tree/' -UseBasicParsing -Headers $headers
Write-Host "TREE: $($r5.Content.Substring(0, 200))"
