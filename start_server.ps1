# POWERSHELL STATIC DEVELOPMENT SERVER WITH VIDEO RANGE SUPPORT
# Hosts the workspace on http://localhost:3000/ and auto-opens the browser

$port = 5500
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

# Stop existing listener if any
try {
    $listener.Start()
} catch {
    Write-Warning "Failed to start listener. Port $port may be in use."
    Write-Warning $_.Exception.Message
    Exit
}

$localUrl = "http://localhost:$port/"
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "         AI STUDIO LOCAL DEV SERVER" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Serving: $(Get-Location)" -ForegroundColor Gray
Write-Host " Running at: $localUrl" -ForegroundColor Green
Write-Host " Press [Ctrl + C] to stop the server." -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Auto-open browser
Start-Process $localUrl

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        
        # Per-request try-catch block to guarantee server resiliency against socket disconnects
        try {
            $request = $context.Request
            $response = $context.Response
            
            $url = $request.Url.LocalPath
            
            # Default route
            if ($url -eq "/") {
                $url = "/index.html"
            }
            
            # Decode URL characters (spaces, %, etc.)
            $urlDecoded = [uri]::UnescapeDataString($url)
            
            # Build local path (handle forward/backslash differences)
            $relPath = $urlDecoded.TrimStart('/')
            $filePath = Join-Path (Get-Location) $relPath
            
            if (Test-Path $filePath -PathType Leaf) {
                # 1. Determine Content Type
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = "application/octet-stream"
                switch ($ext) {
                    ".html" { $contentType = "text/html; charset=utf-8" }
                    ".css"  { $contentType = "text/css; charset=utf-8" }
                    ".js"   { $contentType = "application/javascript; charset=utf-8" }
                    ".mp4"  { $contentType = "video/mp4" }
                    ".webm" { $contentType = "video/webm" }
                    ".mov"  { $contentType = "video/quicktime" }
                    ".png"  { $contentType = "image/png" }
                    ".jpg"  { $contentType = "image/jpeg" }
                    ".jpeg" { $contentType = "image/jpeg" }
                    ".gif"  { $contentType = "image/gif" }
                    ".svg"  { $contentType = "image/svg+xml; charset=utf-8" }
                    ".ico"  { $contentType = "image/x-icon" }
                }
                
                $response.ContentType = $contentType
                $response.Headers.Add("Access-Control-Allow-Origin", "*")
                $response.Headers.Add("Accept-Ranges", "bytes")
                
                # File length
                $fileInfo = New-Object System.IO.FileInfo($filePath)
                $fileLength = $fileInfo.Length
                
                # 2. Handle HTTP Range Requests (CRITICAL FOR MOBILE/VIDEO SCRUBBING)
                $rangeHeader = $request.Headers["Range"]
                if ($rangeHeader -and $rangeHeader -match "bytes=(\d+)-(\d*)") {
                    $start = [int64]$Matches[1]
                    $end = if ($Matches[2]) { [int64]$Matches[2] } else { $fileLength - 1 }
                    
                    if ($end -ge $fileLength) {
                        $end = $fileLength - 1
                    }
                    
                    $chunkSize = $end - $start + 1
                    $response.StatusCode = 206 # Partial Content
                    $response.Headers.Add("Content-Range", "bytes $start-$end/$fileLength")
                    $response.ContentLength64 = $chunkSize
                    
                    # Check method
                    if ($request.HttpMethod -eq "HEAD") {
                        # Skip writing body for HEAD request
                    } else {
                        # Stream chunk to output
                        $fs = New-Object System.IO.FileStream($filePath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::Read)
                        try {
                            [void]$fs.Seek($start, [System.IO.SeekOrigin]::Begin)
                            $bufferSize = 65536 # 64KB chunks
                            $buffer = New-Object byte[] $bufferSize
                            $bytesToWrite = $chunkSize
                            
                            while ($bytesToWrite -gt 0) {
                                $readLen = [math]::Min($bufferSize, $bytesToWrite)
                                $count = $fs.Read($buffer, 0, $readLen)
                                if ($count -le 0) { break }
                                $response.OutputStream.Write($buffer, 0, $count)
                                $bytesToWrite -= $count
                            }
                        } finally {
                            $fs.Close()
                        }
                    }
                } else {
                    # 3. Standard Response (No Range)
                    $response.StatusCode = 200
                    
                    if ($request.HttpMethod -eq "HEAD") {
                        $response.ContentLength64 = $fileLength
                    } else {
                        $bytes = [System.IO.File]::ReadAllBytes($filePath)
                        $response.ContentLength64 = $bytes.Length
                        $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    }
                }
                
                Write-Host "$(Get-Date -Format 'HH:mm:ss') | $($response.StatusCode) | $($request.HttpMethod) | $contentType | $url" -ForegroundColor Gray
            } else {
                $response.StatusCode = 404
                $response.ContentType = "text/plain"
                if ($request.HttpMethod -ne "HEAD") {
                    $errMsg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                    $response.OutputStream.Write($errMsg, 0, $errMsg.Length)
                }
                Write-Host "$(Get-Date -Format 'HH:mm:ss') | 404 | $($request.HttpMethod) | $url" -ForegroundColor Red
            }
        } catch {
            # Log socket disconnects or cancelled requests softly
            Write-Host "$(Get-Date -Format 'HH:mm:ss') | Cancelled | $($request.HttpMethod) | $($_.Exception.Message) | $url" -ForegroundColor Yellow
        } finally {
            # Safely close response
            if ($null -ne $context -and $null -ne $context.Response) {
                try {
                    $context.Response.Close()
                } catch {
                    # Ignore errors if stream already closed
                }
            }
        }
    }
} catch {
    Write-Host "Server main loop encountered an exception: $_" -ForegroundColor Red
} finally {
    $listener.Stop()
    Write-Host "Server stopped." -ForegroundColor Yellow
}
