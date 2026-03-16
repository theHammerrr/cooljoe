param(
    [string]$ApiUrl = "http://localhost:3001/api/copilot",
    [string]$Case = "all",
    [ValidateSet("explain", "explain_analyze")]
    [string]$Mode = "explain"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$fixtureRoot = Join-Path $repoRoot "dev\query-analysis-fixtures"
$casesDir = Join-Path $fixtureRoot "cases"
$expectedDir = Join-Path $fixtureRoot "expected"
$fixtureTables = @(
    "qa_customers",
    "qa_orders",
    "qa_line_items",
    "qa_events",
    "qa_tiny_lookup"
)

function Invoke-CopilotPost {
    param(
        [string]$Path,
        [object]$Body
    )

    return Invoke-RestMethod `
        -Method Post `
        -Uri ($ApiUrl.TrimEnd("/") + "/" + $Path.TrimStart("/")) `
        -ContentType "application/json" `
        -Body ($Body | ConvertTo-Json -Depth 10)
}

function Ensure-FixtureSchema {
    Write-Host "Refreshing schema snapshot..."
    [void](Invoke-CopilotPost -Path "refresh-schema" -Body @{})

    foreach ($table in $fixtureTables) {
        try {
            [void](Invoke-CopilotPost -Path "allow-tables" -Body @{ table = $table })
            Write-Host ("Allowed table: {0}" -f $table)
        } catch {
            Write-Warning ("Could not allowlist table {0}: {1}" -f $table, $_.Exception.Message)
        }
    }
}

function Get-CaseNames {
    if ($Case -ne "all") {
        return @($Case)
    }

    return Get-ChildItem -Path $casesDir -Filter "*.sql" |
        Sort-Object Name |
        ForEach-Object { [System.IO.Path]::GetFileNameWithoutExtension($_.Name) }
}

function Get-ExpectedDefinition {
    param([string]$CaseName)

    $expectedPath = Join-Path $expectedDir ($CaseName + ".json")

    if (-not (Test-Path $expectedPath)) {
        return @{
            mustContainTitles = @()
            mustNotContainTitles = @()
            notes = "No expected definition found."
        }
    }

    return Get-Content $expectedPath -Raw | ConvertFrom-Json
}

Ensure-FixtureSchema

$failures = @()
$caseNames = Get-CaseNames

foreach ($caseName in $caseNames) {
    $sqlPath = Join-Path $casesDir ($caseName + ".sql")

    if (-not (Test-Path $sqlPath)) {
        $failures += "Case '$caseName' does not exist."
        continue
    }

    $sql = Get-Content $sqlPath -Raw
    $expected = Get-ExpectedDefinition -CaseName $caseName

    Write-Host ""
    Write-Host ("=== {0} ===" -f $caseName)
    Write-Host $expected.notes

    try {
        $response = Invoke-CopilotPost -Path "analyze-query" -Body @{
            query = $sql
            mode = $Mode
            includeAiSummary = $false
        }
    } catch {
        $failures += "Case '$caseName' failed to analyze: $($_.Exception.Message)"
        continue
    }

    if (-not $response.success) {
        $failures += "Case '$caseName' returned success=false: $($response.error)"
        continue
    }

    $titles = @($response.findings | ForEach-Object { $_.title })

    if ($titles.Count -eq 0) {
        Write-Host "No findings returned."
    } else {
        Write-Host "Findings:"
        foreach ($finding in $response.findings) {
            $reasonableness = if ($finding.reasonableness) { " [$($finding.reasonableness)]" } else { "" }
            Write-Host ("- {0}{1}" -f $finding.title, $reasonableness)
        }
    }

    foreach ($requiredTitle in @($expected.mustContainTitles)) {
        if ($titles -notcontains $requiredTitle) {
            $failures += "Case '$caseName' is missing expected finding: $requiredTitle"
        }
    }

    foreach ($blockedTitle in @($expected.mustNotContainTitles)) {
        if ($titles -contains $blockedTitle) {
            $failures += "Case '$caseName' returned forbidden finding: $blockedTitle"
        }
    }
}

Write-Host ""

if ($failures.Count -gt 0) {
    Write-Host "Fixture analysis completed with mismatches:" -ForegroundColor Yellow
    foreach ($failure in $failures) {
        Write-Host ("- {0}" -f $failure) -ForegroundColor Yellow
    }

    exit 1
}

Write-Host "All fixture cases matched their expected findings." -ForegroundColor Green
