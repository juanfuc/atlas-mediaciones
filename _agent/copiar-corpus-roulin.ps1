# =========================
# CONFIGURACIÓN
# =========================

# Ruta del CSV original o de trabajo
$csvPath = "C:\Users\user\repos\svelte\atlas-mediaciones\_agent\carguerosData.csv"

# Carpeta donde están las imágenes originales, en el otro proyecto
$imageSourceRoot = "C:\Users\user\repos\svelte\atlas\atlas-carguero\static\assets\imgs"

# Carpeta destino en el proyecto nuevo
$imageDestRoot = "C:\Users\user\repos\svelte\atlas-mediaciones\static\img\corpus\roulin"

# Ruta pública que usarás en Svelte
$publicSrcPrefix = "/img/corpus/roulin"

# Si el CSV usa punto y coma, cambia "," por ";"
$delimiter = ","

# =========================
# FUNCIONES
# =========================

function Normalize-Text($value) {
    if ([string]::IsNullOrWhiteSpace($value)) {
        return ""
    }

    $text = $value.ToString().Normalize([System.Text.NormalizationForm]::FormD)
    $sb = New-Object System.Text.StringBuilder

    foreach ($ch in $text.ToCharArray()) {
        $category = [System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch)

        if ($category -ne [System.Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$sb.Append($ch)
        }
    }

    return $sb.ToString().Normalize([System.Text.NormalizationForm]::FormC).ToLowerInvariant().Trim()
}

function Get-FileNameFromSrc($src) {
    if ([string]::IsNullOrWhiteSpace($src)) {
        return ""
    }

    $cleanSrc = $src.Trim()
    $cleanSrc = ($cleanSrc -split "\?")[0]
    $cleanSrc = $cleanSrc.Replace("/", "\")

    return [System.IO.Path]::GetFileName($cleanSrc)
}

# =========================
# PREPARAR DESTINO
# =========================

New-Item -ItemType Directory -Force -Path $imageDestRoot | Out-Null

# =========================
# LEER CSV
# =========================

$rows = Import-Csv -Path $csvPath -Encoding UTF8 -Delimiter $delimiter

Write-Host "Filas leídas del CSV: $($rows.Count)"

# =========================
# INDEXAR IMÁGENES ORIGINALES
# =========================

$imageIndex = @{}

Get-ChildItem -Path $imageSourceRoot -File -Recurse | ForEach-Object {
    $key = $_.Name.ToLowerInvariant()

    if (-not $imageIndex.ContainsKey($key)) {
        $imageIndex[$key] = $_.FullName
    }
}

Write-Host "Imágenes encontradas en carpeta fuente: $($imageIndex.Count)"

# =========================
# FILTRAR FILAS
# =========================

$filteredRows = $rows | Where-Object {
    $autor = Normalize-Text $_.autor
    $modelo = Normalize-Text $_.modelo

    $esRoulin = ($autor -match "roulin") -or ($modelo -eq "roulin")
    $esGiast = ($modelo -eq "giast")

    $esRoulin -or $esGiast
}

Write-Host "Filas filtradas: $($filteredRows.Count)"

# =========================
# COPIAR IMÁGENES
# =========================

$copied = @()
$missing = @()
$seen = @{}

foreach ($row in $filteredRows) {
    $src = $row.src
    $fileName = Get-FileNameFromSrc $src

    if ([string]::IsNullOrWhiteSpace($fileName)) {
        $missing += [PSCustomObject]@{
            src = $src
            archivo = ""
            problema = "src vacío o sin nombre de archivo"
        }
        continue
    }

    $key = $fileName.ToLowerInvariant()

    if ($seen.ContainsKey($key)) {
        continue
    }

    $seen[$key] = $true

    if ($imageIndex.ContainsKey($key)) {
        $sourceFile = $imageIndex[$key]
        $targetFile = Join-Path $imageDestRoot $fileName

        Copy-Item -LiteralPath $sourceFile -Destination $targetFile -Force

        $copied += [PSCustomObject]@{
            src_original = $src
            src_nuevo = "$publicSrcPrefix/$fileName"
            archivo = $fileName
            origen = $sourceFile
            destino = $targetFile
        }
    }
    else {
        $missing += [PSCustomObject]@{
            src = $src
            archivo = $fileName
            problema = "no encontrado en carpeta fuente"
        }
    }
}

# =========================
# GUARDAR LOGS
# =========================

$logCopied = Join-Path $imageDestRoot "_log_copiados.csv"
$logMissing = Join-Path $imageDestRoot "_log_faltantes.csv"

$copied | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $logCopied
$missing | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $logMissing

# =========================
# RESUMEN
# =========================

Write-Host ""
Write-Host "Proceso terminado."
Write-Host "Imágenes copiadas: $($copied.Count)"
Write-Host "Imágenes faltantes: $($missing.Count)"
Write-Host "Destino: $imageDestRoot"
Write-Host "Log copiados: $logCopied"
Write-Host "Log faltantes: $logMissing"