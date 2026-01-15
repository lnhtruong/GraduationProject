


#ssh vào
ssh -p 1904 root@n2.ckey.vn

<!-- apt update
apt install sudo -y

adduser admin
usermod -aG sudo admin
su - admin -->
~/cleanup_vps.sh



bash /tmp/fix_supervisor.sh

mkdir /opt/app

scp -P 3931 .\main.py root@n1.ckey.vn:/opt/app/main.py
scp -P 3931 .\setup.sh root@n1.ckey.vn:~/setup.sh

chmod +x ~/setup.sh
~/setup.sh

### 5. Start service
supervisorctl start highlight-api
supervisorctl restart highlight-api

# Check status
supervisorctl status highlight-api

# View logs
tail -f /var/log/highlight-api.out.log
tail -f /var/log/highlight-api.err.log

# Test
curl http://localhost:8000/