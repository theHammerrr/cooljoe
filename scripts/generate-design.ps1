param(
    [Parameter(Mandatory = $false)]
    [string]$PromptFile = "design/stitch/query-analysis-redesign.prompt.md",

    [Parameter(Mandatory = $false)]
    [string]$ProjectTitle = "Query Analysis Workspace Redesign",

    [Parameter(Mandatory = $false)]
    [string]$ProjectId,

    [Parameter(Mandatory = $false)]
    [ValidateSet("DESKTOP", "MOBILE", "TABLET", "AGNOSTIC")]
    [string]$DeviceType = "DESKTOP",

    [Parameter(Mandatory = $false)]
    [string]$ModelId,

    [Parameter(Mandatory = $false)]
    [string]$OutputDir = "design/stitch",

    [Parameter(Mandatory = $false)]
    [switch]$DownloadAssets
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-StitchApiKey {
    $configPath = "C:\Users\yonib\.gemini\extensions\Stitch\gemini-extension.json"

    if (!(Test-Path $configPath)) {
        throw "Stitch config not found at $configPath"
    }

    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    $apiKey = $config.mcpServers.stitch.headers.'X-Goog-Api-Key'

    if ([string]::IsNullOrWhiteSpace($apiKey)) {
        throw "X-Goog-Api-Key not found in $configPath"
    }

    return $apiKey
}

function Invoke-StitchMcp {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ApiKey,

        [Parameter(Mandatory = $true)]
        [string]$ToolName,

        [Parameter(Mandatory = $false)]
        [hashtable]$Arguments = @{},

        [Parameter(Mandatory = $false)]
        [int]$Id = 1
    )

    $headers = @{ 'X-Goog-Api-Key' = $ApiKey }
    $argumentsJson = $Arguments | ConvertTo-Json -Compress -Depth 20
    $body = '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"' + $ToolName + '","arguments":' + $argumentsJson + '},"id":' + $Id + '}'

    return Invoke-RestMethod `
        -Uri "https://stitch.googleapis.com/mcp" `
        -Method Post `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $body
}

function Save-TextFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $directory = Split-Path -Parent $Path
    if ($directory -and !(Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory | Out-Null
    }

    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.Encoding]::UTF8)
}

function Save-JsonFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        $Value
    )

    Save-TextFile -Path $Path -Content ($Value | ConvertTo-Json -Depth 30)
}

function Download-File {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url,

        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $directory = Split-Path -Parent $Path
    if ($directory -and !(Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory | Out-Null
    }

    Invoke-WebRequest -Uri $Url -OutFile $Path
}

if (!(Test-Path $PromptFile)) {
    throw "Prompt file not found: $PromptFile"
}

if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$prompt = Get-Content $PromptFile -Raw
$apiKey = Get-StitchApiKey

if ([string]::IsNullOrWhiteSpace($ProjectId)) {
    $createResponse = Invoke-StitchMcp -ApiKey $apiKey -ToolName "create_project" -Arguments @{
        title = $ProjectTitle
    } -Id 1

    $project = $createResponse.result.structuredContent
    $ProjectId = $project.name -replace '^projects/', ''
} else {
    $project = @{
        name = "projects/$ProjectId"
        title = $ProjectTitle
    }
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$runDir = Join-Path $OutputDir "$timestamp-$ProjectId"
New-Item -ItemType Directory -Path $runDir | Out-Null

Save-JsonFile -Path (Join-Path $runDir "project.json") -Value $project
Save-TextFile -Path (Join-Path $runDir "prompt.md") -Content $prompt

$generationArgs = @{
    projectId = $ProjectId
    prompt = $prompt
    deviceType = $DeviceType
}

if ($ModelId) {
    if ($ModelId -notin @("GEMINI_3_PRO", "GEMINI_3_FLASH")) {
        throw "Unsupported ModelId '$ModelId'. Use GEMINI_3_PRO or GEMINI_3_FLASH."
    }

    $generationArgs.modelId = $ModelId
}

$generationResponse = Invoke-StitchMcp -ApiKey $apiKey -ToolName "generate_screen_from_text" -Arguments $generationArgs -Id 2

$generation = $generationResponse.result.structuredContent
$designComponent = $generation.outputComponents | Where-Object { $_.design } | Select-Object -First 1
$textComponents = $generation.outputComponents | Where-Object { $_.text }
$suggestions = $generation.outputComponents | Where-Object { $_.suggestion } | Select-Object -ExpandProperty suggestion

Save-JsonFile -Path (Join-Path $runDir "generation.json") -Value $generation

if ($textComponents) {
    Save-TextFile -Path (Join-Path $runDir "response.txt") -Content (($textComponents | Select-Object -ExpandProperty text) -join "`n`n")
}

if ($suggestions) {
    Save-TextFile -Path (Join-Path $runDir "suggestions.txt") -Content ($suggestions -join "`n")
}

$screen = $null

if ($designComponent -and $designComponent.design.screens) {
    $screen = $designComponent.design.screens | Select-Object -First 1
}

if ($screen) {
    Save-JsonFile -Path (Join-Path $runDir "screen.json") -Value $screen

    if ($DownloadAssets -and $screen.htmlCode.downloadUrl) {
        Download-File -Url $screen.htmlCode.downloadUrl -Path (Join-Path $runDir "screen.html")
    }

    if ($DownloadAssets -and $screen.screenshot.downloadUrl) {
        Download-File -Url $screen.screenshot.downloadUrl -Path (Join-Path $runDir "screen.webp")
    }
}

$manifest = [pscustomobject]@{
    projectId = $ProjectId
    projectName = if ($project.name) { $project.name } else { "projects/$ProjectId" }
    projectTitle = $project.title
    runDirectory = (Resolve-Path $runDir).Path
    sessionId = $generation.sessionId
    screenName = if ($screen) { $screen.name } else { $null }
    screenTitle = if ($screen) { $screen.title } else { $null }
    screenshotUrl = if ($screen) { $screen.screenshot.downloadUrl } else { $null }
    htmlUrl = if ($screen) { $screen.htmlCode.downloadUrl } else { $null }
    assetsDownloaded = [bool]$DownloadAssets
    files = @(
        "project.json",
        "prompt.md",
        "generation.json",
        "response.txt",
        "suggestions.txt",
        "screen.json",
        "screen.html",
        "screen.webp"
    ) | Where-Object { Test-Path (Join-Path $runDir $_) }
}

Save-JsonFile -Path (Join-Path $runDir "manifest.json") -Value $manifest
$manifest | ConvertTo-Json -Depth 10
