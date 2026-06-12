!include LogicLib.nsh
!include nsDialogs.nsh

!pragma warning disable 6001

Var StartWithWindows
Var StartWithWindowsCheckbox

!macro customPage
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 20u "Zusätzliche Optionen"
  Pop $0
  ${NSD_CreateCheckbox} 0 28u 100% 12u "Mit Windows starten"
  Pop $StartWithWindowsCheckbox
  ${NSD_Check} $StartWithWindowsCheckbox

  nsDialogs::Show
!macroend

!macro customPageLeave
  ${NSD_GetState} $StartWithWindowsCheckbox $StartWithWindows
!macroend

!macro customInstall
  ${If} $StartWithWindows == "1"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Nexus Crosshair Pro" "$INSTDIR\Nexus Crosshair Pro.exe"
  ${EndIf}
!macroend

!macro customUnInstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Nexus Crosshair Pro"
!macroend
