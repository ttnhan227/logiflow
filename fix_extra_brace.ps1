$file = 'd:\logiflow\client_mobile\lib\screens\driver\driver_trip_detail_screen.dart'
$content = Get-Content $file -Raw
$lines = $content -split "`n"
if ($lines[-1] -eq '}' -and $lines[-2] -eq '}') {
    $lines = $lines[0..($lines.Length-2)]
}
$lines -join "`n" | Set-Content $file -NoNewline
