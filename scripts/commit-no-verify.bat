@echo off
echo Committing without verification...
git add -A
git commit --no-verify -m %*
echo Done!