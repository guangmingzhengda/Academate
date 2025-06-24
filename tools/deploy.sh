npm run build
tar -cvf ../academate.tar -C ../dist .
scp -v ../academate.tar academate@123.56.50.152:/var/www/academate/academate.tar
ssh academate@123.56.50.152 'bash -s' << 'ENDSSH'
echo 'Unzipping'
cd /var/www/academate
rm -rf academate/*
tar -xvf academate.tar -C academate
exit
ENDSSH
