# generate_cert.ps1 - UTF-8 BOM 编码，PowerShell 5.1 兼容
Import-Module PKI
$ErrorActionPreference = 'Stop'

$cert = New-SelfSignedCertificate -DnsName '192.168.31.103','localhost','127.0.0.1' -CertStoreLocation 'Cert:\CurrentUser\My' -KeyAlgorithm RSA -KeyLength 2048 -NotAfter (Get-Date).AddYears(2)

$pwd = ConvertTo-SecureString -String 'campus' -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath 'C:\Users\liem\campus.pfx' -Password $pwd | Out-Null
Export-Certificate -Cert $cert -FilePath 'C:\Users\liem\campus.cer' -Type CERT | Out-Null

$rootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store('Root','CurrentUser')
$rootStore.Open('ReadWrite')
$rootStore.Add($cert)
$rootStore.Close()

Write-Host '[OK] cert generated + added to Root store'
Get-ChildItem C:\Users\liem\campus.* | Format-Table Name,Length
$thumb = $cert.Thumbprint
Write-Host ('Thumbprint: ' + $thumb)
