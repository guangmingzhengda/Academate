npm run build
tar -cvf ../sssr.tar -C ../dist .
scp -v ../sssr.tar sssr@121.36.57.109:/var/www/sssr/sssr.tar
ssh sssr@121.36.57.109 'bash -s' << 'ENDSSH'
echo 'Unzipping'
cd /var/www/sssr
rm -rf sssr/*
tar -xvf sssr.tar -C sssr
exit
ENDSSH
