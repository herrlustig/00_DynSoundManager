@REM this builds the soundmanager 2 SWF from source
@REM using mxmlc from the Adobe open-source Flex SDK

c:\Programme\flexsdk\bin\mxmlc -target-player=10.0.0 -debug=true -use-network=false -static-link-runtime-shared-libraries=true -optimize=true -o ../test_web_app/swf/mysoundmanager_debug.swf -file-specs MySoundManager.as 2> error.tmp
for %%j in (error.tmp) do if %%~zj gtr 0 type error.tmp >> error.log
del error.tmp
