#!/usr/bin/env bash

# create project folder
sudo mkdir "/var/www/html/viz"

# update / upgrade
sudo apt-get update
sudo apt-get -y upgrade

# install apache 2.5
sudo apt-get install -y apache2

# setup hosts file
VHOST=$(cat <<EOF
<VirtualHost *:80>
    DocumentRoot "/var/www/html/viz"
    <Directory "/var/www/html/viz">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
EOF
)
echo "${VHOST}" > /etc/apache2/sites-available/000-default.conf

# enable mod_rewrite
sudo a2enmod rewrite

# restart apache
service apache2 restart

# install git
sudo apt-get -y install git
