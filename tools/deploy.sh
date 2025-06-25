npm run build
tar -cvf ../academate.tar -C ../dist .
scp -v ../academate.tar buaa@10.251.254.146:~/academate.tar
ssh buaa@10.251.254.146 'bash -s' << 'ENDSSH'
echo 'Unzipping'
cd ~
rm -rf academate/*
tar -xvf academate.tar -C academate
exit
ENDSSH
